import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
  useFonts,
} from '@expo-google-fonts/barlow';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/common/LoadingScreen';
import { SalesLoadingScreen } from '@/components/common/SalesLoadingScreen';
import { UpdateNoticeScreen } from '@/components/common/UpdateNoticeScreen';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { AppBootstrapProvider, useAppBootstrap } from '@/features/bootstrap/AppBootstrapProvider';
import { QuoteBuilderProvider } from '@/features/quotes/QuoteBuilderProvider';
import { SellerProvider } from '@/features/sellers/SellerProvider';
import { useUpdateNotice } from '@/features/updates/useUpdateNotice';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Layout raíz de la app.
 *
 * Rutas protegidas con Stack.Protected: qué pantalla se monta depende de
 * si hay sesión (session) o no. Al iniciar sesión o cerrar sesión, el
 * AuthProvider actualiza `session` y el Stack cambia de rama solo — no
 * hace falta navegar manualmente a /login o /(tabs).
 */
const SESSION_MOUNT_KEY = Math.random().toString();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppBootstrapProvider>
          <SellerProvider>
            <SessionQuoteBuilder />
          </SellerProvider>
        </AppBootstrapProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/** El estado de una cotización en curso nunca se comparte entre cuentas. */
function SessionQuoteBuilder() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  return (
    <QuoteBuilderProvider userId={userId}>
      <StatusBar style="dark" />
      <RootNavigator />
    </QuoteBuilderProvider>
  );
}

function RootNavigator() {
  const { session, isLoading, hasSession, profileError, retryProfile } = useAuth();
  const { isLoading: isBootstrapping, progress: bootstrapProgress } = useAppBootstrap();
  const { showUpdateNotice, dismissUpdateNotice } = useUpdateNotice();
  const [showSplash, setShowSplash] = useState(true);
  const [showSalesSplash, setShowSalesSplash] = useState(false);
  const [isInitialBootDone, setIsInitialBootDone] = useState(false);
  const prevHasSession = useRef(hasSession);

  useEffect(() => {
    if (hasSession && !prevHasSession.current) {
      setShowSalesSplash(true);
      setIsInitialBootDone(false);
    } else if (!hasSession && prevHasSession.current) {
      setShowSalesSplash(false);
      setIsInitialBootDone(false);
    }
    prevHasSession.current = hasSession;
  }, [hasSession]);

  useEffect(() => {
    if (hasSession && !isLoading && !isBootstrapping) {
      setIsInitialBootDone(true);
      setShowSalesSplash(false);
    }
  }, [hasSession, isLoading, isBootstrapping]);

  if (showSplash) {
    return (
      <LoadingScreen
        title="Bienvenido"
        onComplete={() => setShowSplash(false)}
      />
    );
  }

  // Arranque en frío (sin sesión todavía confirmada por Supabase): validando
  // si hay una sesión guardada.
  if (isLoading && !hasSession) {
    return (
      <LoadingScreen
        title="Campo Maq"
        subtitle="Validando tu sesión"
        detail="Un momento, estamos preparando el acceso."
      />
    );
  }

  // hasSession ya es true (login recién hecho o sesión persistida): a partir
  // de acá /auth/me y la precarga de productos/clientes corren en paralelo.
  // Solo mostramos error de perfil a pantalla completa si aún no se ha completado el arranque inicial.
  if (hasSession && !isInitialBootDone && profileError) {
    return (
      <LoadingScreen
        title="No pudimos cargar tu perfil"
        subtitle="Revisa tu conexión e inténtalo de nuevo."
        detail={profileError}
        actionLabel="Reintentar"
        onAction={retryProfile}
      />
    );
  }

  // SalesLoadingScreen solo se muestra en el arranque inicial o login reciente.
  // Una vez montado el Stack, reconexiones o refrescos en segundo plano jamás desmontan la pantalla.
  if (hasSession && !isInitialBootDone && (showSalesSplash || isLoading || isBootstrapping)) {
    // Cálculo de progreso combinado:
    // - Si el perfil de usuario (/auth/me) aún carga, aporta 0%, si ya cargó aporta 30%
    // - El bootstrap de datos (productos y clientes) aporta el otro 70% proporcionalmente
    const combinedProgress = Math.min(100, Math.round((isLoading ? 0 : 30) + (bootstrapProgress * 0.7)));

    return (
      <SalesLoadingScreen
        progress={combinedProgress}
        onComplete={() => {
          setShowSalesSplash(false);
          setIsInitialBootDone(true);
        }}
      />
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" />
        </Stack.Protected>

        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="product/[id]" />
          <Stack.Screen name="client/[id]" />
          <Stack.Screen name="client/invoice/[invoiceNumber]" />
          <Stack.Screen name="quotes" />
        </Stack.Protected>
      </Stack>

      {showUpdateNotice && <UpdateNoticeScreen onComplete={dismissUpdateNotice} />}
    </>
  );
}
