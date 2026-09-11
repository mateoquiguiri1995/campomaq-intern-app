import { API_BASE_URL } from '@/api/client';
import type { ApiProduct, ApiProductCommercialData } from '../api/productApi';
import type { Product } from '../types';

/**
 * El backend a veces devuelve rutas relativas (ej. logos de marca)
 * y a veces URLs absolutas ya listas para usar (ej. imágenes de
 * producto en Azure Blob Storage). Solo hay que anteponer la base
 * cuando la URL no viene absoluta.
 */
function resolveImageUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

/**
 * Convierte un producto del backend al modelo utilizado por la aplicación.
 * Los precios, el IVA y el stock vienen de /product-commercial-data: es la
 * fuente comercial vigente, más confiable que los precios de catálogo de
 * /products (que pueden quedar desactualizados).
 */
export function mapApiProduct(api: ApiProduct, commercial: ApiProductCommercialData): Product {
  return {
    // product_code es el identificador estable del catálogo y el que usa
    // /product-commercial-data. Usarlo también como id evita colisiones si
    // product_id viene repetido o no está disponible en una respuesta del backend.
    id: api.product_code,

    code: api.product_code,

    name: api.product_name,

    category: api.category_name,

    brand: api.brand_name,

    mainPrice: commercial.price_cash,

    brandLogo: api.brand_logo
    ? resolveImageUrl(api.brand_logo)
    : undefined,

    imageUrl: api.link?.[0]
      ? resolveImageUrl(api.link[0])
      : undefined,

    images: api.link?.map(resolveImageUrl),

    description: api.description,

    isNew: api.new_product,

    createdAt: api.created_at,

    updatedAt: api.updated_at,
    // Los tres precios vienen de los datos comerciales, no del catálogo.
    priceA: commercial.price_cash,
    priceB: commercial.price_card,
    priceC: commercial.price_credit,

    stockQty: commercial.stock,

    marginPct: api.margin,

    lastCost: commercial.last_cost,

    discount: api.discount,
    iva: Boolean(commercial.iva),
  };
}
