import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/features/auth/AuthProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SalesLoadingScreenProps {
  progress?: number;
  onComplete?: () => void;
}

const getProgressMessage = (pct: number) => {
  if (pct < 26) return 'Validando sesión . . .';
  if (pct <= 51) return 'Descargando productos . . .';
  if (pct <= 77) return 'Sincronizando clientes . . .';
  if (pct <= 99) return 'Sincronizando catálogo y precios . . .';
  return '¡Todo listo!';
};

export function SalesLoadingScreen({ progress: progressProp, onComplete }: SalesLoadingScreenProps) {
  const { session } = useAuth();
  const [progressState, setProgressState] = useState(0);

  // Animación del halo / brillo y el tamaño del logo
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Animación del relleno de la barra de progreso
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Bucle infinito para la respiración/pulso de escala y opacidad
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Interpolación de escala para todo el grupo (logo + brillo)
  const logoScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.03],
  });

  // Interpolación de escala específica para el brillo (glow)
  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.25],
  });

  // Interpolación de opacidad para el brillo difuminado
  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.30, 0.85],
  });

  // Efecto para llamar a onComplete en caso de progreso real por prop
  useEffect(() => {
    if (progressProp !== undefined && progressProp >= 98 && onComplete) {
      const t = setTimeout(() => {
        onComplete();
      }, 150);
      return () => clearTimeout(t);
    }
  }, [progressProp, onComplete]);

  // Red de seguridad: si transcurren más de 3.5 segundos con sesión activa,
  // se finaliza la pantalla de carga para garantizar que el vendedor nunca quede bloqueado.
  useEffect(() => {
    if (!onComplete) return;

    const safetyTimer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => clearTimeout(safetyTimer);
  }, [onComplete]);

  // Simulación local de progreso en caso de que no venga la prop (pruebas o fallback)
  useEffect(() => {
    if (progressProp !== undefined) {
      return;
    }

    const duration = 2200; // 2.2 segundos de simulación
    const step = 30;
    const totalSteps = duration / step;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setProgressState(100);
        if (onComplete) {
          setTimeout(() => {
            onComplete();
          }, 150);
        }
      } else {
        const ratio = currentStep / totalSteps;
        const easeOut = 1 - Math.pow(1 - ratio, 2.5);
        const nextProgress = Math.min(Math.round(easeOut * 100), 99);
        setProgressState(nextProgress);
      }
    }, step);

    return () => clearInterval(interval);
  }, [progressProp, onComplete]);

  const displayProgress = progressProp !== undefined ? progressProp : Math.round(progressState);

  // Animación del ancho de la barra
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: displayProgress,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [displayProgress, progressAnim]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Obtener nombre del vendedor
  const getSellerName = () => {
    if (session?.user?.name && session.user.name.trim().length > 0) {
      return session.user.name;
    }
    if (session?.user?.email) {
      const email = session.user.email;
      const localPart = email.split('@')[0] ?? '';
      const words = localPart.split(/[._+-]+/).filter(Boolean);
      if (words.length > 0) {
        return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
    }
    return 'Vendedor';
  };

  const sellerName = getSellerName();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Contenedor Principal */}
      <View style={styles.container}>
        
        {/* Espaciador superior */}
        <View style={styles.spacer} />

        {/* Zona Central: Logo, Halo y Progreso */}
        <View style={styles.centerSection}>
          
          {/* Contenedor Animado para el Logo y el Brillo (titilar/respirar juntos) */}
          <Animated.View style={[
            styles.logoGroupContainer,
            {
              transform: [{ scale: logoScale }],
            }
          ]}>
            {/* Brillo amarillo pulsante y difuminado detrás del logo */}
            <Animated.View style={[
              styles.glowWrapper,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              }
            ]}>
              <Image
                source={require('../../../assets/images/logo-glow.png')}
                style={styles.glowImage}
                contentFit="contain"
                tintColor="#EBD600"
              />
            </Animated.View>

            {/* Logo Campo Maq centrado */}
            <Image
              source={require('../../../assets/images/campomaq.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>

          {/* Barra de Progreso */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: barWidth }]} />
            </View>
          </View>

          {/* Texto dinámico y Porcentaje */}
          <Text style={styles.messageText}>
            {getProgressMessage(displayProgress)} ({displayProgress}%)
          </Text>
        </View>

        {/* Zona Inferior: Datos del Vendedor */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            {sellerName} · Cayambe - Pichincha
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Fondo oscuro
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  spacer: {
    height: 40,
  },
  centerSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 40,
  },
  // Contenedor del grupo de logo y brillo para animar escala en conjunto
  logoGroupContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 320,
    height: 120,
    marginBottom: 48,
    position: 'relative',
  },
  // Contenedor del brillo difuminado
  glowWrapper: {
    position: 'absolute',
    width: 340,
    height: 340,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  glowImage: {
    width: '100%',
    height: '100%',
  },
  logo: {
    width: 210,
    height: 210 / 2.6, // Ajustado a la relación de aspecto original (224x86 -> 2.6) para evitar deformación
    zIndex: 2,
  },
  // Barra de progreso horizontal
  progressBarContainer: {
    width: '80%',
    maxWidth: 280,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3A3A3A', // Gris oscuro
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#EBD600', // Amarillo institucional
  },
  messageText: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 14,
    color: '#D9D9D9', // Blanco grisáceo elegante
    textAlign: 'center',
    marginTop: 8,
  },
  footerContainer: {
    paddingBottom: 24,
  },
  footerText: {
    fontFamily: 'Barlow_600SemiBold',
    fontSize: 13,
    color: '#8A8A8A', // Gris suave
    textAlign: 'center',
  },
});
