import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { styles } from '@/theme/styles/src_features_clients_components_ClientCard';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Client } from '../types';
import { ClientAvatar } from './ClientAvatar';

interface ClientCardProps {
  client: Client;
}

function formatListCurrency(value?: number): string {
  if (value === undefined) return '';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `$${formatted}`;
}

function formatLastPurchaseDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T12:00:00`);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `Últ. compra ${day} ${month} ${year}`;
}

function ClientCardComponent({ client }: ClientCardProps) {
  const lastPurchase = formatLastPurchaseDate(client.lastPurchaseDate);
  const subtitle = [client.location, lastPurchase].filter(Boolean).join(' - ');

  return (
    <View style={styles.card}>
      <ClientAvatar name={client.name} size={48} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{client.name}</Text>
          {client.score ? (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>{client.score}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle || `RUC: ${client.ruc}`}
        </Text>
      </View>
      <View style={styles.rightContent}>
        <Text style={styles.total}>{formatListCurrency(client.totalPurchases)}</Text>
        <Text style={styles.totalLabel}>ventas 6 meses</Text>
      </View>
    </View>
  );
}

// Evita re-renderizar cada tarjeta visible cuando el padre (ClientsScreen)
// cambia de estado por algo ajeno a la lista (buscador, filtros, etc.).
export const ClientCard = memo(ClientCardComponent);

