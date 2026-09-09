import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/common/Button';
import type { Product } from '@/features/catalog/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { formatCurrency } from '@/utils/currency';

import { getUnitPrice, round2 } from '../services/quoteCalculations';
import type { PriceTier } from '../types';

const TIERS: { key: PriceTier; label: string }[] = [
  { key: 'A', label: 'Contado' },
  { key: 'B', label: 'Tarjeta' },
  { key: 'C', label: 'Crédito' },
];

type DiscountMode = 'pct' | 'amount';

interface QuoteItemValues {
  quantity: number;
  priceTier: PriceTier;
  discountPct?: number;
  discountAmount?: number;
}

interface QuoteItemEditorModalProps {
  visible: boolean;
  product: Product | null;
  initial?: QuoteItemValues;
  onCancel: () => void;
  onConfirm: (values: QuoteItemValues) => void;
}

/** Modal para elegir cantidad, precio A/B/C y descuento antes de añadir/editar una línea. */
export function QuoteItemEditorModal({
  visible,
  product,
  initial,
  onCancel,
  onConfirm,
}: QuoteItemEditorModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [tier, setTier] = useState<PriceTier>('A');
  const [discountMode, setDiscountMode] = useState<DiscountMode>('pct');
  const [discount, setDiscount] = useState('');

  useEffect(() => {
    if (visible) {
      setQuantity(String(initial?.quantity ?? 1));
      setTier(initial?.priceTier ?? 'A');
      if (initial?.discountAmount) {
        setDiscountMode('amount');
        setDiscount(String(initial.discountAmount));
      } else if (initial?.discountPct) {
        setDiscountMode('pct');
        setDiscount(String(initial.discountPct));
      } else {
        setDiscountMode('pct');
        setDiscount('');
      }
    }
  }, [visible, initial]);

  if (!product) return null;

  const selectedQuantity = parseInt(quantity, 10) || 0;
  const hasSufficientStock = selectedQuantity <= product.stockQty;
  // Subtotal de la línea con la cantidad/precio elegidos ahora mismo: sirve
  // para acotar el descuento en dólares (nunca puede superar el valor de la línea).
  const lineSubtotal = round2(getUnitPrice(product, tier) * Math.max(1, selectedQuantity || 1));
  const numericDiscount = discount.trim() && discount !== '.' ? parseFloat(discount) : 0;
  const discountAmountPreview =
    discountMode === 'pct'
      ? round2((lineSubtotal * Math.min(100, Math.max(0, numericDiscount))) / 100)
      : round2(Math.min(lineSubtotal, Math.max(0, numericDiscount)));

  function adjustQuantity(delta: number) {
    const current = Math.max(1, parseInt(quantity, 10) || 1);
    const next = Math.min(9999, Math.max(1, current + delta));
    setQuantity(String(next));
  }

  function handleQuantityChange(text: string) {
    const cleaned = text.replace(/[^0-9]/g, '');
    const value = parseInt(cleaned, 10);
    if (cleaned === '') {
      setQuantity('');
    } else if (isNaN(value) || value < 1) {
      setQuantity('1');
    } else if (value > 9999) {
      setQuantity('9999');
    } else {
      setQuantity(cleaned);
    }
  }

  /** Normaliza el texto tipeado a un número con como máximo `maxIntDigits` dígitos enteros y 2 decimales. */
  function cleanDecimalInput(text: string, maxIntDigits: number): string {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    const match = cleaned.match(new RegExp(`^\\d{0,${maxIntDigits}}(\\.\\d{0,2})?`));
    cleaned = match ? match[0] : '';

    if (cleaned.length > 1 && cleaned.startsWith('0') && !cleaned.startsWith('0.')) {
      cleaned = cleaned.replace(/^0+/, '') || '0';
    }
    return cleaned;
  }

  function handleDiscountPctChange(text: string) {
    // Hasta 2 dígitos enteros + 2 decimales (ej. "12.5"), en vez del contador
    // manual anterior que descartaba el punto y los decimales al llegar a 2
    // caracteres totales (truncaba "12.5" a "12").
    const cleaned = cleanDecimalInput(text, 2);
    if (cleaned === '' || cleaned === '.') {
      setDiscount(cleaned);
      return;
    }
    const value = parseFloat(cleaned);
    if (isNaN(value)) {
      setDiscount('');
    } else if (value > 99) {
      setDiscount('99');
    } else {
      setDiscount(cleaned);
    }
  }

  function handleDiscountAmountChange(text: string) {
    // Descuento en dólares: sin tope de dígitos enteros fijo (puede ser un
    // equipo caro), pero nunca puede superar el subtotal de la línea.
    const cleaned = cleanDecimalInput(text, 6);
    if (cleaned === '' || cleaned === '.') {
      setDiscount(cleaned);
      return;
    }
    const value = parseFloat(cleaned);
    if (isNaN(value)) {
      setDiscount('');
    } else if (lineSubtotal > 0 && value > lineSubtotal) {
      setDiscount(String(lineSubtotal));
    } else {
      setDiscount(cleaned);
    }
  }

  function handleDiscountModeChange(mode: DiscountMode) {
    if (mode === discountMode) return;
    setDiscountMode(mode);
    // Se limpia el campo al cambiar de tipo: un mismo número significa algo
    // distinto en % que en $, y arrastrarlo llevaría a un descuento no
    // intencional (ej. "12" pasando de "12%" a "$12" sin que el vendedor lo note).
    setDiscount('');
  }

  function handleConfirm() {
    // Aun sin existencias se puede generar la proforma; el PDF lo advertirá.
    const qty = Math.min(9999, Math.max(1, parseInt(quantity, 10) || 1));
    const hasDiscount = discount.trim() !== '' && discount.trim() !== '.';
    const numericValue = hasDiscount ? parseFloat(discount) : 0;

    const discountPct =
      discountMode === 'pct' && hasDiscount && numericValue > 0
        ? Math.min(100, Math.max(0, numericValue))
        : undefined;
    const discountAmount =
      discountMode === 'amount' && hasDiscount && numericValue > 0
        ? round2(Math.min(lineSubtotal, Math.max(0, numericValue)))
        : undefined;

    onConfirm({ quantity: qty, priceTier: tier, discountPct, discountAmount });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productCode}>Código: {product.code} · {product.iva ? 'Aplica IVA (15%)' : 'Tarifa 0% IVA'}</Text>

          <Text style={styles.sectionLabel}>Precio</Text>
          <View style={styles.tierRow}>
            {TIERS.map(({ key, label }) => (
              <Pressable
                key={key}
                style={[styles.tierChip, tier === key && styles.tierChipSelected]}
                onPress={() => setTier(key)}
              >
                <Text style={[styles.tierLabel, tier === key && styles.tierLabelSelected]}>{label}</Text>
                <Text style={[styles.tierPrice, tier === key && styles.tierLabelSelected]}>
                  {formatCurrency(getUnitPrice(product, key))}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>Cantidad</Text>
            <Text style={[
              styles.stockLabel,
              hasSufficientStock ? styles.stockOk : styles.stockOut
            ]}>
              {hasSufficientStock
                ? `Stock disponible: ${product.stockQty}`
                : `Stock insuficiente: ${product.stockQty} disponible`}
            </Text>
          </View>
          <View style={styles.quantityRow}>
            <Pressable style={styles.stepButton} onPress={() => adjustQuantity(-1)}>
              <Text style={styles.stepButtonText}>−</Text>
            </Pressable>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={handleQuantityChange}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Pressable style={styles.stepButton} onPress={() => adjustQuantity(1)}>
              <Text style={styles.stepButtonText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>Descuento (opcional)</Text>
            <View style={styles.discountModeToggle}>
              <Pressable
                style={[styles.discountModeSegment, discountMode === 'pct' && styles.discountModeSegmentSelected]}
                onPress={() => handleDiscountModeChange('pct')}
                hitSlop={4}
              >
                <Text style={[styles.discountModeSegmentText, discountMode === 'pct' && styles.discountModeSegmentTextSelected]}>%</Text>
              </Pressable>
              <Pressable
                style={[styles.discountModeSegment, discountMode === 'amount' && styles.discountModeSegmentSelected]}
                onPress={() => handleDiscountModeChange('amount')}
                hitSlop={4}
              >
                <Text style={[styles.discountModeSegmentText, discountMode === 'amount' && styles.discountModeSegmentTextSelected]}>$</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.discountFieldRow}>
            {discountMode === 'amount' && <Text style={styles.discountFieldSymbol}>$</Text>}
            <TextInput
              style={styles.discountFieldInput}
              value={discount}
              onChangeText={discountMode === 'pct' ? handleDiscountPctChange : handleDiscountAmountChange}
              keyboardType="decimal-pad"
              placeholder={discountMode === 'pct' ? '0' : '0.00'}
              placeholderTextColor={colors.gray}
              maxLength={discountMode === 'pct' ? 5 : 9}
            />
            {discountMode === 'pct' && <Text style={styles.discountFieldSymbol}>%</Text>}
          </View>

          {discountAmountPreview > 0 && (
            <View style={styles.discountSummary}>
              <View style={styles.discountSummaryRow}>
                <Text style={styles.discountSummaryLabel}>Descuento</Text>
                <Text style={styles.discountSummaryValue}>−{formatCurrency(discountAmountPreview)}</Text>
              </View>
              <View style={styles.discountSummaryRow}>
                <Text style={styles.discountSummaryTotalLabel}>Total línea</Text>
                <Text style={styles.discountSummaryTotalValue}>
                  {formatCurrency(Math.max(0, lineSubtotal - discountAmountPreview))}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <Button label="Cancelar" variant="ghost" onPress={onCancel} />
            <View style={styles.confirmButton}>
              <Button label="Agregar a la cotización" onPress={handleConfirm} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

import { styles } from '@/theme/styles/src_features_quotes_components_QuoteItemEditorModal';
