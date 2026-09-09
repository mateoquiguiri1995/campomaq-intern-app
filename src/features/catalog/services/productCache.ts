import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from '../types';

const PRODUCTS_CACHE_KEY = 'campomaq:cache:products:v1';
const ALL_PRODUCTS_CACHE_KEY = 'campomaq:cache:all_products:v1';

export interface CachedProductsPage {
  products: Product[];
  /** true si, al guardar, el backend indicaba que había más páginas por cargar. */
  hasMore: boolean;
}

/**
 * Carga la primera página de productos guardada en el disco del dispositivo,
 * junto con si esa página tenía más productos por cargar.
 */
export async function getCachedProducts(): Promise<CachedProductsPage | null> {
  try {
    const raw = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Compatibilidad con caché guardada por una versión anterior (solo el array).
    if (Array.isArray(parsed)) {
      return { products: parsed as Product[], hasMore: true };
    }
    return parsed as CachedProductsPage;
  } catch {
    return null;
  }
}

/**
 * Guarda la primera página de productos en el disco del dispositivo, junto
 * con si el backend indicó que hay más páginas disponibles.
 */
export async function saveCachedProducts(products: Product[], hasMore: boolean): Promise<void> {
  try {
    const payload: CachedProductsPage = { products, hasMore };
    await AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('[Cache] Error guardando página de productos:', error);
  }
}

/**
 * Carga el catálogo completo de productos guardado en el disco del dispositivo.
 */
export async function getCachedAllProducts(): Promise<Product[] | null> {
  try {
    const raw = await AsyncStorage.getItem(ALL_PRODUCTS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : null;
  } catch {
    return null;
  }
}

/**
 * Guarda el catálogo completo de productos en el disco del dispositivo.
 */
export async function saveCachedAllProducts(products: Product[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ALL_PRODUCTS_CACHE_KEY, JSON.stringify(products));
  } catch (error) {
    console.warn('[Cache] Error guardando catálogo completo:', error);
  }
}

import { Image } from 'expo-image';

/**
 * Precarga en segundo plano las imágenes de los productos principales en el disco
 */
export async function prefetchProductImages(products: Product[], limit = 30): Promise<void> {
  try {
    const urls = products
      .slice(0, limit)
      .flatMap((p) => [p.imageUrl, ...(p.images ?? [])])
      .filter((url): url is string => typeof url === 'string' && url.startsWith('http'));

    const uniqueUrls = [...new Set(urls)];
    await Promise.allSettled(uniqueUrls.map((url) => Image.prefetch(url)));
  } catch {
    // Silencioso en caso de fallo de red
  }
}


