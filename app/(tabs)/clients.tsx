import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { ClientList } from '@/features/clients/components/ClientList';
import { useClients } from '@/features/clients/hooks/useClients';
import type { Client } from '@/features/clients/types';
import { useQuoteBuilder } from '@/features/quotes/QuoteBuilderProvider';
import { useSellerDashboard } from '@/features/sellers/SellerProvider';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/currency';

/** Pestaña Clientes. */
export default function ClientsScreen() {
  const router = useRouter();
  const [clientFilter, setClientFilter] = useState<ClientFilter>('Todos');
  const { resetBuilder } = useQuoteBuilder();
  const { seller } = useSellerDashboard();
  const featuredClient = seller?.topClients[0];

  // Predicado de filtro de estado (recencia/frecuencia), memoizado: se pasa
  // al hook para que se aplique ANTES de la paginación, así `hasMore`/el
  // conteo reflejan el mismo conjunto que se muestra en pantalla (antes, el
  // filtro se aplicaba después de que useClients ya había paginado, y podía
  // desincronizar el "cargar más" cuando había muchos clientes "Inactive").
  const statusFilter = useCallback(
    (client: Client) => {
      if (client.recencyStatus === 'Inactive' || client.frequencyClassification === 'Inactive') {
        return false;
      }
      if (clientFilter === 'Todos') return true;
      if (clientFilter === 'Activo') return client.recencyStatus === 'Active';
      const frequencyByFilter: Record<Exclude<ClientFilter, 'Todos' | 'Activo'>, string> = {
        'Muy recurrente': 'Highly recurrent',
        Recurrente: 'Recurrent',
        Ocasional: 'Occasional',
        'Una vez': 'One-time',
      };
      return client.frequencyClassification === frequencyByFilter[clientFilter];
    },
    [clientFilter]
  );

  const {
    clients: filteredClients,
    loading,
    searchLoading,
    loadingMore,
    error,
    hasMore,
    hasActiveFilters: hasSearchFilter,
    search,
    setSearch,
    loadMore,
    refresh,
    refreshing,
  } = useClients(statusFilter);

  const hasActiveFilters = hasSearchFilter || clientFilter !== 'Todos';

  function openClientDetail(client: Client) {
    router.push({
      pathname: '/client/[id]',
      params: { id: client.id, data: JSON.stringify(client) },
    });
  }

  function handleNewQuote() {
    resetBuilder();
    router.push('/quotes/select-client');
  }

  if (loading) {
    return (
      <ScreenContainer scroll={false} edges={['top']} style={styles.screenContent}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Clientes</Text>
        </View>

        {featuredClient && (
          <View style={styles.featuredClient}>
            <Ionicons name="trophy-outline" size={18} color={colors.primaryDark} />
            <View style={styles.featuredClientText}>
              <Text style={styles.featuredClientLabel}>CLIENTE DESTACADO</Text>
              <Text style={styles.featuredClientName} numberOfLines={1}>{featuredClient.clientName}</Text>
            </View>
            <Text style={styles.featuredClientValue}>{formatCurrency(featuredClient.totalValue)}</Text>
          </View>
        )}

        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
          <Text style={styles.message}>Cargando clientes...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer scroll={false} edges={['top']} style={styles.screenContent}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Clientes</Text>
        </View>

        <View style={styles.center}>
          <Text style={styles.errorTitle}>No pudimos cargar los clientes</Text>
          <Text style={styles.message}>{error}</Text>
          <Button label="Reintentar" variant="ghost" onPress={refresh} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} edges={['top']} style={styles.screenContent}>
      <View style={styles.topGroup}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Clientes</Text>
        </View>

        <View style={styles.searchRow}>
          {searchLoading ? (
            <ActivityIndicator size="small" color={colors.gray} style={styles.searchIcon} />
          ) : (
            <Ionicons name="search" size={18} color={colors.gray} style={styles.searchIcon} />
          )}

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente por nombre"
            placeholderTextColor={colors.gray}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <TouchableOpacity style={styles.clearIcon} onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {CLIENT_FILTERS.map((filter) => {
              const isActive = clientFilter === filter;
              const iconName = filter === 'Todos' ? 'list' : filter === 'Activo' ? 'pulse' : 'repeat';
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setClientFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={iconName}
                    size={14}
                    color={isActive ? '#FFFFFF' : '#666666'}
                  />
                  <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {filteredClients.length > 0 && (
          <Text style={styles.countText}>
            {filteredClients.length} {filteredClients.length === 1 ? 'cliente asignado' : 'clientes asignados'} a tu ruta
          </Text>
        )}
      </View>

      {filteredClients.length === 0 && !hasActiveFilters ? (
        <View style={styles.center}>
          <Text style={styles.message}>No existen clientes disponibles.</Text>
        </View>
      ) : (
        <View style={inlineLayoutStyles.clientsFlexFill}>
          <ClientList
            clients={filteredClients}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => {
              setSearch('');
              setClientFilter('Todos');
            }}
            searching={searchLoading}
            onPressClient={openClientDetail}
            refreshing={refreshing}
            onRefresh={refresh}
          />
        </View>
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.7} onPress={handleNewQuote}>
        <Ionicons name="add" size={28} color={colors.black} />
      </TouchableOpacity>
    </ScreenContainer>
  );
}

type ClientFilter = 'Todos' | 'Activo' | 'Muy recurrente' | 'Recurrente' | 'Ocasional' | 'Una vez';

const CLIENT_FILTERS: ClientFilter[] = ['Todos', 'Activo', 'Muy recurrente', 'Recurrente', 'Una vez'];

import { styles } from '@/theme/styles/app_tabs_clients';
import { inlineLayoutStyles } from '@/theme/styles/inlineLayout';

