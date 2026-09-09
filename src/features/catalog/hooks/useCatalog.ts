import { useEffect, useMemo, useRef, useState } from 'react';

import { useAppBootstrap } from '@/features/bootstrap/AppBootstrapProvider';
import { getProducts, searchProducts } from '../services/productService';
import type { Product } from '../types';

const PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 400;

export function useCatalog() {
  const {
    products: bootProducts,
    productsHasMore: bootProductsHasMore,
    allProducts,
    isLoadingAllProducts,
    isLoading: bootLoading,
    isSyncing,
    productsError,
    reload,
  } = useAppBootstrap();

  // Navegación normal (sin filtros): páginas reales traídas del backend.
  const [browseProducts, setBrowseProducts] = useState<Product[]>(bootProducts);
  const [browseHasMore, setBrowseHasMore] = useState(bootProductsHasMore);
  const [browsePage, setBrowsePage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Resultados de texto: vienen del endpoint /search (soporta coincidencias
  // que un simple "includes" en el cliente no encontraría). Se guardan
  // aparte de browseProducts/allProducts para no perder ninguno de los dos.
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRequestId = useRef(0);

  const trimmedSearch = search.trim();
  const isSearching = trimmedSearch.length > 0;
  const hasCategoryOrBrandFilter = selectedCategory !== 'Todos' || selectedBrand !== 'Todas';
  const hasActiveFilters = isSearching || hasCategoryOrBrandFilter;

  /**
   * Mientras no haya filtros activos, la "página 1" del listado sigue la
   * página que ya trajo el bootstrap. Cada vez que el bootstrap trae datos
   * nuevos (arranque o reload()/pull-to-refresh) se reinicia la paginación
   * real a la página 1 con los datos frescos, sin importar cuánto había
   * scrolleado el usuario antes: así el pull-to-refresh siempre funciona,
   * en vez de quedar inoperante después del primer `loadMore`.
   */
  useEffect(() => {
    setBrowseProducts(bootProducts);
    setBrowseHasMore(bootProductsHasMore);
    setBrowsePage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootProducts, bootProductsHasMore]);

  /**
   * Búsqueda por texto con comportamiento híbrido: filtra inmediatamente
   * usando la caché local y dispara la búsqueda remota de fondo con debounce.
   * Limpiamos los resultados asíncronos previos al cambiar el término para que
   * el catálogo muestre de forma instantánea y limpia la búsqueda local.
   */
  useEffect(() => {
    if (!isSearching) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const currentRequest = ++searchRequestId.current;
    setSearchLoading(true);

    // Limpiamos resultados de la API anteriores para dar paso instantáneo a la caché local
    setSearchResults([]);

    const handle = setTimeout(() => {
      searchProducts(trimmedSearch)
        .then((results) => {
          if (currentRequest !== searchRequestId.current) return;
          setSearchResults(results);
        })
        .catch(() => {
          if (currentRequest !== searchRequestId.current) return;
          setSearchResults([]);
        })
        .finally(() => {
          if (currentRequest !== searchRequestId.current) return;
          setSearchLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [trimmedSearch, isSearching]);

  /**
   * Al cambiar cualquier filtro, la paginación vuelve a empezar
   * desde la primera página.
   */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, selectedCategory, selectedBrand]);

  // 1. Filtrado local inmediato usando allProducts (caché) con fallback a browseProducts
  const cacheResults = useMemo(() => {
    if (!isSearching) return [];

    const localCatalog = allProducts ?? browseProducts;
    const query = trimmedSearch.toLowerCase();

    return localCatalog.filter((product) => {
      const matchesName = product.name.toLowerCase().includes(query);
      const matchesCode = product.code.toLowerCase().includes(query);
      const matchesBrand = product.brand ? product.brand.toLowerCase().includes(query) : false;
      return matchesName || matchesCode || matchesBrand;
    });
  }, [allProducts, browseProducts, isSearching, trimmedSearch]);

  // 2. Fusión híbrida libre de duplicados (prioridad a la API, seguido de la caché)
  const combinedSearchResults = useMemo(() => {
    if (!isSearching) return [];

    const apiIds = new Set(searchResults.map((p) => p.id));
    const uniqueCacheResults = cacheResults.filter((p) => !apiIds.has(p.id));

    return [...searchResults, ...uniqueCacheResults];
  }, [searchResults, cacheResults, isSearching]);

  /**
   * Con búsqueda de texto se parte del resultado híbrido unificado. Con solo
   * categoría/marca (sin texto) se filtra sobre el catálogo completo ya
   * cargado en memoria. Sin filtros, se navega el listado paginado tal cual
   * llega del backend.
   */
  const sourceProducts = isSearching
    ? combinedSearchResults
    : hasCategoryOrBrandFilter
      ? allProducts ?? []
      // Sin filtros: en cuanto el catálogo completo (allProducts) esté
      // disponible se prefiere sobre browseProducts (paginación real de
      // backend) para poder ordenar y revelar más productos localmente sin
      // reordenar tarjetas ya mostradas (ver `usingLocalBrowseSource`).
      : allProducts ?? browseProducts;

  const filteredProducts = useMemo(() => {
    if (!hasActiveFilters) return sourceProducts;

    return sourceProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === 'Todos' || product.category === selectedCategory;

      const matchesBrand = selectedBrand === 'Todas' || product.brand === selectedBrand;

      return matchesCategory && matchesBrand;
    });
  }, [sourceProducts, hasActiveFilters, selectedCategory, selectedBrand]);

  /**
   * true cuando el listado sin filtros ya puede navegarse sobre el catálogo
   * completo en memoria (allProducts) en vez de sobre la paginación real de
   * red (browseProducts). Antes de que allProducts termine de cargar, se
   * sigue usando la paginación real como arranque rápido.
   */
  const usingLocalBrowseSource = !hasActiveFilters && allProducts !== null;

  /**
   * Los productos se muestran tal como llegan de la API, sin reordenarlos en
   * el cliente. Con filtros activos, o sin filtros una vez cargado el
   * catálogo completo, "cargar más" revela más de lo que ya está en memoria
   * (slice progresivo con visibleCount) — nunca reubica tarjetas ya
   * mostradas, porque nunca se reordena nada. Sin filtros y todavía sin el
   * catálogo completo, la lista viene paginada real desde el backend
   * (browseProducts crece con cada loadMoreBrowsePage()), así que se
   * muestra completa.
   */
  const visibleProducts = useMemo(() => {
    if (hasActiveFilters || usingLocalBrowseSource) {
      return filteredProducts.slice(0, visibleCount);
    }
    return filteredProducts;
  }, [filteredProducts, visibleCount, hasActiveFilters, usingLocalBrowseSource]);

  /**
   * Cuando allProducts termina de cargar en segundo plano y se pasa del modo
   * de paginación real (browseProducts) al modo local (slice progresivo),
   * aseguramos que visibleCount nunca sea menor a lo que el usuario ya había
   * revelado por scroll: de lo contrario la lista "encogería" de golpe.
   */
  useEffect(() => {
    if (!hasActiveFilters && allProducts) {
      setVisibleCount((current) => Math.max(current, browseProducts.length, PAGE_SIZE));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProducts, hasActiveFilters]);

  async function loadMoreBrowsePage() {
    if (loadingMore || !browseHasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = browsePage + 1;
      const result = await getProducts({ page: nextPage });
      setBrowseProducts((prev) => {
      const existingCodes = new Set(prev.map((product) => product.code));

      return [
        ...prev,
        ...result.products.filter((product) => !existingCodes.has(product.code)),
      ];
      });
      setBrowsePage(nextPage);
      setBrowseHasMore(result.hasMore);
    } catch {
      // Si falla la API (offline) y tenemos allProducts en disco local, expandimos desde memoria
      if (allProducts && allProducts.length > browseProducts.length) {
        const nextSlice = allProducts.slice(0, browseProducts.length + PAGE_SIZE);
        setBrowseProducts(nextSlice);
        setBrowseHasMore(nextSlice.length < allProducts.length);
      }
    } finally {
      setLoadingMore(false);
    }

  }

  function loadMore() {
    if (hasActiveFilters || usingLocalBrowseSource) {
      setVisibleCount((current) => current + PAGE_SIZE);
    } else {
      loadMoreBrowsePage();
    }
  }

  /**
   * Limpia búsqueda y filtros para volver al catálogo completo.
   */
  function resetFilters() {
    setSearch('');
    setSelectedCategory('Todos');
    setSelectedBrand('Todas');
  }

  /**
   * Marcas únicas. Mientras el catálogo completo no esté listo, se
   * calculan con lo que ya se cargó (crecen solas cuando allProducts llega).
   */
  const brands = useMemo(() => {
    const source = allProducts ?? browseProducts;
    return ['Todas', ...new Set(source.map((p) => p.brand))];
  }, [allProducts, browseProducts]);

  /**
   * Categorías únicas
   */
  const categories = useMemo(() => {
    const source = allProducts ?? browseProducts;
    return ['Todos', ...new Set(source.map((p) => p.category))];
  }, [allProducts, browseProducts]);

  const hasMore = hasActiveFilters || usingLocalBrowseSource
    ? visibleCount < filteredProducts.length
    : browseHasMore;

  return {
    loading:
      (bootLoading && browseProducts.length === 0 && !allProducts?.length) ||
      // No depende de `isLoadingAllProducts`: la carga del catálogo completo
      // se difiere ~1.2s tras el arranque, y en ese margen `isLoadingAllProducts`
      // todavía es `false` aunque `allProducts` siga sin llegar — sin este
      // chequeo, filtrar por categoría/marca en ese margen mostraba un falso
      // "sin resultados" en vez de un estado de carga.
      (hasCategoryOrBrandFilter && !isSearching && allProducts === null),

    // Búsqueda en curso: se expone aparte del `loading` general para no
    // reemplazar toda la pantalla por un spinner en cada letra escrita.
    searchLoading,

    error: productsError,

    products: visibleProducts,

    totalProducts: filteredProducts.length,

    // Refleja si el backend tiene productos, sin importar el filtro/búsqueda
    // activos en este momento (que pueden legítimamente no tener resultados).
    hasProducts: browseProducts.length > 0,

    hasMore,

    hasActiveFilters,

    resetFilters,

    search,

    setSearch,

    selectedCategory,

    setSelectedCategory,

    selectedBrand,

    setSelectedBrand,

    categories,

    brands,

    loadMore,

    refresh: reload,

    // bootLoading cubre el arranque en frío; isSyncing cubre el
    // pull-to-refresh manual (antes no se reflejaba y el spinner
    // desaparecía de inmediato aunque la sincronización siguiera en curso).
    refreshing: bootLoading || isSyncing,
  };
}
