# Auditoría general — Campomaq Intern App

Fecha de auditoría: 2026-09-08 · Última actualización: 2026-09-08 · Rama: `dev`

Este documento se actualiza a medida que se van aplicando las correcciones. La mayoría de los hallazgos de severidad alta y media ya están corregidos en el working tree (sin commitear). Al final hay una sección **"Qué queda pendiente"** con todo lo que falta.

Convención de severidad: 🔴 Alta · 🟠 Media · 🟡 Baja. Estado: ✅ Corregido · ⏳ Pendiente · 🚫 Descartado a propósito (con motivo).

---

## 1. Catálogo: parpadeo al hacer scroll — ✅ Corregido, y además simplificado

**Causa raíz:** `catalog.tsx` reordenaba el arreglo completo de productos (por margen/precio/nombre) *después* de que `useCatalog()` ya había armado la porción visible. Cada `loadMore()` insertaba la página nueva en medio del arreglo ya ordenado, no al final, forzando a React/FlatList a reubicar tarjetas que el usuario ya estaba viendo — de ahí el parpadeo en cada scroll.

**Decisión final (pedida explícitamente):** en vez de mantener el ordenamiento y solo arreglar cómo se aplicaba, **se eliminó el ordenamiento por completo**. El catálogo ahora muestra los productos exactamente en el orden en que llegan de la API, sin selector de "Margen/Precio/Nombre" ni modal de ordenamiento. Esto además simplifica el código: ya no hace falta preocuparse por reordenar nada al paginar.

Cambios:
- `src/features/catalog/hooks/useCatalog.ts` — se quitó `SortType`, la función `sortProducts` y el parámetro `sortBy`; `visibleProducts` ahora recorta directamente sobre `filteredProducts` (el orden de llegada de la API/caché), sin paso de ordenamiento intermedio.
- `app/(tabs)/catalog.tsx` — se quitó el estado `sortBy`, el botón "Margen ▾", el modal "Ordenar productos" completo y sus estilos (`sortRightBtn`, `sortSheet`, `sortOption*`, etc., eliminados de `app_tabs_catalog.ts`). El contador ahora dice solo "N productos", sin "· ordenado por X".
- `ProductCard` quedó envuelto en `React.memo` y `ProductList`'s `renderItem` en `useCallback` (mejora de rendimiento del scroll, independiente del bug de orden).

**Efecto colateral positivo que se mantiene:** una vez que el catálogo completo (`allProducts`) termina de precargarse en segundo plano, el scroll pasa a revelar productos desde esa copia completa en memoria en vez de seguir pidiendo páginas de red una por una — más rápido y más resiliente offline. El orden de esos productos sigue siendo el de la API, nunca se reordena.

**Cómo verificar:** abrir Catálogo, hacer scroll repetido hasta el final varias veces, con y sin filtro de categoría/marca — ninguna tarjeta debería cambiar de posición ni parpadear.

---

## 2. Clientes: la lista se "encogía" de golpe — ✅ Corregido

Mismo patrón de bug que el del catálogo (aunque sin ordenamiento de por medio): al terminar de sincronizar `allClients` en segundo plano, la lista volvía a mostrar solo los primeros 10 clientes aunque el usuario ya hubiera scrolleado más.

**Fix aplicado** (`src/features/clients/hooks/useClients.ts`): mismo patrón que catálogo — `usingLocalBrowseSource` + un `useEffect` que sube `visibleCount` cuando `allClients` llega, para que la lista nunca retroceda. De paso, pull-to-refresh también quedó arreglado acá (reinicia la paginación a la página 1 con cada dato fresco del bootstrap). `ClientCard` con `React.memo`, `ClientList`'s `renderItem` con `useCallback`. El filtro de estado (Activo/Inactivo) se movió adentro del hook para que el contador y `hasMore` reflejen el mismo conjunto que se muestra.

---

## 3. Cotizaciones: descuento por monto fijo en dólares — ✅ Implementado y rediseñado

**Pedido:** poder aplicar el descuento de una línea en dólares además de en porcentaje (ej. producto de $134, descuento de $4).

**Primera versión (con problema de diseño reportado) → ya corregida:** la primera implementación usaba dos botones sueltos con borde propio para elegir %/$ , que quedaban visualmente desalineados y desproporcionados junto al campo de texto.

