/** Tipos del módulo de catálogo. */

export type ProductCategory = string;

export interface Product {
  id: string;

  code: string;

  name: string;

  category: ProductCategory;

  brand: string;

  brandLogo?: string;

  mainPrice: number;

  priceA: number;

  priceB: number;

  priceC: number;

  marginPct?: number;

  /** Último costo de compra (endpoint /product-commercial-data), base para calcular la utilidad. */
  lastCost?: number;

  stockQty: number;

  imageUrl?: string;

  /**
   * Todas las imágenes disponibles.
   */
  images?: string[];

  /**
   * HTML que contiene la ficha técnica.
   */
  description?: string;

  /**
   * Producto nuevo.
   */
  isNew?: boolean;

  createdAt?: string;

  updatedAt?: string;

  discount?: number;
  iva?: boolean;
}

export interface MonthlyGoal {
  id?: string;
  title?: string;
  period?: string;
  targetMargin: number;
  achievedMargin: number;
  percentage?: number;
}
