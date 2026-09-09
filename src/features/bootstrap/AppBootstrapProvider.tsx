import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import NetInfo from '@react-native-community/netinfo';

import { useAuth } from '@/features/auth/AuthProvider';
import type { Client } from '@/features/clients/types';
import { getAllClients, getClients } from '@/features/clients/services/clientService';
import type { Product } from '@/features/catalog/types';
import { getAllProducts, getProducts } from '@/features/catalog/services/productService';
import { AppState, type AppStateStatus } from 'react-native';
import {
  getCachedAllProducts,
  getCachedProducts,
  prefetchProductImages,
  saveCachedAllProducts,
  saveCachedProducts,
} from '@/features/catalog/services/productCache';

import {
  getCachedAllClients,
  getCachedClients,
  saveCachedAllClients,
  saveCachedClients,
} from '@/features/clients/services/clientCache';

const CLIENTS_PRELOAD_PAGE_SIZE = 10;

interface AppBootstrapContextValue {
  products: Product[];
  productsHasMore: boolean;
  clients: Client[];
  clientsTotal: number;
  /** Error de la carga inicial de productos. No bloquea el resto de la app si hay caché en disco. */
  productsError: string | null;
  /** Error de la carga inicial de clientes. No bloquea el resto de la app si hay caché en disco. */
  clientsError: string | null;
  /** Catálogo completo, para filtrar por búsqueda/categoría/marca. Se carga
   *  en segundo plano después del arranque rápido; null hasta que esté listo. */
  allProducts: Product[] | null;
  isLoadingAllProducts: boolean;
  /** Cartera completa de clientes, para búsqueda instantánea y trabajo offline. */
  allClients: Client[] | null;
  isLoadingAllClients: boolean;
  isLoading: boolean;
  /** true mientras hay una sincronización en segundo plano en curso (reload()/reconexión). */
  isSyncing: boolean;
  isOfflineMode: boolean;
  progress: number;
  reload: () => void;
  syncInBackground: () => Promise<void>;
}


const AppBootstrapContext = createContext<AppBootstrapContextValue | null>(null);

