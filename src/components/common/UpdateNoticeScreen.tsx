import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UpdateNoticeScreenProps {
  onComplete: () => void;
}

const TRACK_WIDTH = 220;
const SHIMMER_WIDTH = 60;
const DURATION_MS = 1600;

/**
 * Aviso breve y elegante que se muestra una sola vez cuando la app arrancó
 * sobre una actualización OTA nueva. Puramente informativo: la actualización
 * ya se descargó y aplicó antes de este render, así que la barra es una
 * animación de confirmación, no una descarga real.
 */
export function UpdateNoticeScreen({ onComplete }: UpdateNoticeScreenProps) {
  const [progress, setProgress] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  useEffect(() => {
    const step = 30;
    const totalSteps = DURATION_MS / step;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(onComplete, 550);
      } else {
        const ratio = currentStep / totalSteps;
        const easeOut = 1 - Math.pow(1 - ratio, 2.5);
        setProgress(Math.min(Math.round(easeOut * 100), 99));
      }
    }, step);

    return () => clearInterval(interval);
  }, [onComplete]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-TRACK_WIDTH, TRACK_WIDTH * 2],
  });

  const isDone = progress >= 100;

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
        >
          <View style={styles.iconWrapper}>
            <Ionicons
              name={isDone ? 'checkmark-circle' : 'cloud-download-outline'}
              size={40}
              color="#EBD600"
            />
          </View>

          <Text style={styles.title}>¡App actualizada!</Text>
          <Text style={styles.subtitle}>
            Campo Maq Ventas tiene las últimas mejoras y correcciones.
          </Text>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressTrack} />
            <View style={[styles.progressFillWrapper, { width: `${progress}%` }]}>
              <LinearGradient
                colors={['#d9c400', '#efd800']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressFill}
              />
            </View>
            <Animated.View
              pointerEvents="none"
              style={[styles.shimmer, { transform: [{ translateX: shimmerTranslateX }] }]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          <Text style={styles.progressLabel}>
            {isDone ? 'Listo para trabajar' : 'Aplicando cambios...'}
          </Text>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(235,214,0,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(235,214,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Barlow_700Bold',
    fontSize: 19,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 13,
    color: '#B8B8B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
  },
  progressBarContainer: {
    width: TRACK_WIDTH,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3A3A3A',
    borderRadius: 3,
  },
  progressFillWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    flex: 1,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SHIMMER_WIDTH,
  },
  progressLabel: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 12,
    color: '#8A8A8A',
    marginTop: 12,
  },
});
