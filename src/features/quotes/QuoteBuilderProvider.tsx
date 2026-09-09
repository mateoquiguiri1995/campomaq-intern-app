import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import type { Product } from '../catalog/types';
import * as quoteService from './services/quoteService';
import type { PriceTier, Quote, QuoteClient, QuoteItem, QuoteStatus } from './types';

function generateId(): string {
  // `expo-crypto` (randomUUID) no es dependencia de este proyecto todavía,
  // así que en vez de agregarla solo para esto, se refuerza la entropía del
  // generador actual (dos segmentos aleatorios en vez de uno) para volver
  // la colisión aún más improbable sin tocar package.json.
  const randomPart = `${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 8)}`;
  return `q-${Date.now()}-${randomPart}`;
}

interface AddItemOptions {
  quantity: number;
  priceTier: PriceTier;
  discountPct?: number;
  discountAmount?: number;
}

interface QuoteBuilderContextValue {
  id: string;
  client: QuoteClient | null;
  items: QuoteItem[];
  status: QuoteStatus;
  observations: string;
  termsAndConditions: string;
  createdAt: string;
  setClient: (client: QuoteClient) => void;
  setTermsAndObservations: (terms: string, obs: string) => void;
  /** Agrega el producto o, si ya estaba en la cotización, reemplaza esa línea. */
  addItem: (product: Product, options: AddItemOptions) => void;
  updateItem: (productId: string, patch: Partial<AddItemOptions>) => void;
  removeItem: (productId: string) => void;
  /** Carga una cotización guardada para verla o, si está pendiente, editarla. */
  loadDraft: (draftId: string) => Promise<void>;
  /** Crea una nueva cotización pendiente a partir de la actual. */
  duplicateQuote: () => Promise<void>;
  /** Persiste el estado actual como borrador y lo devuelve. */
  saveDraft: (extra?: { observations?: string; termsAndConditions?: string }) => Promise<Quote>;
  /** Persiste el estado actual como "generada" (ya se creó/compartió el PDF). */
  markGenerated: (extra?: { observations?: string; termsAndConditions?: string }) => Promise<Quote>;
  resetBuilder: () => void;
}

const QuoteBuilderContext = createContext<QuoteBuilderContextValue | null>(null);

interface QuoteBuilderProviderProps extends PropsWithChildren {
  userId: string | null;
}

