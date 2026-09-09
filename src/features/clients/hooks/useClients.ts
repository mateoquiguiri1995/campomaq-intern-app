import { useEffect, useMemo, useRef, useState } from 'react';

import { useAppBootstrap } from '@/features/bootstrap/AppBootstrapProvider';
import { getClients, searchClients } from '../services/clientService';
import type { Client } from '../types';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export function useClients(statusFilter?: (client: Client) => boolean) {
  const {
    clients: bootClients,
    clientsTotal: bootClientsTotal,
    allClients,
    isLoadingAllClients,
    clientsError: bootClientsError,
    isLoading: bootLoading,
    isSyncing,
    reload,
  } = useAppBootstrap();

  const [browseClients, setBrowseClients] = useState<Client[]>(bootClients);
  const [browseHasMore, setBrowseHasMore] = useState(bootClients.length < bootClientsTotal);
  const [browsePage, setBrowsePage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRequestId = useRef(0);

  const trimmedSearch = search.trim();
  const isSearching = trimmedSearch.length > 0;

  // Cada vez que el bootstrap trae datos nuevos (arranque o reload()) se
  // reinicia la paginación real a la página 1, igual que en useCatalog.ts:
  // así el pull-to-refresh también funciona acá después de haber scrolleado.
  useEffect(() => {
    setBrowseClients(bootClients);
    setBrowseHasMore(bootClients.length < bootClientsTotal);
    setBrowsePage(1);
  }, [bootClients, bootClientsTotal]);

  /**
   * Búsqueda por texto con comportamiento híbrido: filtra inmediatamente
   * usando la caché local y dispara la búsqueda remota de fondo con debounce.
   */
  useEffect(() => {
    if (!isSearching) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const currentRequest = ++searchRequestId.current;
    setSearchLoading(true);
    setSearchResults([]);

    const handle = setTimeout(() => {
      searchClients(trimmedSearch)
        .then((results) => {
          if (currentRequest !== searchRequestId.current) return;
          setSearchResults(results);
        })
        .catch(() => {
          if (currentRequest !== searchRequestId.current) return;
          // Silencioso en fallo de red: la caché local ya cubre los resultados
          setSearchResults([]);
        })
        .finally(() => {
          if (currentRequest !== searchRequestId.current) return;
          setSearchLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [trimmedSearch, isSearching]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, statusFilter]);

  // 1. Filtrado local inmediato usando allClients (caché completa) con fallback a browseClients
  const cacheResults = useMemo(() => {
    if (!isSearching) return [];

    const localPool = allClients ?? browseClients;
    const query = trimmedSearch.toLowerCase();

    return localPool.filter((client) => {
      const matchesName = client.name.toLowerCase().includes(query);
      const matchesRuc = client.ruc ? client.ruc.toLowerCase().includes(query) : false;
      const matchesPhone = client.phone ? client.phone.toLowerCase().includes(query) : false;
      const matchesEmail = client.email ? client.email.toLowerCase().includes(query) : false;
      const matchesLocation = client.location ? client.location.toLowerCase().includes(query) : false;
      return matchesName || matchesRuc || matchesPhone || matchesEmail || matchesLocation;
    });
  }, [allClients, browseClients, isSearching, trimmedSearch]);

  // 2. Fusión híbrida libre de duplicados (prioridad a la API, seguido de la caché)
  const combinedSearchResults = useMemo(() => {
    if (!isSearching) return [];

    const apiIds = new Set(searchResults.map((c) => c.id));
    const uniqueCacheResults = cacheResults.filter((c) => !apiIds.has(c.id));

    return [...searchResults, ...uniqueCacheResults];
  }, [searchResults, cacheResults, isSearching]);

  /**
   * true cuando el listado sin búsqueda ya puede navegarse sobre la cartera
   * completa en memoria (allClients) en vez de sobre la paginación real de
   * red (browseClients). Antes de que allClients termine de cargar, se
   * sigue usando la paginación real como arranque rápido. Mismo patrón que
   * `usingLocalBrowseSource` en useCatalog.ts.
   */
  const usingLocalBrowseSource = !isSearching && allClients !== null;

  // Universo sin el filtro de estado (recencia/frecuencia): se usa para
  // saber si realmente no hay clientes cargados, sin confundirlo con
  // "ninguno matchea el filtro de estado actual".
  const rawSourceClients = useMemo(() => {
    if (isSearching) return combinedSearchResults;
    if (usingLocalBrowseSource) return allClients ?? [];
    return browseClients;
  }, [isSearching, combinedSearchResults, usingLocalBrowseSource, allClients, browseClients]);

  const sourceClients = useMemo(() => {
    return statusFilter ? rawSourceClients.filter(statusFilter) : rawSourceClients;
  }, [rawSourceClients, statusFilter]);

  /**
   * Cuando allClients termina de cargar en segundo plano y se pasa del modo
   * de paginación real (browseClients) al modo local (slice progresivo),
   * aseguramos que visibleCount nunca sea menor a lo que el usuario ya había
   * revelado por scroll: de lo contrario la lista "encogería" de golpe.
   */
  useEffect(() => {
    if (!isSearching && allClients) {
      setVisibleCount((current) => Math.max(current, browseClients.length, PAGE_SIZE));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allClients, isSearching]);

  const visibleClients = useMemo(() => {
    if (isSearching || usingLocalBrowseSource) {
      return sourceClients.slice(0, visibleCount);
    }
    return sourceClients;
  }, [sourceClients, isSearching, usingLocalBrowseSource, visibleCount]);

  async function loadMoreBrowsePage() {
    if (loadingMore || !browseHasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = browsePage + 1;
      const result = await getClients({ page: nextPage, pageSize: PAGE_SIZE });
      setBrowseClients((prev) => [...prev, ...result.clients]);
      setBrowsePage(nextPage);
      setBrowseHasMore(browseClients.length + result.clients.length < (result.total ?? bootClientsTotal));
    } catch {
      // Si falla la red y tenemos allClients, podemos expandir desde memoria local
      if (allClients && allClients.length > browseClients.length) {
        const nextSlice = allClients.slice(0, browseClients.length + PAGE_SIZE);
        setBrowseClients(nextSlice);
        setBrowseHasMore(nextSlice.length < allClients.length);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  function loadMore() {
    if (isSearching || usingLocalBrowseSource) {
      setVisibleCount((current) => current + PAGE_SIZE);
    } else {
      loadMoreBrowsePage();
    }
  }

  const hasMore = useMemo(() => {
    if (isSearching || usingLocalBrowseSource) {
      return visibleCount < sourceClients.length;
    }
    return browseHasMore;
  }, [isSearching, usingLocalBrowseSource, visibleCount, sourceClients.length, browseHasMore]);

  // Solo muestra error si no hay datos locales en disco que mostrar
  // (basado en el universo SIN el filtro de estado: que el filtro de estado
  // no deje a nadie visible no es un error de carga).
  const error = (rawSourceClients.length === 0 && !bootLoading) ? bootClientsError : null;

  return {
    clients: visibleClients,
    loading: bootLoading && browseClients.length === 0 && !allClients?.length,
    searchLoading,
    loadingMore,
    error,
    hasClients: rawSourceClients.length > 0,
    hasMore,
    hasActiveFilters: isSearching,
    search,
    setSearch,
    loadMore,
    refresh: reload,
    refreshing: bootLoading || isSyncing,
  };
}

