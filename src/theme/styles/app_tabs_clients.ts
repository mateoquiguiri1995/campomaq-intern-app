import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

/** Estilos centralizados para $file. Uso: se importan desde esta pantalla/componente; editar aquí preserva el diseño. */
export const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
  },

  searchRow: {
    justifyContent: 'center',
    marginBottom: 0,
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.sm + spacing.xs,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#FAFAFA',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingLeft: spacing.xl + spacing.xs,
    paddingRight: spacing.xl,
    height: 48,
    fontSize: 14,
    color: colors.black,
  },
  clearIcon: {
    position: 'absolute',
    right: spacing.sm + spacing.xs,
  },
  filtersWrapper: {
    marginBottom: 0,
  },
  filtersScroll: {
    paddingRight: spacing.md,
    gap: spacing.xs + 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  filterLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  filterLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.grayDark,
    marginTop: 4,
    marginBottom: 2,
  },
  topGroup: {
    gap: 8,
  },
  featuredClient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFBE6',
    borderWidth: 1,
    borderColor: '#F1E59B',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  featuredClientText: {
    flex: 1,
  },
  featuredClientLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.grayDark,
    letterSpacing: 0.4,
  },
  featuredClientName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.black,
  },
  featuredClientValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.black,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 999,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.grayDark,
  },
  errorTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: '#D32F2F',
  },
});
