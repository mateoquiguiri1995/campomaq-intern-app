import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

/** Estilos centralizados para app/(tabs)/reports.tsx. */
export const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
    marginTop: spacing.sm,
  },
  periodSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginVertical: spacing.xs,
  },
  periodTab: {
    flex: 1,
    paddingVertical: spacing.sm - 2,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  periodTabTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  darkCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  darkCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray,
    letterSpacing: 0.5,
  },
  darkCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  darkCardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgeAceptadaInline: {
    backgroundColor: 'rgba(235, 214, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeAceptadaInlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  darkCardMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  darkCardMetric: {
    flex: 1,
  },
  darkCardMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  darkCardMetricValueCentered: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  darkCardMetricLabel: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
  },
  darkCardMetricLabelCentered: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.grayDark,
    marginTop: spacing.xs,
  },
  center: {
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  message: {
    textAlign: 'center',
    color: colors.grayDark,
  },
  errorTitle: {
    fontWeight: '700',
    color: '#C5221F',
  },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.grayDark,
    textAlign: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  quoteCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  commercialCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: '#FFFBE6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1E59B',
    padding: spacing.md,
  },
  commercialCardRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  commercialCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.grayDark,
  },
  commercialCardValue: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: '800',
    color: colors.black,
  },
  commercialCardBrand: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: colors.black,
    textAlign: 'right',
  },
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  deleteAction: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 72,
    backgroundColor: '#C5221F',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  deleteActionHidden: {
    opacity: 0,
  },
  quoteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteCardCode: {
    fontSize: 11,
    color: colors.gray,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quoteCardClient: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
  },
  dottedDivider: {
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    marginVertical: 2,
  },
  quoteCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteCardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },
  quoteCardAction: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
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

export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 34,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
  },
  optionsContainer: {
    gap: 12,
    marginVertical: 8,
  },
  acceptedBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptedBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#137333',
  },
  rejectedBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FCE8E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectedBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C5221F',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
