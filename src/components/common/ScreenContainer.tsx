import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
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
  /**
   * Sobrescribe los bordes seguros (edges). Útil en pantallas dentro de Tabs donde el
   * TabBar ya cubre el borde inferior del sistema.
   */
  edges?: readonly ('top' | 'bottom' | 'left' | 'right')[];
  /**
   * Estilo adicional para el contenedor de contenido (nonScrollContent o ScrollView).
   */
  style?: StyleProp<ViewStyle>;
}

export function ScreenContainer({
  children,
  scroll = true,
  hasHeader = false,
  showOfflineBanner = true,
  edges: customEdges,
  style,
}: ScreenContainerProps) {
  // Android puede dibujar la app por debajo de la barra de navegación. Todas
  // las pantallas deben respetar el borde inferior; cuando hay un header
  // nativo, solamente omitimos el borde superior para no duplicar su espacio.
  const defaultEdges = hasHeader ? (['bottom'] as const) : (['top', 'bottom'] as const);
  const edges = customEdges ?? defaultEdges;

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea} edges={edges}>
        {showOfflineBanner && <OfflineBanner />}
        <View style={[styles.nonScrollContent, style]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      {showOfflineBanner && <OfflineBanner />}
      <ScrollView
        contentContainerStyle={[styles.content, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

import { styles } from '@/theme/styles/src_components_common_ScreenContainer';