export function QuoteBuilderProvider({ children, userId }: QuoteBuilderProviderProps) {
  const [id, setId] = useState(generateId);
  const [client, setClientState] = useState<QuoteClient | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [status, setStatus] = useState<QuoteStatus>('Pendiente');
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString());
  const [observations, setObservations] = useState<string>('');
  const [termsAndConditions, setTermsAndConditions] = useState<string>('');

  const resetBuilder = useCallback(() => {
    setId(generateId());
    setClientState(null);
    setItems([]);
    setStatus('Pendiente');
    setCreatedAt(new Date().toISOString());
    setObservations('');
    setTermsAndConditions('');
  }, []);

  const prevUserIdRef = useRef<string | null>(userId);

  useEffect(() => {
    if (userId) {
      if (prevUserIdRef.current && prevUserIdRef.current !== userId) {
        resetBuilder();
      }
      prevUserIdRef.current = userId;
    }
  }, [userId, resetBuilder]);

  const setClient = useCallback((next: QuoteClient) => {
    if (status === 'Pendiente') setClientState(next);
  }, [status]);

  const setTermsAndObservations = useCallback((terms: string, obs: string) => {
    setTermsAndConditions(terms);
    setObservations(obs);
  }, []);

  const addItem = useCallback((product: Product, options: AddItemOptions) => {
    if (status !== 'Pendiente') return;
    setItems((current) => [
      ...current.filter((item) => item.product.id !== product.id),
      {
        product,
        quantity: options.quantity,
        priceTier: options.priceTier,
        discountPct: options.discountPct,
        discountAmount: options.discountAmount,
      },
    ]);
  }, [status]);

  const updateItem = useCallback((productId: string, patch: Partial<AddItemOptions>) => {
    if (status !== 'Pendiente') return;
    setItems((current) =>
      current.map((item) => (item.product.id === productId ? { ...item, ...patch } : item))
    );
  }, [status]);

  const removeItem = useCallback((productId: string) => {
    if (status !== 'Pendiente') return;
    setItems((current) => current.filter((item) => item.product.id !== productId));
  }, [status]);

  const loadDraft = useCallback(
    async (draftId: string) => {
      if (!userId) {
        resetBuilder();
        return;
      }
      const stored = await quoteService.getQuote(userId, draftId);
      if (!stored) {
        resetBuilder();
        return;
      }
      setId(stored.id);
      setClientState(stored.client);
      setItems(stored.items);
      setStatus(stored.status);
      setCreatedAt(stored.createdAt);
      setObservations(stored.observations ?? '');
      setTermsAndConditions(stored.termsAndConditions ?? '');
    },
    [resetBuilder, userId]
  );

  const persist = useCallback(
    async (nextStatus: QuoteStatus, extra?: { observations?: string; termsAndConditions?: string }): Promise<Quote> => {
      if (!userId) {
        throw new Error('Tu sesión ya no está disponible. Vuelve a iniciar sesión.');
      }
      if (!client) {
        throw new Error('Selecciona o registra un cliente antes de guardar.');
      }
      if (status !== 'Pendiente') {
        throw new Error('La cotización enviada no puede modificarse. Duplícala para crear una nueva.');
      }

      const obsVal = extra?.observations !== undefined ? extra.observations : observations;
      const termsVal = extra?.termsAndConditions !== undefined ? extra.termsAndConditions : termsAndConditions;

      const quote: Quote = {
        id,
        client,
        items,
        status: nextStatus,
        observations: obsVal.trim() || undefined,
        termsAndConditions: termsVal.trim() || undefined,
        createdAt,
        updatedAt: new Date().toISOString(),
      };

      await quoteService.saveQuote(userId, quote);
      setStatus(nextStatus);
      if (extra?.observations !== undefined) setObservations(extra.observations);
      if (extra?.termsAndConditions !== undefined) setTermsAndConditions(extra.termsAndConditions);
      return quote;
    },
    [id, client, items, createdAt, status, userId, observations, termsAndConditions]
  );

  const saveDraft = useCallback((extra?: { observations?: string; termsAndConditions?: string }) => persist('Pendiente', extra), [persist]);
  const markGenerated = useCallback((extra?: { observations?: string; termsAndConditions?: string }) => persist('Enviada', extra), [persist]);

  const duplicateQuote = useCallback(async () => {
    if (!userId) {
      throw new Error('Tu sesión ya no está disponible. Vuelve a iniciar sesión.');
    }

    const duplicated = await quoteService.duplicateQuote(userId, id);
    setId(duplicated.id);
    setClientState(duplicated.client);
    setItems(duplicated.items);
    setStatus(duplicated.status);
    setCreatedAt(duplicated.createdAt);
    setObservations(duplicated.observations ?? '');
    setTermsAndConditions(duplicated.termsAndConditions ?? '');
  }, [id, userId]);

  const value = useMemo<QuoteBuilderContextValue>(
    () => ({
      id,
      client,
      items,
      status,
      observations,
      termsAndConditions,
      createdAt,
      setClient,
      setTermsAndObservations,
      addItem,
      updateItem,
      removeItem,
      loadDraft,
      duplicateQuote,
      saveDraft,
      markGenerated,
      resetBuilder,
    }),
    [
      id,
      client,
      items,
      status,
      observations,
      termsAndConditions,
      createdAt,
      setClient,
      setTermsAndObservations,
      addItem,
      updateItem,
      removeItem,
      loadDraft,
      duplicateQuote,
      saveDraft,
      markGenerated,
      resetBuilder,
    ]
  );

  return <QuoteBuilderContext.Provider value={value}>{children}</QuoteBuilderContext.Provider>;
}

export function useQuoteBuilder() {
  const ctx = useContext(QuoteBuilderContext);
  if (!ctx) {
    throw new Error('useQuoteBuilder debe usarse dentro de <QuoteBuilderProvider>.');
  }
  return ctx;
}
