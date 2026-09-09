import type { Product } from '../types';

import {
  BACKEND_PRODUCTS_PAGE_SIZE,
  getProductsFromApi,
  getStockFromApi,
  searchProductsFromApi,
  type ApiProduct,
  type ApiStock,
  type GetProductsFromApiParams,
} from '../api/productApi';

import { mapApiProduct } from './productMapper';

/**
 * `getProducts`/`getAllProducts`/`searchProducts` piden todas, por separado,
 * el inventario completo (`GET /stock`). Como suelen dispararse juntas en la
 * misma ronda de arranque/sincronización, comparten una única promesa en
 * vuelo para no duplicar el request; una vez resuelta (éxito o error) se
 * limpia, así la siguiente ronda sí vuelve a pedir datos frescos.
 */
let sharedStockPromise: Promise<ApiStock[]> | null = null;

function getSharedStock(): Promise<ApiStock[]> {
  if (!sharedStockPromise) {
    sharedStockPromise = getStockFromApi().finally(() => {
      sharedStockPromise = null;
    });
  }
  return sharedStockPromise;
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
 * Une productos y existencias mediante el código de producto. Un producto
 * sin registro de stock, con stock cero o negativo no está disponible.
 */
function mapAvailableProducts(items: ApiProduct[], stockItems: ApiStock[]): Product[] {
  const stockByProductCode = new Map(
    stockItems.map(({ product_code, stock }) => [product_code, stock])
  );

  const seenCodes = new Set<string>();

  return items.flatMap((item) => {
    const stockQty = stockByProductCode.get(item.product_code);

    if (
      seenCodes.has(item.product_code) ||
      typeof stockQty !== 'number' ||
      stockQty < 0
    ) {
      return [];
    }

    seenCodes.add(item.product_code);
    return [mapApiProduct(item, stockQty)];
  });
}

/**
 * Obtiene productos paginados desde la API.
 */
export async function getProducts(params: GetProductsParams = {}): Promise<ProductsResult> {
  const [items, stockItems] = await Promise.all([
    getProductsFromApi(params),
    getSharedStock(),
  ]);

  return {
    products: mapAvailableProducts(items, stockItems),
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
  const [items, stockItems] = await Promise.all([getProductsFromApi(), getSharedStock()]);
  return mapAvailableProducts(items, stockItems);
}

/**
 * Busca productos por nombre o código.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  if (!query.trim()) {
    return getAllProducts();
  }

  const [apiProducts, stockItems] = await Promise.all([
    searchProductsFromApi(query),
    getSharedStock(),
  ]);

  return mapAvailableProducts(apiProducts, stockItems);
}