**Diseño final, en `QuoteItemEditorModal.tsx` + su hoja de estilos:**
- Un **segmented control real** (un solo contenedor tipo "pill" con fondo, donde el segmento activo se resalta) para elegir % o $, en vez de dos botones independientes.
- Un **campo de descuento con el símbolo integrado** dentro del mismo recuadro (el "$" o "%" se ve pegado al número, así el tipo de descuento es evidente aunque no se mire el toggle).
- Un **resumen compacto** debajo (fondo suave, dos filas: "Descuento: −$4.00" y "Total línea: $130.00"), con el mismo lenguaje visual que los totales de `app/quotes/summary.tsx`, en vez de una sola línea de texto plano.
- El campo se limpia al cambiar de modo (evita que "12" pase de significar "12%" a "$12" sin que el vendedor lo note).
- En modo "$" el descuento se clampea automáticamente al subtotal de la línea (no se puede descontar más de lo que vale).
- Al editar un ítem que ya tenía descuento en dólares guardado, el modal abre directo en modo "$" con ese valor.
- De paso quedó corregido el bug de truncado del modo "%" ("12.5" ya no se convierte en "12").

**Cómo verificar:** en "Agregar a la cotización", tocar el toggle %/$, escribir un valor en cada modo y confirmar que el resumen y el total de línea calculan correctamente.

---

## 4. Otros hallazgos — alta y media severidad, todos ✅ corregidos

| Hallazgo | Archivo(s) | Estado |
|---|---|---|
| Pull-to-refresh roto tras el primer scroll (Catálogo) | `useCatalog.ts` | ✅ |
| Botón "eliminar borrador" también abría la cotización | `DraftQuoteCard.tsx` | ✅ |
| "Enviada" se marcaba sin confirmar que se compartió el PDF | `app/quotes/summary.tsx` — ahora hay botón "Reenviar PDF" si el estado ya avanzó | ✅ |
| Spinner de refresh no visible durante la sincronización | `AppBootstrapProvider.tsx` (+ `useCatalog.ts`, `useClients.ts` conectados a `isSyncing`) | ✅ |
| Caché de `hasMore` asumía siempre `true` | `AppBootstrapProvider.tsx`, `productCache.ts` | ✅ |
| Error transitorio bloqueaba la carga del catálogo/cartera completos | `AppBootstrapProvider.tsx` | ✅ |
| `/stock` se pedía dos veces por arranque/sync | `productService.ts` (promesa compartida) | ✅ |
| Falso "sin resultados" al filtrar por categoría en el primer segundo | `useCatalog.ts` | ✅ |
| PDFs generados nunca se limpiaban del disco | `pdfSharing.ts` (borra el anterior antes de crear uno nuevo) | ✅ |
| Cantidad sin tope en los botones +/- del resumen de cotización | `app/quotes/summary.tsx` | ✅ |
| Tarjetas de Catálogo/Clientes sin memoizar | `ProductCard`, `ProductList`, `ClientCard`, `ClientList` | ✅ |
| Filtro de estado desincronizado de `hasMore` en Clientes | `useClients.ts`, `app/(tabs)/clients.tsx` | ✅ |

---

## 5. Otros hallazgos — baja severidad que afectaban lógica o visual, ✅ corregidos

- `isMounted` guard faltante en `loadDashboardData` (Inicio).
- `formatTimeAgo` no validaba fechas inválidas ("Hace NaN días").
- Botones sin función (campana de notificaciones en Catálogo y ficha de cliente, menú de perfil) — ahora muestran "Próximamente".
- Carrusel de imágenes de producto no reaccionaba a rotación/tablets (`Dimensions.get` → `useWindowDimensions`).
- Color hardcodeado en `BrandSelect.tsx` (ahora usa `colors.surface`).
- `try/catch` faltante en `secureStore.ts` (rama web).
- IDs de cotización con más entropía (no se agregó `expo-crypto` por no ser dependencia existente del proyecto).
- Mitigación al bug de reconstrucción de términos por texto en `QuoteTermsModal.tsx` (match por línea completa en vez de substring libre).

---

## 5.1 — 🔴 Compartir ficha técnica fallaba con "Not allowed to read file under given URL" — ✅ Corregido

Reportado por el usuario después de esta auditoría (no lo detectó la revisión estática original — es un fallo que solo aparece al ejecutar `expo-sharing` contra la caché temporal de `expo-print` en ciertos dispositivos/versiones de Expo Go).

**Causa:** `shareProductTechnicalSheetPdf` (`src/features/catalog/services/productPdf.ts`) compartía directamente el `uri` que devuelve `Print.printToFileAsync`, que apunta a la caché temporal de expo-print — `expo-sharing` puede rechazar leer ese `uri` con el error exacto que reportó el usuario. La generación de la **proforma** (`quotePdf.ts`) nunca tuvo este problema porque ya usaba el workaround correcto: pedir el PDF en `base64` y reescribirlo en `documentDirectory` (vía `src/utils/pdfSharing.ts`) antes de compartirlo — una ubicación que `expo-sharing` sí puede leer siempre. La ficha técnica nunca había adoptado ese mismo mecanismo.

**Fix:** se alineó `shareProductTechnicalSheetPdf` con el mismo patrón ya probado de `quotePdf.ts` — `Print.printToFileAsync({ ..., base64: true })` + `writePdfForSharing(base64, 'ficha-tecnica')`. No se tocó `quotePdf.ts` ni `pdfSharing.ts` (la proforma seguía funcionando bien, no había que alterarla). Cambio acotado a 2 bloques de `productPdf.ts`.

