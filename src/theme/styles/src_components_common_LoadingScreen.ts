import { StyleSheet } from 'react-native';
import { spacing } from '@/theme/spacing';
export const TRACK_WIDTH = 240;
export const SHIMMER_WIDTH = 70;

/** Estilos centralizados. Uso: src/components/common/LoadingScreen.tsx. */
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f6',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: spacing.md,
  },
  titleText: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 31,
    color: '#282420',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  subtitleText: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 11,
    color: '#e9d802', // Mismo tono de amarillo que el logo
    letterSpacing: 3,
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  illustrationContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: 20,
    paddingHorizontal: spacing.md,
  },
  logo: {
    width: 206,
    height: 206 / 3.85,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  buttonWrapper: {
    width: '60%',
  },
  errorSubtitle: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 14,
    color: '#6b665d',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  errorText: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 12,
    color: '#D64545',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarContainer: {
    width: TRACK_WIDTH,
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressTrack: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(40,36,32,0.10)',
    borderRadius: 99,
  },
  progressFillWrapper: {
    height: '100%',
    borderRadius: 99,
    overflow: 'hidden',
    shadowColor: 'rgba(233,210,0,0.55)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 1,
  },
  progressFill: {
    flex: 1,
    borderRadius: 99,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SHIMMER_WIDTH,
  },
  progressText: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 13,
    color: '#6b665d',
    textAlign: 'center',
  },
});
