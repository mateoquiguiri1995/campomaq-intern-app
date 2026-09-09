import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/common/ScreenContainer';
import { ClientDetail } from '@/features/clients/components/ClientDetail';
import { getClientDetail } from '@/features/clients/services/clientDetailService';
import type { Client, ClientDetail as ClientDetailType } from '@/features/clients/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

/** Ficha del cliente. Actualmente usa detalle mock; luego consultará /clients/:id. */
export default function ClientDetailScreen() {
  const { data } = useLocalSearchParams<{ id: string; data?: string }>();
  const [client, setClient] = useState<ClientDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    let summary: Client | null = null;
    try {
      summary = data ? JSON.parse(data) : null;
    } catch {
      summary = null;
    }

    if (!summary) {
      setError('No pudimos abrir este cliente. Vuelve a la lista e inténtalo de nuevo.');
      return () => {
        isMounted = false;
      };
    }

    getClientDetail(summary)
      .then((detail) => {
        if (isMounted) setClient(detail);
      })
      .catch(() => {
        if (isMounted) setError('No pudimos cargar la ficha del cliente.');
      });

    return () => {
      isMounted = false;
    };
  }, [data]);

  return (
    <ScreenContainer hasHeader>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Ficha de cliente',
          headerBackTitle: 'Clientes',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.black,
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              style={inlineLayoutStyles.clientHeaderAction}
              onPress={() =>
                Alert.alert('Próximamente', 'Las notificaciones estarán disponibles en una próxima actualización.')
              }
            >
              <Ionicons name="notifications" size={22} color={colors.black} />
            </Pressable>
          ),
        }}
      />

      {!client && !error && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
          <Text style={styles.message}>Cargando ficha del cliente...</Text>
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.message}>{error}</Text>
        </View>
      )}

      {client && <ClientDetail client={client} />}
    </ScreenContainer>
  );
}

import { styles } from '@/theme/styles/app_client_id_';
import { inlineLayoutStyles } from '@/theme/styles/inlineLayout';
