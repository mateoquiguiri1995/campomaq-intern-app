import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/** Estilos centralizados para $file. Uso: se importan desde esta pantalla/componente; editar aquí preserva el diseño. */
export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  productName: {
    ...typography.subtitle,
    color: colors.black,
    fontWeight: '700',
  },
  productCode: {
    ...typography.caption,
    color: colors.gray,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.grayDark,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tierChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
    marginTop: 2,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
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
    color: colors.black,
    width: 70,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
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
  // Resumen del descuento aplicado: caja compacta con dos filas
  // (descuento / total de línea), mismo lenguaje visual que los totales
  // de app/quotes/summary.tsx.
  discountSummary: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    gap: 2,
  },
  discountSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  discountSummaryLabel: {
    ...typography.caption,
    color: colors.grayDark,
  },
  discountSummaryValue: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
  discountSummaryTotalLabel: {
    ...typography.caption,
    color: colors.black,
    fontWeight: '600',
  },
  discountSummaryTotalValue: {
    ...typography.body,
    color: colors.black,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  confirmButton: {
    flex: 1,
  },
});

