import { apiGet } from '@/api/client';

/**
 * Modelo EXACTO que devuelve el backend.
 * No debe modificarse para adaptarlo a la UI.
 */
export interface ApiProduct {
  product_id: number;
  product_code: string;
  product_name: string;
  category_name: string;
  brand_name: string;
  brand_logo?: string;
  new_product?: boolean;
  created_at?: string;
  updated_at?: string;
  price_cash: number;
  price_card: number;
  price_credit: number;
  description?: string;
  link: string[];

  margin?: number;
  discount?: number;
  iva?: boolean;
}

/**
 * Datos comerciales de un producto devueltos por el endpoint
 * /product-commercial-data: existencia, precios vigentes y costos.
 * Reemplaza al antiguo /stock, que solo traía `stock`.
 */
export interface ApiProductCommercialData {
  product_id: number;
  product_code: string;
  stock: number;
  average_cost: number;
  /** Último costo de compra: base para calcular la utilidad de cada precio. */
  last_cost: number;
  price_cash: number;
  price_card: number;
  price_credit: number;
  iva: boolean;
}

/**
 * El backend devuelve el array de productos plano (sin envolver en
 * { items, total, ... }) y todavía no soporta `pageSize`: con `page`
 * aplica una página fija de BACKEND_PRODUCTS_PAGE_SIZE productos; sin
 * `page`, devuelve el catálogo completo en una sola respuesta.
 */
export const BACKEND_PRODUCTS_PAGE_SIZE = 20;

export interface GetProductsFromApiParams {
  page?: number;
}

/**
 * Obtiene productos desde el backend.
 */
export async function getProductsFromApi(
  params: GetProductsFromApiParams = {}
): Promise<ApiProduct[]> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));

  const query = searchParams.toString();
  return apiGet<ApiProduct[]>(`/products${query ? `?${query}` : ''}`);
}

/**
 * Obtiene los datos comerciales vigentes (stock, precios y costos)
 * identificados por código de producto.
 */
export async function getProductCommercialDataFromApi(): Promise<ApiProductCommercialData[]> {
  return apiGet<ApiProductCommercialData[]>('/product-commercial-data');
}

/**
 * Busca productos por nombre o código.
 */
export async function searchProductsFromApi(
  query: string
): Promise<ApiProduct[]> {
  const params = new URLSearchParams({
    q: query,
  });

  return apiGet<ApiProduct[]>(`/search?${params.toString()}`);
}
