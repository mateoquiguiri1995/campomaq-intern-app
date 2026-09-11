import type { Product } from '../../catalog/types';
import type { PriceTier, QuoteItem } from '../types';

/** Tasa de IVA vigente en Ecuador. Fija por ahora (no editable por cotización). */
export const IVA_RATE = 0.15;

/** Redondeo preciso a 2 decimales para evitar problemas de coma flotante. */
export function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function getUnitPrice(product: Product, tier: PriceTier): number {
  if (tier === 'A') return product.priceA;
  if (tier === 'B') return product.priceB;
  return product.priceC;
}

/**
 * Utilidad = (precio de venta - último costo) / último costo, en porcentaje.
 * `null` cuando no hay último costo (producto sin datos comerciales) para no
 * mostrar una utilidad engañosa.
 */
export function getUtilityPct(unitPrice: number, lastCost: number | undefined): number | null {
  if (!lastCost || lastCost <= 0) return null;
  return ((unitPrice - lastCost) / lastCost) * 100;
}

export function getLineGross(item: QuoteItem): number {
  return round2(getUnitPrice(item.product, item.priceTier) * item.quantity);
}

/**
 * El descuento fijo corresponde al total de la línea, no a cada unidad.
 * Se limita al valor de la línea para que el subtotal nunca sea negativo.
 */
export function getLineDiscount(item: QuoteItem): number {
  const gross = getLineGross(item);
  const fixedDiscount = Number(item.discountAmount);

  if (Number.isFinite(fixedDiscount) && fixedDiscount > 0) {
    return round2(Math.min(gross, fixedDiscount));
  }

  const percentageDiscount = Number(item.discountPct);
  if (Number.isFinite(percentageDiscount) && percentageDiscount > 0) {
    return round2((gross * Math.min(100, percentageDiscount)) / 100);
  }

  return 0;
}

export function getLineTotal(item: QuoteItem): number {
  return round2(Math.max(0, getLineGross(item) - getLineDiscount(item)));
}

export interface QuoteTotals {
  grossSubtotal: number;
  totalDiscount: number;
  subtotal: number;
  subtotal15: number;
  subtotal0: number;
  iva: number;
  total: number;
}

export function getQuoteTotals(items: QuoteItem[]): QuoteTotals {
  let grossSubtotal = 0;
  let totalDiscount = 0;
  let subtotal15 = 0;
  let subtotal0 = 0;

  for (const item of items) {
    const gross = getLineGross(item);
    const discount = getLineDiscount(item);
    const lineTotal = getLineTotal(item);

    grossSubtotal += gross;
    totalDiscount += discount;

    if (item.product?.iva) {
      subtotal15 += lineTotal;
    } else {
      subtotal0 += lineTotal;
    }
  }

  grossSubtotal = round2(grossSubtotal);
  totalDiscount = round2(totalDiscount);
  subtotal15 = round2(subtotal15);
  subtotal0 = round2(subtotal0);
  const subtotal = round2(subtotal15 + subtotal0);
  const iva = round2(subtotal15 * IVA_RATE);
  const total = round2(subtotal + iva);

  return {
    grossSubtotal,
    totalDiscount,
    subtotal,
    subtotal15,
    subtotal0,
    iva,
    total,
  };
}