---

## 6. Qué queda pendiente

### 6.1 — 🚫 Descartado a propósito (por riesgo/beneficio, explicado al usuario)

- **Imágenes Base64 embebidas en `productPdf.ts` (~140KB)** — es solo peso de bundle/legibilidad del archivo, no afecta lógica ni visual de la app en uso. Migrarlas a assets reales + carga en tiempo de generación del PDF tiene riesgo real de romper la generación de fichas técnicas para un beneficio bajo. **Si se quiere hacer,** es una tarea aparte, acotada a `productPdf.ts`, con prueba manual de "compartir ficha técnica" en un dispositivo real antes de dar por buena.
- **Objetos completos (Producto/Cliente) serializados en parámetros de navegación** (`router.push({ params: { data: JSON.stringify(...) } })`) — riesgo teórico (límite práctico de tamaño de Intent extras en Android), no confirmado como crash reproducido. El fix correcto (guardar el objeto en una referencia en memoria y pasar solo el `id`) toca 4 pantallas de navegación a la vez (`catalog.tsx`/`product/[id].tsx`, `clients.tsx`/`client/[id].tsx`), en una zona de la app que ya tuvo bugs de navegación en el pasado (ver `diagnostico_inicio_login.md`). **Si se quiere hacer,** conviene como tarea aislada con pruebas de navegación completas (abrir detalle, volver atrás, refrescar) antes de mezclarla con otros cambios.

### 6.2 — 🟡 Baja, cosmético/deuda técnica — no aplicado (no afecta lógica ni visual, a pedido)

Código muerto y duplicaciones que no cambian el comportamiento de la app: `SESSION_MOUNT_KEY` sin uso en `app/_layout.tsx`, bloque MOCK de login comentado y obsoleto en `authService.ts`, campo `mainPrice` duplicado de `priceA` en `types.ts`/`productMapper.ts`, hook `useMonthlyGoal.ts` sin ningún import en el proyecto, doble mecanismo de fallback redundante en `MonthlyGoalCard.tsx`, paleta de colores propia duplicada en `login.tsx` (en vez de `theme/colors.ts`), versión de app hardcodeada (`v2.4.1`) en `login.tsx`, `console.log` de red activo en producción en `src/api/client.ts`, falta `getItemLayout` en `ProductList`/`ClientList` (se dejó fuera porque las alturas de las tarjetas no son estrictamente fijas — implementarlo mal introduciría huecos/superposiciones visuales, un riesgo peor que el problema), sanitización de HTML inconsistente entre el PDF de ficha técnica y la vista de detalle en pantalla (`sanitizeTechnicalHtml` no se reutiliza en `ProductDescription.tsx`).

### 6.3 — 🟡 Nota arquitectónica, no es un bug de código

**Cotizaciones sin respaldo en backend:** `quoteService.ts` guarda y lee cotizaciones exclusivamente en `AsyncStorage` local. Si el vendedor cambia de dispositivo, desinstala la app o se corrompe el almacenamiento, se pierde el historial completo sin posibilidad de recuperación. No hay solución "simple" para esto — implica diseñar un backend de cotizaciones. Vale la pena tenerlo en el radar si el volumen de cotizaciones es valioso para el negocio.

### 6.4 — Recomendación de proceso, no de código

Todo lo de este documento se validó por lectura de código y compilación (`npx tsc --noEmit`, sin errores en el estado actual), **no por ejecución en emulador/dispositivo real**. Antes de considerar esto "listo para producción", se recomienda probar en un dispositivo Android real al menos:
1. Scroll de Catálogo y Clientes hasta el final, repetidas veces, con y sin filtros, y con conexión lenta/offline.
2. Pull-to-refresh en ambas listas.
3. Flujo completo de cotización: agregar producto con descuento en % y en $, guardar borrador, enviar, y "Reenviar PDF" en una ya enviada.
4. Los botones que antes no hacían nada (campana, menú de perfil) — confirmar que el aviso "Próximamente" se ve bien.

---

## 7. Lo que ya estaba bien (sigue vigente)

- Patrón *stale-while-revalidate* de `AppBootstrapProvider` para trabajo offline.
- `reports.tsx` como mejor referencia de fetch con limpieza `isMounted`.
- Validaciones de transición de estado en `quoteService.ts` (Pendiente → Enviada → Aceptada/Rechazada).
- Reintento de token 401 en `src/api/client.ts` (refresh silencioso + un solo retry).
- Manejo de tokens/credenciales sin problemas de seguridad detectados; `secureStore.ts` usa `expo-secure-store` en nativo.
- Todo el flujo de cotizaciones funciona 100% offline por diseño.
