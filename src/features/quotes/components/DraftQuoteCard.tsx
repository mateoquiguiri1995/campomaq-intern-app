import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { formatCurrency } from '@/utils/currency';

import { getQuoteTotals } from '../services/quoteCalculations';
import { getClientDisplayName } from '../services/quoteClient';
import type { Quote } from '../types';

interface DraftQuoteCardProps {
  quote: Quote;
  onPress: () => void;
  onDelete: () => void;
}

export function DraftQuoteCard({ quote, onPress, onDelete }: DraftQuoteCardProps) {
  const { total } = getQuoteTotals(quote.items);
  const date = new Date(quote.updatedAt).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {getClientDisplayName(quote.client)}
        </Text>
        <Text style={styles.meta}>
          {quote.items.length} producto(s) · {date}
        </Text>
        <Text style={[styles.status, (quote.status === 'Enviada' || quote.status === 'Aceptada') ? styles.statusGenerated : styles.statusDraft]}>
          {(quote.status === 'Enviada' || quote.status === 'Aceptada') ? 'PDF generado' : 'Borrador'}
        </Text>
      </View>

      <View style={styles.rightColumn}>
        <Text style={styles.total}>{formatCurrency(total)}</Text>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          hitSlop={8}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      </View>
    </Pressable>
  );
}

import { styles } from '@/theme/styles/src_features_quotes_components_DraftQuoteCard';
