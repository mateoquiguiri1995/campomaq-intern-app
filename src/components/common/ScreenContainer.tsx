import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

import { OfflineBanner } from './OfflineBanner';

interface ScreenContainerProps extends PropsWithChildren {
  /**
   * Si es true (por defecto) envuelve el contenido en ScrollView.
   * Si es false solamente crea el SafeArea.
   */
  scroll?: boolean;
  /**
   * Si es true, indica que la pantalla ya muestra una cabecera nativa (headerShown: true)
   * y por tanto desactiva el inset superior de SafeAreaView para evitar doble espaciado.
   */
  hasHeader?: boolean;
  /**
   * Si es true (por defecto), muestra el banner sutil de modo offline si la app está sin conexión.
   */
  showOfflineBanner?: boolean;
}

export function ScreenContainer({
  children,
  scroll = true,
  hasHeader = false,
  showOfflineBanner = true,
}: ScreenContainerProps) {
  // Android puede dibujar la app por debajo de la barra de navegación. Todas
  // las pantallas deben respetar el borde inferior; cuando hay un header
  // nativo, solamente omitimos el borde superior para no duplicar su espacio.
  const edges = hasHeader ? (['bottom'] as const) : (['top', 'bottom'] as const);

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea} edges={edges}>
        {showOfflineBanner && <OfflineBanner />}
        <View style={styles.nonScrollContent}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      {showOfflineBanner && <OfflineBanner />}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

import { styles } from '@/theme/styles/src_components_common_ScreenContainer';
