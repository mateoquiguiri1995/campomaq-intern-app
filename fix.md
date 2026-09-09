Has puesto el dedo en uno de los puntos más críticos de la experiencia
  de usuario: la reconexión a internet nunca debe reiniciar la navegación
  ni borrar el estado de trabajo del vendedor.

  Analicemos minuciosamente la arquitectura actual del flujo
  online/offline para entender por qué ocurre este salto abrupto y cómo
  diseñar una reconexión 100% sigilosa y transparente.
  ──────
  ### 1. La Cadena de Reacción Destructiva (Diagnóstico)

  Actualmente, cuando el teléfono pierde y recupera la conexión a
  internet, se desencadena una reacción en cadena en cascada:

  ┌────────────────────────────────┐
  │                                │
  │ Estás en Producto o Cotización │
  │                                │
  └────────────────┬───────────────┘
                   │
                   ▼
  ┌────────────────────────────────┐
  │                                │
  │        Se corta el internet        │
  │                                    │
  └──────────────────┬─────────────────┘
                     │
                     ▼
  ┌────────────────────────────────────┐
  │                                    │
  │ Entra modo offline con caché local │
  │                                    │
  └──────────────────┬─────────────────┘
                     │
                     ▼
  ┌────────────────────────────────────┐
  │                                    │
  #### Causa 1: Desmontaje total del Stack de navegación en               
  _layout.tsx:127-139
  En _layout.tsx:127:

    if (hasSession && (showSalesSplash || isLoading || isBootstrapping)) {
      const combinedProgress = Math.round((isLoading ? 0 : 30) +
  (bootstrapProgress * 0.7));
    
      return (
        <SalesLoadingScreen
          progress={combinedProgress}
          onComplete={() => setShowSalesSplash(false)}
        />
      );
    }
    
    return (
      <Stack screenOptions={{ headerShown: false }}>
        {/* Pantallas de la app */}
      </Stack>
    );
  • El problema: La pantalla de carga con la barra de progreso
  (SalesLoadingScreen) fue concebida para el arranque en frío (cuando
  abres la app o recién inicias sesión). Sin embargo, al estar
  condicionada directamente a isBootstrapping e isLoading, cada vez que
  cualquiera de los dos vuelve a ponerse en true en segundo plano, React
  desmonta y destruye el componente <Stack> completo para volver a pintar
  la pantalla de bienvenida.
  • El impacto: Cuando el <Stack> se destruye, la pantalla en la que
  estabas (product/[id], quotes/select-products, quotes/summary)
  desaparece de la memoria de navegación. Cuando el Stack vuelve a
  montarse, Expo Router arranca desde la ruta raíz: app/(tabs)/index.tsx
  (Inicio).
  ──────
  #### Causa 2: reload() reactivo con bloqueo en                          
  AppBootstrapProvider.tsx:266-277
  En el listener de red de AppBootstrapProvider.tsx:266-277:

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected === true && state.
  isInternetReachable !== false;
      if (!isOnline) {
        wasOffline = true;
        setIsOfflineMode(true);
      } else if (wasOffline) {
        wasOffline = false;
        setIsOfflineMode(false);
        reload(); // ◄── AQUI SE DETONA EL RELOAD
      }
    });

  Y la función reload() hace lo siguiente (AppBootstrapProvider.tsx:97):

    setIsLoading(true); // ◄── Activa el bloqueo global
    setProgress(10);

  • El problema: Cuando regresa internet, la app ya tiene productos y
  clientes cargados en memoria y en disco local. Volver a llamar
  setIsLoading(true) le avisa a toda la app que "no tiene datos",
  disparando la pantalla de carga de _layout.tsx y los spinners de
  useCatalog.ts:232.
  • Lo que debería suceder: Al volver el internet, la actualización de
  datos debe ser una revalidación silenciosa en segundo plano (background
  revalidation). Debe consultar las APIs y refrescar el caché sin bloquear
  la pantalla ni alterar isLoading.
  ──────
  #### Causa 3: Supabase pone isLoading = true en cada refresco de token  
  en AuthProvider.tsx:254-258

  En AuthProvider.tsx:254-258:

    const { data } = supabase.auth.onAuthStateChange((_event, newSession)
  => {
      ...
      setHasSession(true);
      setProfileError(null);
      setIsLoading(true); // ◄── Activa isLoading en CUALQUIER evento de
  Auth
      await loadProfile(newSession.access_token, userId, version);
      if (isMounted && authVersion.current === version)
  setIsLoading(false);
    });

  • El problema: Cuando el teléfono recupera señal, la librería cliente de
  Supabase reconecta sus WebSockets y emite un evento de autenticación
  (como TOKEN_REFRESHED). El listener ejecuta setIsLoading(true) mientras
  hace una petición de red a /auth/me. Mientras /auth/me responde (entre
  500ms y 2 segundos), isLoading es true, lo que inmediatamente hace que
  _layout.tsx desmonte el Stack.
  ──────
  #### Causa 4: Vulnerabilidad del borrador de cotización en              
  QuoteBuilderProvider.tsx:76-84

  En QuoteBuilderProvider.tsx:76-84:

    const prevUserIdRef = useRef(userId);
    
    useEffect(() => {
      if (prevUserIdRef.current !== userId) {
        prevUserIdRef.current = userId;
        resetBuilder();
      }
    }, [userId, resetBuilder]);

  • El problema:
      1. Si durante la reconexión de Supabase la sesión tiene un micro-
      parpadeo donde userId pasa momentáneamente por null antes de
      revalidar el token, este useEffect interpreta que "cambió de
      usuario" y llama a resetBuilder(), borrando todos los productos
      añadidos y el cliente seleccionado.
      2. Al ser expulsado al Home, el botón flotante + (FAB) de Catálogo e
      Inicio tiene configurado:
        function handleNewQuote() {
          resetBuilder(); // ◄── Se limpia intencionalmente al empezar de
      nuevo
          router.push('/quotes/select-client');
        }
      Como el usuario no sabe dónde quedó su cotización anterior, presiona
      el botón + para continuar y él mismo termina ejecutando el reseteo.

  ──────
  ### 3. La Solución: Principios para una "Reconexión Sigilosa"

  Para lograr que la reconexión sea completamente invisible y suave, se
  deben implementar cuatro pilares:


  ┌───────────────────────────────────────────────────────────────────────
  ──┐
    │                      RECONEXIÓN SIGILOSA (SEAMLESS)
  │

  ├───────────────────────────────────────────────────────────────────────
  ──┤
    │ 1. Inmutabilidad del Stack de Navegación:
  │
    │    Una vez que la app montó <Stack>, NUNCA se desmonta mientras haya
  │
    │    sesión. El Splash inicial solo se muestra una vez al abrir la app.
  │

  ├───────────────────────────────────────────────────────────────────────
  ──┤
    │ 2. Sincronización en Segundo Plano (Sin bloqueo):
  │
    │    Al regresar la conexión:
  │
    │    • isOfflineMode pasa a false (el banner amarillo desaparece
  suave).  │
    │    • Se sincronizan productos y clientes en segundo plano sin poner
  │
    │      isLoading = true. El usuario sigue leyendo o cotizando sin
  pausas. │

  ├───────────────────────────────────────────────────────────────────────
  ──┤
    │ 3. Auth Token Refresh Silencioso:
  │
    │    Si ya existe sesión de usuario activa, la revalidación de
  /auth/me   │
    │    corre en silencio sin activar isLoading global.
  │

  ├───────────────────────────────────────────────────────────────────────
  ──┤
    │ 4. Blindaje del Borrador de Cotización:
  │
    │    • Proteger el QuoteBuilder contra fluctuaciones transitorias de
  red. │
    │    • Si la pantalla nunca se desmonta, el formulario nunca se pierde.
  │

  └───────────────────────────────────────────────────────────────────────
  ──┘

  #### Detalles de los cambios clave:

  1. **En _layout.tsx**:
      • Mantener un flag isInitialBootComplete (o montar <Stack> de forma
      permanente en cuanto la sesión inicial está lista).
      • Ningún refresco o reconexión posterior volverá a renderizar
      SalesLoadingScreen.
  2. **En AppBootstrapProvider.tsx**:
      • Crear una función syncInBackground() que descargue silenciosamente
      las actualizaciones de productos y clientes sin alterar isLoading:
      true ni el indicador progress.
      • El listener de NetInfo únicamente cambiará setIsOfflineMode(false)
      y ejecutará la sincronización silenciosa.
  3. **En AuthProvider.tsx**:
      • Solo encender isLoading: true en el arranque en frío inicial (cold
      boot) o al iniciar sesión explícitamente desde la pantalla de login.
      Si ya existe session, actualizar el perfil en segundo plano.
  4. **En QuoteBuilderProvider.tsx**:
      • Evitar que resetBuilder() se ejecute si userId es transitoriamente
      null. Solo debe ejecutarse si efectivamente cambia de un usuario
      autenticado a otro usuario distinto.

  ¿Te parece bien esta arquitectura? Si estás de acuerdo, procedemos a
  aplicar estos ajustes paso a paso garantizando que la app no vuelva a
  hacer ningún salto visual ni reinicio de pantalla.