export function AppBootstrapProvider({ children }: PropsWithChildren) {
  const { hasSession } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [productsHasMore, setProductsHasMore] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsTotal, setClientsTotal] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[] | null>(null);
  const [isLoadingAllProducts, setIsLoadingAllProducts] = useState(false);
  const [allClients, setAllClients] = useState<Client[] | null>(null);
  const [isLoadingAllClients, setIsLoadingAllClients] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  const isSyncingRef = useRef(false);

  const syncInBackground = useCallback(async () => {
    if (!hasSession || isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const [productsRes, clientsRes, allProdRes, allCliRes] = await Promise.allSettled([
        getProducts({ page: 1 }),
        getClients({ page: 1, pageSize: CLIENTS_PRELOAD_PAGE_SIZE }),
        getAllProducts(),
        getAllClients(),
      ]);

      if (productsRes.status === 'fulfilled') {
        const loadedProducts = productsRes.value;
        setProducts(loadedProducts.products);
        setProductsHasMore(loadedProducts.hasMore);
        saveCachedProducts(loadedProducts.products, loadedProducts.hasMore);
        setProductsError(null);
      }

      if (clientsRes.status === 'fulfilled') {
        const loadedClients = clientsRes.value;
        setClients(loadedClients.clients);
        const total = loadedClients.total ?? loadedClients.clients.length;
        setClientsTotal(total);
        saveCachedClients(loadedClients.clients, total);
        setClientsError(null);
      }

      if (allProdRes.status === 'fulfilled') {
        const all = allProdRes.value;
        setAllProducts(all);
        saveCachedAllProducts(all);
        prefetchProductImages(all);
      }

      if (allCliRes.status === 'fulfilled') {
        const all = allCliRes.value;
        setAllClients(all);
        saveCachedAllClients(all);
      }

      if (productsRes.status === 'fulfilled' || clientsRes.status === 'fulfilled') {
        setIsOfflineMode(false);
      }
    } catch (err) {
      console.warn('[Bootstrap] Error en sincronización silenciosa de segundo plano:', err);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [hasSession]);

  const reload = useCallback(() => {
    // Si ya tenemos datos cargados en memoria, la sincronización se realiza en segundo plano
    // sin bloquear la app con isLoading: true ni alterar progress ni desmontar rutas.
    if (products.length > 0 || clients.length > 0 || allProducts !== null || allClients !== null) {
      syncInBackground();
    } else {
      setReloadIndex((current) => current + 1);
    }
  }, [products.length, clients.length, allProducts, allClients, syncInBackground]);

  // Arranque híbrido (Stale-While-Revalidate):
  // 1. Intenta cargar de inmediato desde el disco local para permitir operación offline sin esperas.
  // 2. En segundo plano consulta la API de Azure para refrescar el disco local con datos actualizados.
  useEffect(() => {
    let isMounted = true;

    if (!hasSession) {
      setProducts([]);
      setProductsHasMore(false);
      setClients([]);
      setClientsTotal(0);
      setAllProducts(null);
      setAllClients(null);
      setProductsError(null);
      setClientsError(null);
      setIsLoading(false);
      setIsOfflineMode(false);
      setProgress(0);
      return () => {
        isMounted = false;
      };
    }

    setIsLoading(true);
    setProductsError(null);
    setClientsError(null);
    setProgress(10);

    let hasLocalCache = false;

    // FASE 1: Lectura inmediata desde disco local (0ms o casi 0ms)
    Promise.all([
      getCachedProducts(),
      getCachedAllProducts(),
      getCachedClients(),
      getCachedAllClients(),
    ]).then(([cachedProducts, cachedAllProducts, cachedClients, cachedAllClients]) => {
      if (!isMounted) return;

      if (cachedProducts || cachedAllProducts || cachedClients || cachedAllClients) {
        hasLocalCache = true;
        if (cachedProducts) {
          setProducts(cachedProducts.products);
          setProductsHasMore(cachedProducts.hasMore);
        }
        if (cachedAllProducts) {
          setAllProducts(cachedAllProducts);
          if (!cachedProducts) setProducts(cachedAllProducts.slice(0, 20));
        }
        if (cachedClients) {
          setClients(cachedClients.clients);
          setClientsTotal(cachedClients.total);
        }
        if (cachedAllClients) {
          setAllClients(cachedAllClients);
          if (!cachedClients) {
            setClients(cachedAllClients.slice(0, 10));
            setClientsTotal(cachedAllClients.length);
          }
        }
        // Si había caché en disco, deshabilitamos la pantalla de carga para interacción inmediata
        setProgress(100);
        setIsLoading(false);
      }
    });

    // FASE 2: Sincronización en segundo plano con el backend
    let productsDone = false;
    let clientsDone = false;
    let productsSyncFailed = false;
    let clientsSyncFailed = false;

    const checkComplete = () => {
      if (!isMounted) return;
      if (productsDone && clientsDone) {
        setIsOfflineMode(hasLocalCache && (productsSyncFailed || clientsSyncFailed));
        setProgress(100);
        setIsLoading(false);
      } else if (productsDone || clientsDone) {
        setProgress((prev) => Math.max(prev, 60));
      }
    };

    getProducts({ page: 1 })
      .then((loadedProducts) => {
        if (!isMounted) return;
        setProducts(loadedProducts.products);
        setProductsHasMore(loadedProducts.hasMore);
        saveCachedProducts(loadedProducts.products, loadedProducts.hasMore);
        setProductsError(null);
        productsDone = true;
        checkComplete();
      })
      .catch((err) => {
        if (!isMounted) return;
        if (!hasLocalCache) {
          setProducts([]);
          setProductsHasMore(false);
          setProductsError(err instanceof Error ? err.message : 'No fue posible cargar los productos.');
        } else {
          productsSyncFailed = true;
        }
        productsDone = true;
        checkComplete();
      });

    getClients({ page: 1, pageSize: CLIENTS_PRELOAD_PAGE_SIZE })
      .then((loadedClients) => {
        if (!isMounted) return;
        setClients(loadedClients.clients);
        const total = loadedClients.total ?? loadedClients.clients.length;
        setClientsTotal(total);
        saveCachedClients(loadedClients.clients, total);
        setClientsError(null);
        clientsDone = true;
        checkComplete();
      })
      .catch((err) => {
        if (!isMounted) return;
        if (!hasLocalCache) {
          setClients([]);
          setClientsTotal(0);
          setClientsError(err instanceof Error ? err.message : 'No fue posible cargar los clientes.');
        } else {
          clientsSyncFailed = true;
        }
        clientsDone = true;
        checkComplete();
      });

    return () => {
      isMounted = false;
    };
  }, [hasSession, reloadIndex]);

  // Carga del catálogo completo de productos en segundo plano + actualización del disco local
  useEffect(() => {
    // No depende de `productsError`: ese error es del endpoint paginado
    // (getProducts), distinto del que usa esta carga (getAllProducts) — un
    // fallo transitorio de la página 1 no debe bloquear el catálogo completo.
    if (!hasSession || isLoading) return;

    let isMounted = true;
    // Difiere ligeramente la descarga pesada para no saturar los sockets de red durante el arranque inicial
    const timer = setTimeout(() => {
      if (!isMounted) return;
      setIsLoadingAllProducts(true);

      getAllProducts()
        .then((all) => {
          if (!isMounted) return;
          setAllProducts(all);
          saveCachedAllProducts(all);
          prefetchProductImages(all);
        })
        .catch(() => {
          // Silencioso: si falla la red, conservamos el allProducts obtenido del disco local
        })
        .finally(() => {
          if (isMounted) setIsLoadingAllProducts(false);
        });
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession, isLoading, reloadIndex]);

  // Carga de la cartera completa de clientes en segundo plano + actualización del disco local
  useEffect(() => {
    // No depende de `clientsError`: ese error es del endpoint paginado
    // (getClients), distinto del que usa esta carga (getAllClients) — un
    // fallo transitorio de la página 1 no debe bloquear la cartera completa.
    if (!hasSession || isLoading) return;

    let isMounted = true;
    // Difiere ligeramente la descarga pesada para no saturar los sockets de red durante el arranque inicial
    const timer = setTimeout(() => {
      if (!isMounted) return;
      setIsLoadingAllClients(true);

      getAllClients()
        .then((all) => {
          if (!isMounted) return;
          setAllClients(all);
          saveCachedAllClients(all);
        })
        .catch(() => {
          // Silencioso: si falla la red, conservamos el allClients obtenido del disco local
        })
        .finally(() => {
          if (isMounted) setIsLoadingAllClients(false);
        });
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession, isLoading, reloadIndex]);

  // Reconexión reactiva al recuperar la conexión a internet
  useEffect(() => {
    if (!hasSession) return;

    let wasOffline = false;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected === true && state.isInternetReachable !== false;
      if (!isOnline) {
        wasOffline = true;
        setIsOfflineMode(true);
      } else if (wasOffline) {
        wasOffline = false;
        setIsOfflineMode(false);
        syncInBackground();
      }
    });

    return unsubscribe;
  }, [hasSession, syncInBackground]);

  useEffect(() => {
    if (!hasSession) return;

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        NetInfo.fetch().then((state) => {
          const isOnline = state.isConnected === true && state.isInternetReachable !== false;
          if (isOnline) {
            setIsOfflineMode(false);
            syncInBackground();
          } else {
            setIsOfflineMode(true);
          }
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [hasSession, syncInBackground]);

  const value = useMemo<AppBootstrapContextValue>(
    () => ({
      products,
      productsHasMore,
      clients,
      clientsTotal,
      productsError,
      clientsError,
      allProducts,
      isLoadingAllProducts,
      allClients,
      isLoadingAllClients,
      isLoading,
      isSyncing,
      isOfflineMode,
      progress,
      reload,
      syncInBackground,
    }),
    [
      products,
      productsHasMore,
      clients,
      clientsTotal,
      productsError,
      clientsError,
      allProducts,
      isLoadingAllProducts,
      allClients,
      isLoadingAllClients,
      isLoading,
      isSyncing,
      isOfflineMode,
      progress,
      reload,
      syncInBackground,
    ]
  );

  return <AppBootstrapContext.Provider value={value}>{children}</AppBootstrapContext.Provider>;
}

export function useAppBootstrap() {
  const ctx = useContext(AppBootstrapContext);
  if (!ctx) {
    throw new Error('useAppBootstrap debe usarse dentro de <AppBootstrapProvider>.');
  }
  return ctx;
}
