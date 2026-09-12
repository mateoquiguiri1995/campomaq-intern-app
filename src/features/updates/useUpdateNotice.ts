import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

const LAST_SEEN_UPDATE_KEY = 'campomaq:app:lastSeenUpdateId';

/**
 * Detecta si la app acaba de arrancar sobre una actualización OTA nueva
 * (expo-updates) que el vendedor todavía no ha visto, para poder avisarle
 * una sola vez con un aviso no intrusivo.
 */
export function useUpdateNotice() {
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkForRecentUpdate() {
      try {
        // En Expo Go / dev builds no hay actualizaciones OTA reales.
        if (!Updates.isEnabled || Updates.isEmbeddedLaunch) {
          return;
        }

        const currentUpdateId = Updates.updateId;
        if (!currentUpdateId) {
          return;
        }

        const lastSeenUpdateId = await AsyncStorage.getItem(LAST_SEEN_UPDATE_KEY);

        if (lastSeenUpdateId !== currentUpdateId && isMounted) {
          setShowUpdateNotice(true);
        }

        await AsyncStorage.setItem(LAST_SEEN_UPDATE_KEY, currentUpdateId);
      } catch {
        // Si falla la lectura/escritura del flag, simplemente no mostramos el aviso.
      }
    }

    checkForRecentUpdate();

    return () => {
      isMounted = false;
    };
  }, []);

  const dismissUpdateNotice = () => setShowUpdateNotice(false);

  return { showUpdateNotice, dismissUpdateNotice };
}
