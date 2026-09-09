import type { Product } from '../catalog/types';
import type { Client } from '../clients/types';

/** Qué lista de precios se aplica a una línea de la cotización. */
export type PriceTier = 'A' | 'B' | 'C';

export interface QuoteItem {
  product: Product;
  quantity: number;
  priceTier: PriceTier;
  /** Descuento opcional en porcentaje (0-100). */
  discountPct?: number;
  /** Descuento opcional en dólares aplicado al total de esta línea. */
  discountAmount?: number;
}

/**
 * Datos mínimos de un cliente escrito a mano solo para esta cotización.
 * Vive únicamente dentro del documento local: nunca se sube al backend.
 */
export interface ManualClientInfo {
  name: string;
  /** Teléfono o correo, lo que el vendedor tenga a mano. */
  contact: string;
}

/**
 * El cliente de una cotización viene de la cartera (mock/API) o se escribe
 * a mano para este documento puntual. El caso "manual" jamás debe
 * confundirse con un cliente real de la base de datos.
 */
export type QuoteClient =
  | { kind: 'registered'; client: Client }
  | { kind: 'manual'; client: ManualClientInfo };

export type QuoteStatus = 'Pendiente' | 'Enviada' | 'Aceptada' | 'Rechazada';

export interface Quote {
  id: string;
  client: QuoteClient;
  items: QuoteItem[];
  status: QuoteStatus;
  observations?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}
