import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.black,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: colors.grayDark,
    marginTop: 4,
  },
  scrollArea: {
    marginVertical: spacing.sm,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.black,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.gray,
    marginBottom: spacing.sm,
  },
  optionsList: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  checkboxRowSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFFDF0',
  },
  checkboxIcon: {
    marginTop: 2,
  },
  checkboxText: {
    ...typography.body,
    fontSize: 13,
    color: colors.black,
    flex: 1,
    lineHeight: 18,
  },
  checkboxTextSelected: {
    fontWeight: '600',
  },
  customInputLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.grayDark,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  customInput: {
    ...typography.body,
    fontSize: 13,
    color: colors.black,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1.5,
  },
});
