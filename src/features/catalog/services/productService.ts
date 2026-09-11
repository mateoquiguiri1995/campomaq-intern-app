import type { Product } from '../types';

import {
  BACKEND_PRODUCTS_PAGE_SIZE,
  getProductCommercialDataFromApi,
  getProductsFromApi,
  searchProductsFromApi,
  type ApiProduct,
  type ApiProductCommercialData,
  type GetProductsFromApiParams,
} from '../api/productApi';

import { mapApiProduct } from './productMapper';

/**
 * `getProducts`/`getAllProducts`/`searchProducts` piden todas, por separado,
 * los datos comerciales completos (`GET /product-commercial-data`). Como
 * suelen dispararse juntas en la misma ronda de arranque/sincronización,
 * comparten una única promesa en vuelo para no duplicar el request; una vez
 * resuelta (éxito o error) se limpia, así la siguiente ronda sí vuelve a
 * pedir datos frescos.
 */
let sharedCommercialDataPromise: Promise<ApiProductCommercialData[]> | null = null;

function getSharedCommercialData(): Promise<ApiProductCommercialData[]> {
  if (!sharedCommercialDataPromise) {
    sharedCommercialDataPromise = getProductCommercialDataFromApi().finally(() => {
      sharedCommercialDataPromise = null;
    });
  }
  return sharedCommercialDataPromise;
}

export interface GetProductsParams extends GetProductsFromApiParams {}

export interface ProductsResult {
  products: Product[];
  page: number;
  /**
   * true si la página vino completa (BACKEND_PRODUCTS_PAGE_SIZE productos):
   * probablemente haya más para cargar. El backend no informa un total.
   */
  hasMore: boolean;
}

/**
 * Une productos y datos comerciales mediante el código de producto. Un
 * producto sin datos comerciales, o con stock negativo, no está disponible.
 */
function mapAvailableProducts(
  items: ApiProduct[],
  commercialItems: ApiProductCommercialData[]
): Product[] {
  const commercialByProductCode = new Map(
    commercialItems.map((commercial) => [commercial.product_code, commercial])
  );

  const seenCodes = new Set<string>();

  return items.flatMap((item) => {
    const commercial = commercialByProductCode.get(item.product_code);

    if (
      seenCodes.has(item.product_code) ||
      !commercial ||
      typeof commercial.stock !== 'number' ||
      commercial.stock < 0
    ) {
      return [];
    }

    seenCodes.add(item.product_code);
    return [mapApiProduct(item, commercial)];
  });
}

/**
 * Obtiene productos paginados desde la API.
 */
export async function getProducts(params: GetProductsParams = {}): Promise<ProductsResult> {
  const [items, commercialItems] = await Promise.all([
    getProductsFromApi(params),
    getSharedCommercialData(),
  ]);

  return {
    products: mapAvailableProducts(items, commercialItems),
    page: params.page ?? 1,
    hasMore: items.length >= BACKEND_PRODUCTS_PAGE_SIZE,
  };
}

/**
 * Catálogo completo, para filtrar por búsqueda/categoría/marca en el
 * cliente. Sin `page`, el backend ya devuelve todo el catálogo en una
 * sola respuesta, así que no hace falta recorrer páginas.
 */
export async function getAllProducts(): Promise<Product[]> {
  const [items, commercialItems] = await Promise.all([
    getProductsFromApi(),
    getSharedCommercialData(),
  ]);
  return mapAvailableProducts(items, commercialItems);
}

/**
 * Busca productos por nombre o código.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  if (!query.trim()) {
    return getAllProducts();
  }

  const [apiProducts, commercialItems] = await Promise.all([
    searchProductsFromApi(query),
    getSharedCommercialData(),
  ]);

  return mapAvailableProducts(apiProducts, commercialItems);
}
