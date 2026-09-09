import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/** Estilos centralizados para $file. Uso: se importan desde esta pantalla/componente; editar aquí preserva el diseño. */
export const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 4,
  },
  separator: {
    height: spacing.sm,
  },
  footer: {
    textAlign: 'center',
    color: colors.grayDark,
    paddingTop: spacing.sm,
    paddingBottom: 4,
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.grayDark,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  clearButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  clearButtonText: {
    ...typography.body,
    color: colors.onPrimary,
    fontWeight: '600',
  },
});

