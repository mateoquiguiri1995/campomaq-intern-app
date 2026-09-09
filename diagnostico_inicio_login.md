# Diagnóstico Técnico: Lentitud y Bloqueo al 70% en Login y Arranque de la App

Este documento detalla las causas técnicas por las cuales la aplicación experimenta demoras significativas al iniciar sesión o abrir la app, quedándose detenida en torno al **70% (específicamente 72%)**, a pesar de que el servidor/backend responde con rapidez.

---

## 1. Resumen Ejecutivo de la Causa Raíz

El estancamiento en el **70%** es un problema originado en la lógica del frontend y en la gestión de concurrencia de React Native, debido a tres factores principales:

1. **La Fórmula Matemática del Progreso Combinado**: La barra de carga muestra exactamente **72%** cuando el perfil del vendedor (`/auth/me`) ya cargó (aporta el 30%) y se ha completado únicamente una de las dos consultas iniciales (`products` o `clients`, que sitúa el progreso de bootstrap en 60% $\rightarrow 30 + 60 \times 0.7 = 72\%$).
2. **Efecto de Regresión de Progreso (Race Condition 100% $\rightarrow$ 72%)**: Si existe caché local en disco (AsyncStorage), la Fase 1 pone el progreso en 100%. Pero milisegundos después, la Fase 2 remota recibe la respuesta de la primera API y **sobrescribe el progreso reduciéndolo de nuevo a 60%**. Esto cancela el temporizador de salida (`clearTimeout`), dejando la pantalla congelada en 72%.
3. **Saturación del Pool de Conexiones HTTP y del Hilo de JS**: Al autenticarse, el frontend dispara en paralelo hasta 8 peticiones HTTP pesadas más 30 descargas de imágenes (`prefetchProductImages`). En dispositivos móviles (Android/iOS), el límite de conexiones simultáneas por host (4 a 6 sockets) encola las peticiones en el cliente, demorando la resolución de la segunda consulta aunque el servidor sea veloz.

---

## 2. Desglose Detallado de las Problemáticas Encontradas

### Problemática 1: La Fórmula de Progreso y el Punto de Detención en 72%

