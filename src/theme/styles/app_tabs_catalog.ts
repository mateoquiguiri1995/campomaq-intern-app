import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { StyleSheet } from 'react-native';

/** Estilos centralizados para $file. Uso: se importan desde esta pantalla/componente; editar aquí preserva el diseño. */
export const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerText: {
    gap: 2,
  },
  helloText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.black,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 13,
    right: 14,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 0,
  },
  searchBarWrapper: {
    flex: 1,
    justifyContent: 'center',
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
  chipsScroll: {
    flexGrow: 0,
  },
  chipsRow: {
    gap: spacing.xs + 2,
    paddingRight: spacing.md,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  topControlsGroup: {
    gap: 6,
  },
  commercialReference: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  commercialReferenceText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.grayDark,
  },
  sortLeftText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menu: {
    position: 'absolute',
    minWidth: 190,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuItemText: {
    ...typography.body,
    color: colors.black,
  },
  menuItemDanger: {
    color: colors.danger,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
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
});
