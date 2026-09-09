import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

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
    flex: 1,
    gap: 2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  goalCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray,
  },
  goalPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  goalValues: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.surface,
  },
  goalTarget: {
    fontSize: 16,
    color: colors.gray,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#4A4A4A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  goalFooter: {
    fontSize: 11,
    color: colors.grayLight,
  },
  metricsGrid: {
    gap: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  metricIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.grayDark,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.grayDark,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.black,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  catRow: {
    gap: 6,
  },
  catInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.black,
  },
  catPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.grayDark,
  },
  catTrack: {
    height: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  catBar: {
    height: '100%',
    borderRadius: 3,
  },
  rankingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rankingBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldBadge: {
    backgroundColor: colors.primary,
  },
  silverBadge: {
    backgroundColor: '#F5F5F5',
  },
  bronzeBadge: {
    backgroundColor: '#F5F5F5',
  },
  rankingIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.black,
  },
  rankingName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  rankingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
  },
  blackBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
  },
  blackBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  rankingRight: {
    alignItems: 'flex-end',
  },
  rankingSub: {
    fontSize: 9,
    color: colors.gray,
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.black,
  },
  activityTime: {
    fontSize: 11,
    color: colors.gray,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  activityDark: {
    fontSize: 13,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: 80,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
});

