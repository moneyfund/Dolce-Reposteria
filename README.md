# DOLCE Digital

Tienda pública + DOLCE Manager para DOLCE Repostería. Next.js 15, React 19, TypeScript, Tailwind CSS, Motion, Firebase y Vercel.

## Incluido en la primera versión

- Tienda editorial responsive: categorías, búsqueda, catálogo, carrito persistente, modalidad entrega/retiro, fecha, dedicatoria y registro de pedidos.
- Dashboard (/admin): métricas, gráfico semanal, pedidos con cambios de estado, clientes y gestión de productos/stock y campañas promocionales editables.
- Backend: API de pedidos que valida precios e inventario en servidor con Firestore y transacciones. API de administración protegida con Firebase Authentication y rol de personal.
- Modo de demostración controlado explícitamente por `NEXT_PUBLIC_DOLCE_LIVE_MODE` (por defecto desactivado el modo real): catálogo, pedidos y edición local en el navegador. **No son pedidos reales**. La configuración pública de Firebase por sí sola no habilita pedidos reales.

Las fotografías, nombres, clientes y precios iniciales son demostrativos y deben sustituirse por información autorizada por DOLCE.

## Inicio

Requisitos: Node.js 20+.

1. npm install
2. npm run dev
3. Abre http://localhost:3000 y http://localhost:3000/admin
4. npm run build y npm run typecheck

## Activación de Firebase

Configura en Vercel las variables del archivo .env.example.

Variables públicas: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_APP_ID, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID.

Solo servidor: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY. Nunca compartas la clave privada por chat ni la publiques en GitHub. Configúrala directamente en las variables protegidas de Vercel.

Activa Cloud Firestore y Authentication / Google. Aplica firestore.rules en Firebase. Para autorizar a un administrador, crea desde la consola Firebase el documento staff/{uid} con role: "owner" o "admin", donde uid corresponde al usuario que inició sesión con Google. Las APIs verifican este rol del lado servidor; la tienda no concede permisos al usuario final.

Colecciones: products/{id}, promotions/{id}, orders/{id}, staff/{uid}.

Antes de lanzar operaciones reales: configurar credenciales privadas, cargar un usuario en staff, publicar firestore.rules, verificar pedidos/estados en pruebas y finalmente poner NEXT_PUBLIC_DOLCE_LIVE_MODE=true en Vercel y volver a desplegar. El ID de Analytics es opcional; la analítica no se activa hasta configurar el consentimiento y la política correspondiente.

En modo real, el catálogo se inicia vacío y debe cargarse con precios oficiales. El cliente ve que el envío no está incluido en el subtotal y queda sujeto a confirmación. No hay pagos en línea.

## Antes de habilitar atención real

Confirmar marca, fotos, precio, cobertura, forma de cobro, horario, políticas de cancelación, privacidad, aviso de pedidos y protección contra automatización/abuso. Revisar permisos en Firebase, probar el flujo de reserva de stock y establecer un mecanismo de notificación al negocio.

Este desarrollo constituye un prototipo funcional de transferencia digital para la tesis UNAN. No demuestra por sí solo una mejora cuantificada de las ventas o posicionamiento.

## Alta segura del propietario

1. Antes de activar modo real, abre /admin/acceso e inicia sesión con tu cuenta Google autorizada en Firebase Authentication.
2. Copia tu UID y crea en Firestore `staff/{uid}` con el campo `role` (string) igual a `owner`.
3. En Vercel configura `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` directamente desde una cuenta de servicio de Firebase, sin compartir el archivo JSON o la clave por chat.
4. Publica las reglas del repositorio y comprueba en Manager la lectura pública de Firestore.
5. Una vez revisadas las operaciones con datos reales, configura `NEXT_PUBLIC_DOLCE_LIVE_MODE=true` y vuelve a desplegar.