En [`app/_layout.tsx:144`](file:///C:/Users/raftd/GITHUB/campomaq-intern-android-app/app/_layout.tsx#L141-L155):
```typescript
const combinedProgress = Math.round((isLoading ? 0 : 30) + (bootstrapProgress * 0.7));
```

En [`src/features/bootstrap/AppBootstrapProvider.tsx:207-216`](file:///C:/Users/raftd/GITHUB/campomaq-intern-android-app/src/features/bootstrap/AppBootstrapProvider.tsx#L207-L216):
```typescript
const checkComplete = () => {
  if (!isMounted) return;
  if (productsDone && clientsDone) {
    setIsOfflineMode(hasLocalCache && (productsSyncFailed || clientsSyncFailed));
    setProgress(100);
    setIsLoading(false);
  } else if (productsDone || clientsDone) {
    setProgress(60); // ◄── AQUI
  }
};
```

- **Fase A (0% a 37%)**: `/auth/me` se ejecuta (`isLoading: true`). `bootstrapProgress` inicia en 10. Progreso = `0 + 7 = 7%`.
- **Fase B (37% a 72%)**: `/auth/me` responde muy rápido. `isLoading` pasa a `false` (suma 30%). En cuanto termina `getProducts` o `getClients` (la que responda primero), `checkComplete()` establece `setProgress(60)`.
  $$\text{Progreso mostrado} = 30 + (60 \times 0.7) = \mathbf{72\%}$$
  En pantalla se muestra: `Sincronizando clientes . . . (72%)`.
- **Fase C (Para llegar a 100%)**: Se requiere estrictamente que `productsDone && clientsDone` sean ambos `true`. Si la segunda petición se demora o queda encolada en el cliente, la barra queda congelada en 72%.

---

### Problemática 2: Regresión de Progreso y Cancelación de la Salida (`onComplete`)

En [`AppBootstrapProvider.tsx:166-199`](file:///C:/Users/raftd/GITHUB/campomaq-intern-android-app/src/features/bootstrap/AppBootstrapProvider.tsx#L166-L199):
```typescript
// FASE 1: Lectura inmediata desde disco local
Promise.all([
  getCachedProducts(),
  getCachedAllProducts(),
  getCachedClients(),
  getCachedAllClients(),
]).then(([cachedProducts, ...]) => {
  if (cachedProducts || cachedClients) {
    hasLocalCache = true;
    setProgress(100); // ◄── Pone 100% de inmediato
    setIsLoading(false);
  }
});
```

En [`src/components/common/SalesLoadingScreen.tsx:71-78`](file:///C:/Users/raftd/GITHUB/campomaq-intern-android-app/src/components/common/SalesLoadingScreen.tsx#L71-L78):
```typescript
useEffect(() => {
  if (progressProp === 100 && onComplete) {
    const t = setTimeout(() => {
      onComplete(); // ◄── Desmonta la pantalla tras 150ms
    }, 150);
    return () => clearTimeout(t);
  }
}, [progressProp, onComplete]);
```

#### ¿Qué ocurre aquí?
1. El usuario tiene datos en caché local.
2. La Fase 1 lee el caché en ~20ms y ejecuta `setProgress(100)`.
3. `SalesLoadingScreen` recibe `100` y programa el temporizador de 150ms para desmontarse.
4. En paralelo, la Fase 2 remota recibe la respuesta de `getProducts({ page: 1 })` a los 80ms.
5. Se llama a `checkComplete()`. Como `clientsDone` aún no termina, la condición evalúa `else if (productsDone || clientsDone)` y ejecuta:
   ```typescript
   setProgress(60); // ◄── Regresión abrupta de 100% a 60%
   ```
6. El progreso combinado cae de **100% a 72%**.
7. En `SalesLoadingScreen`, el cambio de `progressProp` dispara la limpieza del efecto:
   ```typescript
   clearTimeout(t); // ◄── Se cancela la salida
   ```
8. La pantalla **nunca se desmonta** y se queda esperando indefinidamente o hasta que termine la otra petición.

---

### Problemática 3: Avalancha de Peticiones Concurrentes (Saturación de Red en el Frontend)

En [`AppBootstrapProvider.tsx:271-320`](file:///C:/Users/raftd/GITHUB/campomaq-intern-android-app/src/features/bootstrap/AppBootstrapProvider.tsx#L271-L320):
En cuanto la Fase 1 pone `isLoading(false)`, se activan inmediatamente en paralelo dos efectos secundarios:
1. `getAllProducts()` $\rightarrow$ Pide `/products` (catálogo entero sin paginar) + `/stock` (existencias completas).
2. `getAllClients()` $\rightarrow$ Pide `/clients` (cartera completa sin paginar).
3. `prefetchProductImages(all)` $\rightarrow$ Descarga masiva de hasta **30 imágenes** simultáneas mediante `Image.prefetch()`.
4. En [`SellerProvider.tsx`](file:///C:/Users/raftd/GITHUB/campomaq-intern-android-app/src/features/sellers/SellerProvider.tsx#L70) se dispara `/sellers`.
5. Y al mismo tiempo corren las dos peticiones críticas del splash: `getProducts({ page: 1 })` y `getClients({ page: 1, pageSize: 10 })`.

#### Impacto en el cliente móvil:
- Los navegadores y motores móviles (Android OkHttp / iOS NSURLSession) limitan las conexiones HTTP simultáneas por host a un máximo de **4 a 6 conexiones**.
- Disparar más de 35 peticiones al mismo tiempo satura el pool del cliente.
- La petición de `getClients` o `getProducts` que debe liberar el 70% queda encolada en la cola interna del dispositivo móvil, esperando que se liberen sockets, dando la ilusión de que el servidor está lento cuando en realidad es un cuello de botella en el cliente.

---

### Problemática 4: Sobrecarga del Hilo Único de JavaScript (JS Thread Blocking)

Cada vez que se completan las cargas de catálogo y clientes:
1. Se ejecutan funciones pesadas de transformación sobre miles de registros:
   - `mapAvailableProducts`: une productos con existencias en un mapa de miles de entradas.
   - `mapApiClient`: mapea cientos de clientes y sus sub-arrays de `recentInvoices`.
2. Se serializan a strings de varios megabytes:
   - `JSON.stringify(allProducts)`
   - `JSON.stringify(allClients)`
3. Se envían a `AsyncStorage.setItem()` en el hilo de JavaScript.
4. Esta actividad bloquea la cola de microtareas del event loop de JavaScript en React Native, retrasando el procesamiento de los callbacks de red (`.then()`).

---

### Problemática 5: Doble Splash Screen Secuencial en Arranque en Frío

En [`app/_layout.tsx:102-121`](file:///C:/Users/raftd/GITHUB/campomaq-intern-android-app/app/_layout.tsx#L102-L121):
1. La app monta inicialmente `<LoadingScreen title="Bienvenido" />`, que ejecuta un temporizador simulado de **1.8 segundos** (`duration = 1800ms`) de forma obligatoria.
2. Una vez transcurridos los 1.8 segundos, `showSplash` pasa a `false`.
3. Inmediatamente después, si hay sesión, se monta `<SalesLoadingScreen />`, obligando al usuario a esperar una segunda barra de carga.
4. Esto duplica artificialmente el tiempo percibido de entrada a la aplicación.

---

### Problemática 6: Duplicación de Llamadas al Endpoint `/stock`

En [`productService.ts`](file:///C:/Users/raftd/GITHUB/campomaq-intern-android-app/src/features/catalog/services/productService.ts):
- `getProducts({ page: 1 })` consulta `/products?page=1` y `/stock`.
- En paralelo, `getAllProducts()` consulta `/products` y **vuelve a consultar `/stock`**.
- Ambas peticiones descargan exactamente el mismo listado completo de inventario dos veces consecutivas en los primeros segundos de inicio.

---

## 3. Matriz de Síntomas y Causas

| Síntoma Observado | Causa Técnica | Archivo(s) Involucrado(s) |
| :--- | :--- | :--- |
| **Se queda trabado en 70% / 72%** | `isLoading` terminó (30%) + solo una de las dos consultas terminó (60% $\times 0.7 = 42\%$). La segunda consulta está encolada o retrasada. | `app/_layout.tsx`<br>`AppBootstrapProvider.tsx` |
| **Parpadea a 100% y regresa a 70%** | Fase 1 (caché local) pone progreso en 100%, pero Fase 2 remota lo sobrescribe a 60% al resolver la primera petición. | `AppBootstrapProvider.tsx:196`<br>`AppBootstrapProvider.tsx:214` |
| **La pantalla de carga no se quita** | La regresión a 72% cancela el `setTimeout` de 150ms que ejecuta `onComplete()`. | `SalesLoadingScreen.tsx:71-78` |
| **La API responde rápido pero la app tarda** | Saturación de sockets en el cliente móvil por descarga simultánea de imágenes (`prefetch`) y catálogo completo en segundo plano. | `productCache.ts:58`<br>`AppBootstrapProvider.tsx:282` |
| **Doble pantalla de bienvenida** | Pantalla 1 ("Bienvenido") dura 1.8s fijos $\rightarrow$ Pantalla 2 (`SalesLoadingScreen`) vuelve a cargar. | `app/_layout.tsx:102-109` |

---

## 4. Hoja de Ruta Sugerida para la Solución (Cuando se decida aplicar)

1. **Garantizar la Monotonicidad del Progreso**:
   - Modificar `setProgress` en `AppBootstrapProvider` para que el progreso **nunca retroceda** (`setProgress(prev => Math.max(prev, newProgress))`).
2. **Diferenciar Arranque Rápido de Sincronización Pesada (Lazy Loading)**:
   - Mover la descarga del catálogo completo (`getAllProducts`), cartera completa (`getAllClients`) y la precarga de 30 imágenes (`prefetchProductImages`) para que se ejecuten **únicamente después de que el usuario ya esté interactuando en la pantalla de Inicio**, liberando el 100% del ancho de banda y del hilo de JS durante el login.
3. **No reiniciar el splash si hay caché en disco**:
   - Si la Fase 1 encuentra datos válidos en disco, marcar el inicio como completado de inmediato sin esperar la red, y realizar la actualización en segundo plano de manera 100% transparente.
4. **Reutilizar la llamada de `/stock`**:
   - Cachear o memorizar la respuesta de `/stock` en memoria durante el ciclo de arranque para evitar solicitarla dos veces seguidas.
5. **Unificar el flujo de Splash Inicial**:
   - Si el usuario ya tiene sesión activa, omitir el temporizador artificial de 1.8s de `LoadingScreen` ("Bienvenido") y mostrar directamente la aplicación o el splash comercial fluido.
