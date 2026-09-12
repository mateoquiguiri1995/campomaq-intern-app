import { Platform, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/**
 * Estilos centralizados para $file.
 *
 * Ritmo de espaciado: `sheet.gap` (md) separa cada sección de nivel
 * superior (header, precio, cantidad, descuento, resumen, acciones); dentro
 * de cada sección, `section.gap` (sm) separa su label de su control. Ningún
 * elemento suelto debería llevar su propio marginTop/marginBottom — así el
 * espacio entre bloques es siempre el mismo y no se acumula.
 */
export const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  // Indicador de arrastre: convención visual de bottom sheet, señala que la
  // tarjeta es un panel deslizable y no un bloque de página normal.
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  header: {
    gap: 2,
  },
  productName: {
    ...typography.subtitle,
    fontSize: 18,
    color: colors.black,
    fontWeight: '700',
  },
  productMeta: {
    ...typography.caption,
    color: colors.gray,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.grayDark,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockOk: {
    color: colors.success,
  },
  stockOut: {
    color: colors.danger,
  },
  tierRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tierChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  tierChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  tierLabel: {
    ...typography.caption,
    color: colors.black,
    fontWeight: '600',
  },
  tierLabelSelected: {
    color: colors.onPrimary,
  },
  tierPrice: {
    ...typography.body,
    color: colors.black,
    fontWeight: '700',
  },
  tierUtilityPill: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  tierUtilityPillSelected: {
    backgroundColor: 'rgba(26, 26, 26, 0.12)',
  },
  tierUtilityText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  utilityPositive: {
    color: colors.success,
  },
  utilityNegative: {
    color: colors.danger,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    ...typography.subtitle,
    color: colors.black,
    fontWeight: '700',
  },
  quantityInput: {
    ...typography.subtitle,
    fontSize: 18,
    color: colors.black,
    fontWeight: '700',
    width: 60,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  // Segmented control (%/$): un solo contenedor "pill" con fondo, en vez de
  // dos botones sueltos con borde propio — así se lee como un único control
  // de dos posiciones, no como dos chips desalineados.
  discountModeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    padding: 3,
  },
  discountModeSegment: {
    minWidth: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountModeSegmentSelected: {
    backgroundColor: colors.primary,
  },
  discountModeSegmentText: {
    ...typography.caption,
    color: colors.grayDark,
    fontWeight: '700',
  },
  discountModeSegmentTextSelected: {
    color: colors.onPrimary,
  },
  // Campo de descuento con el símbolo ($/%) fijo dentro del mismo recuadro,
  // para que el tipo de descuento sea visible aunque no se mire el toggle.
  discountFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  discountFieldSymbol: {
    ...typography.subtitle,
    color: colors.grayDark,
    fontWeight: '700',
    marginRight: spacing.xs,
  },
  discountFieldInput: {
    ...typography.subtitle,
    flex: 1,
    color: colors.black,
    paddingVertical: spacing.sm,
  },
  // Resumen de la línea: siempre visible (no solo cuando hay descuento), así
  // el vendedor ve el total y la utilidad de una sola mirada, en una única
  // tarjeta en vez de dos cajas sueltas apiladas.
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowUtility: {
    marginTop: 2,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.grayDark,
  },
  summaryLabelStrong: {
    ...typography.body,
    color: colors.black,
    fontWeight: '600',
  },
  summaryDiscountValue: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
  summaryTotalValue: {
    ...typography.subtitle,
    fontSize: 18,
    color: colors.black,
    fontWeight: '700',
  },
  // Utilidad en una píldora con fondo tenue del color de estado (verde/rojo)
  // y un ícono de tendencia, para que se lea de inmediato sin competir con
  // el total de la línea.
  utilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  utilityBadgePositive: {
    backgroundColor: 'rgba(46, 158, 79, 0.12)',
  },
  utilityBadgeNegative: {
    backgroundColor: 'rgba(214, 69, 69, 0.12)',
  },
  utilityBadgePct: {
    ...typography.caption,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmButton: {
    flex: 1,
  },
});
