import { ApiError, apiGet, setApiAccessToken } from '@/api/client';
import { supabase } from '@/lib/supabase';
import * as secureStore from '@/utils/secureStore';
import { Directory, File, Paths } from 'expo-file-system';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import * as authService from './services/authService';
import type { AuthSession, LoginCredentials } from './types';

const AVATAR_OVERRIDE_KEY_PREFIX = 'campomaq_avatar_v1';
const USER_PROFILE_CACHE_KEY_PREFIX = 'campomaq_profile_v1';
const LEGACY_AVATAR_OVERRIDE_KEY = 'campomaq-avatar-override';
const MOCK_SESSION_KEY = 'campomaq-mock-session';


interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  /**
   * true en cuanto Supabase confirma credenciales válidas, incluso antes de
   * que /auth/me termine de traer el perfil. Sirve para arrancar la
   * precarga de productos/clientes en paralelo con /auth/me en lugar de
   * esperar a que `session` (perfil completo) esté listo.
   */
  hasSession: boolean;
  /** Error temporal al cargar el perfil del vendedor. */
  profileError: string | null;
  loginWithPassword: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (uri: string) => Promise<void>;
  retryProfile: () => Promise<void>;
}

interface MeResponse {
  name: string;
  email: string;
  role: 'vendedor';
  avatarUrl?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function avatarOverrideKey(userId: string): string {
  const safeUserId = userId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${AVATAR_OVERRIDE_KEY_PREFIX}_${safeUserId}`;
}

function userProfileCacheKey(userId: string): string {
  const safeUserId = userId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${USER_PROFILE_CACHE_KEY_PREFIX}_${safeUserId}`;
}

function cleanUri(uri: string): string {
  return uri.split('?')[0];
}

async function saveAvatarFile(userId: string, pickerUri: string): Promise<string> {
  try {
    if (!Paths.document) {
      return pickerUri;
    }
    const cleanPickerUri = cleanUri(pickerUri);
    const extensionMatch = cleanPickerUri.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extensionMatch ? extensionMatch[1] : 'jpg';
    const fileName = `avatar_${encodeURIComponent(userId)}.${ext}`;
    const targetFile = new File(Paths.document, fileName);

    if (targetFile.exists) {
      targetFile.delete();
    }

    if (pickerUri.startsWith('http://') || pickerUri.startsWith('https://')) {
      await File.downloadFileAsync(pickerUri, targetFile, { idempotent: true });
    } else {
      try {
        const sourceFile = new File(cleanPickerUri);
        sourceFile.copy(targetFile);
      } catch (copyErr) {
        console.warn('[Auth] sourceFile.copy falló, intentando respaldo con bytes:', copyErr);
        const sourceFile = new File(cleanPickerUri);
        const base64Data = await sourceFile.base64();
        targetFile.write(base64Data, { encoding: 'base64' });
      }
    }

    return `${targetFile.uri}?t=${Date.now()}`;
  } catch (error) {
    console.warn('[Auth] Error guardando avatar permanentemente:', error);
    return pickerUri;
  }
}

async function resolveValidAvatarUri(userId: string, storedUri: string | null): Promise<string | null> {
  try {
    if (storedUri) {
      if (!storedUri.startsWith('file://')) {
        return storedUri;
      }
      const rawPath = cleanUri(storedUri);
      const file = new File(rawPath);
      if (file.exists) {
        return `${file.uri}?t=${Date.now()}`;
      }
    }

    if (Paths.document) {
      const docDir = new Directory(Paths.document);
      const items = docDir.list();
      const targetPrefix = `avatar_${encodeURIComponent(userId)}`;

      const matchedFile = items.find(
        (item): item is File => item instanceof File && item.name.startsWith(targetPrefix)
      );

      if (matchedFile && matchedFile.exists) {
        await secureStore.setItemAsync(avatarOverrideKey(userId), matchedFile.uri);
        return `${matchedFile.uri}?t=${Date.now()}`;
      }
    }

    if (storedUri) {
      console.warn('[Auth] La ruta del avatar guardado no existe en disco:', storedUri);
    }
    return null;
  } catch (error) {
    console.warn('[Auth] Error al verificar el archivo del avatar:', error);
    return storedUri;
  }
}

// -------------------- AuthProvider (REAL - Supabase + /auth/me) --------------
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const authVersion = useRef(0);
  const hasActiveSessionRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  async function loadProfile(accessToken: string, userId: string, version: number) {
    try {
      const me = await apiGet<MeResponse>('/auth/me');
      const rawAvatarOverride = await secureStore.getItemAsync(avatarOverrideKey(userId));
      const avatarOverride = await resolveValidAvatarUri(userId, rawAvatarOverride);
      await secureStore.setItemAsync(userProfileCacheKey(userId), JSON.stringify(me));

      if (authVersion.current !== version) return;

      setSession({
        user: {
          id: userId,
          name: me.name,
          email: me.email,
          role: me.role,
          avatar: avatarOverride ?? me.avatarUrl,
        },
        token: accessToken,
      });
      setProfileError(null);
    } catch (error) {
      if (authVersion.current !== version) return;
      console.warn('[Auth] /auth/me falló:', error);
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setProfileError(null);
        await supabase.auth.signOut();
        return;
      }
      const cachedProfile = await secureStore.getItemAsync(userProfileCacheKey(userId));
      if (!cachedProfile) {
        setProfileError(error instanceof Error ? error.message : 'No fue posible cargar tu perfil.');
      }
    }
  }

  useEffect(() => {
    let isMounted = true;
    secureStore.deleteItemAsync(LEGACY_AVATAR_OVERRIDE_KEY);

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setApiAccessToken(newSession?.access_token ?? null);

      // Keep the auth callback quick and do cache/profile work afterward.
      setTimeout(async () => {
        if (!isMounted) return;
        const version = ++authVersion.current;

        if (!newSession) {
          hasActiveSessionRef.current = false;
          currentUserIdRef.current = null;
          setHasSession(false);
          setSession(null);
          setProfileError(null);
          setIsLoading(false);
          return;
        }

        const userId = newSession.user.id;
        const isBackgroundRefresh = hasActiveSessionRef.current && currentUserIdRef.current === userId;

        if (isBackgroundRefresh) {
          // Si el usuario ya está autenticado en la sesión actual (por ejemplo reconexión a internet
          // o refresco de token TOKEN_REFRESHED), actualizamos el token y revalidamos el perfil
          // en segundo plano de manera silenciosa, SIN activar isLoading global ni desmontar pantallas.
          setSession((prev) => (prev ? { ...prev, token: newSession.access_token } : null));
          await loadProfile(newSession.access_token, userId, version);
          return;
        }

        hasActiveSessionRef.current = true;
        currentUserIdRef.current = userId;

        // Recuperación instantánea de perfil y avatar desde disco local
        const [cachedProfileJson, rawAvatarOverride] = await Promise.all([
          secureStore.getItemAsync(userProfileCacheKey(userId)),
          secureStore.getItemAsync(avatarOverrideKey(userId)),
        ]);
        const avatarOverride = await resolveValidAvatarUri(userId, rawAvatarOverride);

        let cachedName = '';
        let cachedRole: 'vendedor' = 'vendedor';
        let cachedAvatarUrl: string | undefined = undefined;

        if (cachedProfileJson) {
          try {
            const parsed = JSON.parse(cachedProfileJson) as MeResponse;
            cachedName = parsed.name;
            cachedRole = parsed.role;
            cachedAvatarUrl = parsed.avatarUrl;
          } catch {}
        }

        if (!cachedName) {
          const metadataName =
            (newSession.user.user_metadata?.name as string | undefined) ||
            (newSession.user.user_metadata?.full_name as string | undefined);
          if (metadataName) {
            cachedName = metadataName;
          } else if (newSession.user.email) {
            const prefix = newSession.user.email.split('@')[0];
            cachedName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
          } else {
            cachedName = 'Vendedor';
          }
        }

        const initialUser = {
          id: userId,
          name: cachedName,
          email: newSession.user.email ?? '',
          role: cachedRole,
          avatar: avatarOverride ?? cachedAvatarUrl,
        };

        if (!cachedProfileJson) {
          await secureStore.setItemAsync(
            userProfileCacheKey(userId),
            JSON.stringify({
              name: initialUser.name,
              email: initialUser.email,
              role: initialUser.role,
              avatarUrl: initialUser.avatar,
            })
          );
        }

        setSession({
          user: initialUser,
          token: newSession.access_token,
        });

        setHasSession(true);
        setProfileError(null);
        setIsLoading(true);
        await loadProfile(newSession.access_token, userId, version);
        if (isMounted && authVersion.current === version) setIsLoading(false);
      }, 0);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function loginWithPassword(credentials: LoginCredentials) {
    await authService.loginWithPassword(credentials);
  }

  async function logout() {
    await authService.logout();
  }

  async function updateAvatar(uri: string) {
    if (!session) return;
    const userId = session.user.id;
    try {
      const stableUri = await saveAvatarFile(userId, uri);
      await secureStore.setItemAsync(avatarOverrideKey(userId), stableUri);

      const cachedProfileJson = await secureStore.getItemAsync(userProfileCacheKey(userId));
      let profileObj: Partial<MeResponse> = {};
      if (cachedProfileJson) {
        try {
          profileObj = JSON.parse(cachedProfileJson);
        } catch {}
      }
      profileObj.avatarUrl = stableUri;
      if (!profileObj.name) profileObj.name = session.user.name;
      if (!profileObj.email) profileObj.email = session.user.email;
      if (!profileObj.role) profileObj.role = session.user.role;

      await secureStore.setItemAsync(userProfileCacheKey(userId), JSON.stringify(profileObj));

      setSession((prev) => (prev ? { ...prev, user: { ...prev.user, avatar: stableUri } } : null));
    } catch (error) {
      console.warn('[Auth] Error actualizando avatar:', error);
      setSession((prev) => (prev ? { ...prev, user: { ...prev.user, avatar: uri } } : null));
    }
  }

  async function retryProfile() {
    if (!session) return;

    setProfileError(null);
    setIsLoading(true);
    const version = ++authVersion.current;
    await loadProfile(session.token, session.user.id, version);
    if (authVersion.current === version) setIsLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        hasSession,
        profileError,
        loginWithPassword,
        logout,
        updateAvatar,
        retryProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return ctx;
}
