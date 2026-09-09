import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import type { Client } from '../types';
import { ClientCard } from './ClientCard';

interface ClientListProps {
  clients: Client[];
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onPressClient?: (client: Client) => void;
  /** Búsqueda en curso: evita mostrar "sin resultados" mientras aún no llega la respuesta. */
  searching?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ClientList({
  clients,
  onLoadMore,
  hasMore,
  loadingMore,
  hasActiveFilters,
  onClearFilters,
  onPressClient,
  searching,
  refreshing = false,
  onRefresh,
}: ClientListProps) {
  const renderItem = useCallback(
    ({ item }: { item: Client }) => (
      <TouchableOpacity activeOpacity={0.7} onPress={() => onPressClient?.(item)}>
        <ClientCard client={item} />
      </TouchableOpacity>
    ),
    [onPressClient]
  );

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={clients}
      keyExtractor={(item) => item.id}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryDark]} /> : undefined
      }
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReached={() => {
        if (hasMore) onLoadMore();
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? <Text style={styles.footer}>Cargando más clientes...</Text> : null
      }
      ListEmptyComponent={
        searching ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.primaryDark} />
            <Text style={styles.emptyText}>Buscando clientes...</Text>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {hasActiveFilters
                ? 'No encontramos clientes con esa búsqueda.'
                : 'No se encontraron clientes.'}
            </Text>

            {hasActiveFilters && onClearFilters && (
              <TouchableOpacity style={styles.clearButton} activeOpacity={0.7} onPress={onClearFilters}>
                <Text style={styles.clearButtonText}>Limpiar búsqueda</Text>
              </TouchableOpacity>
            )}
          </View>
        )
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

import { styles } from '@/theme/styles/src_features_clients_components_ClientList';
