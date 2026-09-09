import * as FileSystem from 'expo-file-system/legacy';

/**
 * Expo Go SDK 57 puede impedir que expo-file-system lea la caché temporal de
 * expo-print. Escribimos el contenido Base64 directamente en documentsDirectory
 * para obtener una URL local que expo-sharing pueda compartir.
 */
export async function writePdfForSharing(base64: string | undefined, prefix: string): Promise<string> {
  const directory = FileSystem.documentDirectory;

  if (!directory) {
    throw new Error('No se encontró un directorio local para compartir el PDF.');
  }
  if (!base64) {
    throw new Error('No se pudo obtener el contenido del PDF generado.');
  }

  // Antes de escribir el PDF nuevo, se borran los anteriores del mismo
  // prefijo: cada proforma/ficha técnica generada quedaba en disco para
  // siempre (nombre con timestamp único), acumulando espacio indefinidamente.
  // No debe bloquear la generación del PDF nuevo si la limpieza falla.
  try {
    const entries = await FileSystem.readDirectoryAsync(directory);
    const stale = entries.filter((name) => name.startsWith(`${prefix}-`) && name.endsWith('.pdf'));
    await Promise.all(
      stale.map((name) =>
        FileSystem.deleteAsync(`${directory}${name}`, { idempotent: true }).catch(() => {})
      )
    );
  } catch {
    // Ignorado a propósito: la limpieza es una mejora, no un requisito.
  }

  const targetUri = `${directory}${prefix}-${Date.now()}.pdf`;
  await FileSystem.writeAsStringAsync(targetUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return targetUri;
}
