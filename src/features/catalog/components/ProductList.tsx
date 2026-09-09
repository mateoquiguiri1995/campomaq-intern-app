import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '@/theme/styles/src_features_catalog_components_ProductList';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import type { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  products: Product[];

  onLoadMore: () => void;

  hasMore: boolean;

  /** Si hay una búsqueda o filtro activo, permite limpiarlo desde el estado vacío. */
  hasActiveFilters?: boolean;

  onClearFilters?: () => void;

  onPressProduct?: (product: Product) => void;

  /** Búsqueda en curso: evita mostrar "sin resultados" mientras aún no llega la respuesta. */
  searching?: boolean;

  refreshing?: boolean;

  onRefresh?: () => void;
}

export function ProductList({
  products,
  onLoadMore,
  hasMore,
  hasActiveFilters,
  onClearFilters,
  onPressProduct,
  searching,
  refreshing = false,
  onRefresh,
}: ProductListProps) {
  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard product={item} onPressDetails={onPressProduct} />
    ),
    [onPressProduct]
  );

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={products}
      keyExtractor={(item) => item.code}
      renderItem={renderItem}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryDark]} /> : undefined
      }
      onEndReached={() => {
        if (hasMore) onLoadMore();
      }}

      onEndReachedThreshold={0.5}

      ListFooterComponent={
        hasMore ? (
          <Text style={styles.footer}>
            Cargando más productos...
          </Text>
        ) : (
          <Text style={styles.footer}>
            Has llegado al final del catálogo.
          </Text>
        )
      }

      ListEmptyComponent={
        searching ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.primaryDark} />

            <Text style={styles.emptyText}>
              Buscando productos...
            </Text>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {hasActiveFilters
                ? 'No encontramos productos con esa búsqueda o filtro.'
                : 'No se encontraron productos.'}
            </Text>

            {hasActiveFilters && onClearFilters && (
              <TouchableOpacity
                style={styles.clearButton}
                activeOpacity={0.7}
                onPress={onClearFilters}
              >
                <Text style={styles.clearButtonText}>
                  Limpiar búsqueda y filtros
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )
      }

      showsVerticalScrollIndicator={false}
    />
  );
}

