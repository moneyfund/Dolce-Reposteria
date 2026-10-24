# DOLCE Digital — Pastelería de Matagalpa

Plataforma de tienda pública y panel DOLCE Manager. Next.js, React, TypeScript, Tailwind, Motion, Firebase Authentication, Cloud Firestore, Storage y Vercel.

## Arquitectura vigente (sin Firebase Admin SDK)

- **Tienda:** consulta en tiempo real los productos `active=true` y promociones públicas. El carrito se conserva en el navegador. El checkout valida nombres, precios y existencias desde Firestore antes de escribir la solicitud.
- **Autenticación de clientes:** Firebase Authentication anónima permite comprar sin crear contraseña. Cada pedido se asocia al UID temporal del cliente. Hay que habilitar **Anonymous** en Firebase Console → Authentication → Sign-in method. Google debe permanecer habilitado para el personal de DOLCE.
- **Pedidos reales:** `orders/{id}` recibe `ownerUid`, `customer`, `items`, `subtotal`, `deliveryFee`, `total`, `notes`, `status=Nuevo` y `createdAt=serverTimestamp()`. La regla valida los precios contra los documentos originales de `products`; **no confía en el subtotal del navegador**. Máximo 5 productos distintos por pedido y 10 unidades de cada uno.
- **Manager:** inicio de sesión con Google, autorizado exclusivamente para `norvingarcia220@gmail.com` con correo verificado y proveedor Google. La aplicación y las reglas de Firestore/Storage comprueban esa identidad mediante el ID token firmado por Firebase; **no existe registro `staff` ni alta manual de UID**. Escucha `orders`, `products` y `promotions` en tiempo real.
- **Inventario:** el checkout verifica las existencias pero **no reserva ni descuenta stock automáticamente**. El equipo debe confirmar disponibilidad y actualizar el inventario al gestionar pedidos; evitar prometer una reserva automática antes de implementar transacciones de inventario.
- **Storage:** mantiene los permisos de `storage.rules` para fotos públicas de catálogo/promociones y adjuntos privados. La carga de fotos todavía usa URL HTTPS, no hay interfaz de subida directa.

## Configuración inicial

1. En [Firebase Console](https://console.firebase.google.com/project/dolce-reposteria) habilita Firestore, Authentication **Google + Anonymous** y Storage.
2. Publica [`firestore.rules`](./firestore.rules) en **Firestore Database → Reglas**; las nuevas reglas autorizan solo al propietario y conservan las validaciones de pedidos.
3. Publica [`storage.rules`](./storage.rules) en **Storage → Reglas**. **Un despliegue de Vercel no actualiza las reglas de Firebase**; publicarlas es imprescindible para la nueva autorización.
4. Abre [`/admin`](https://dolce-reposteria.vercel.app/admin) e inicia sesión con **`norvingarcia220@gmail.com`**. Accede directamente al panel, sin crear un documento `staff`. Cualquier otra cuenta es rechazada.
5. Crea al menos **un producto real, activo y con precio entero en C$**. No hay catálogo ficticio ni órdenes de prueba en producción.
6. Verifica un pedido real pequeño desde la web pública, comprueba que aparece en `orders` y en DOLCE Manager, y confirma el flujo antes de publicitar la tienda.

## Vercel

Mantén las variables **públicas** existentes:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

La app **ya no depende** de `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_PROJECT_ID` ni `NEXT_PUBLIC_DOLCE_LIVE_MODE`. No es necesario generar una clave de cuenta de servicio para pedidos.

## Publicación y desarrollo

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Los archivos `firebase.json` y `.firebaserc` también permiten desplegar reglas con Firebase CLI desde una sesión autorizada:

```bash
firebase login
firebase deploy --only firestore:rules,storage --project dolce-reposteria
```

El despliegue de Next.js se gestiona automáticamente mediante GitHub → Vercel. **El despliegue de Vercel no publica reglas Firebase**.

## Límites de seguridad antes de difusión masiva

La validación de precio, cantidades, identidad y rol se aplica con Security Rules (no solamente con botones de la UI). Firestore no tiene limitación de frecuencia de pedidos basada en IP integrada; para tráfico público a escala implementar Firebase App Check, límites antiabuso y monitorización de pedidos. No habilitar escrituras generales en Firestore. Los pedidos siguen pendientes de confirmación por el negocio; no procesan pagos ni cobran entrega en línea.

## Contexto académico

Implementación de la propuesta de transferencia digital para la tesis UNAN de DOLCE Pastelería. Una aplicación operativa no demuestra por sí misma efectos estadísticos sobre ventas o posicionamiento: se requiere medición posterior.
