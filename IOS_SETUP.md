# Luvio · Guía de configuración iOS

## Requisitos previos

- macOS con Xcode 15+
- Apple Developer Account ($99/año)
- Node.js 18+
- CocoaPods: `sudo gem install cocoapods`

---

## 1. Setup inicial

```bash
# Instalar dependencias
npm install

# Añadir plataforma iOS (genera carpeta ios/)
npx cap add ios

# Build web → sincronizar con iOS
npm run build
npx cap sync ios

# Abrir en Xcode
npx cap open ios
```

## 2. Configurar Xcode

### Signing & Capabilities
1. Abre `ios/App/App.xcworkspace` en Xcode
2. Selecciona el target **App**
3. Tab **Signing & Capabilities**
4. Selecciona tu **Team** (tu Apple Developer account)
5. Bundle Identifier: `com.luvio.app`
6. Añade estas capabilities con el botón **+ Capability**:
   - **Sign in with Apple** (obligatorio si usas Google Sign-In)
   - **Push Notifications**
   - **Associated Domains** → `applinks:luvio.app` (para deep links)
   - **Background Modes** → Remote notifications

### Info.plist
Añade/verifica estas entradas en `ios/App/App/Info.plist`:

```xml
<!-- Descripción para permisos -->
<key>NSCameraUsageDescription</key>
<string>Para añadir fotos a tus gastos</string>

<!-- URL Scheme para deep links -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>luvio</string>
      <string>com.luvio.app</string>
    </array>
  </dict>
</array>

<!-- Google Sign-In reversed client ID -->
<key>GIDClientID</key>
<string>TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com</string>

<!-- Permitir conexiones Firebase -->
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>

<!-- Status bar style -->
<key>UIStatusBarStyle</key>
<string>UIStatusBarStyleLightContent</string>
<key>UIViewControllerBasedStatusBarAppearance</key>
<true/>
```

## 3. Sign in with Apple

### En Apple Developer Portal:
1. Ve a [developer.apple.com](https://developer.apple.com/account) → **Certificates, IDs & Profiles**
2. **Identifiers** → Tu App ID → Activa **Sign in with Apple**
3. **Keys** → Crea una key con **Sign in with Apple** activado
4. Guarda el Key ID y descarga el `.p8`

### En Firebase Console:
1. **Authentication** → **Sign-in method** → **Apple**
2. Activa Apple y configura:
   - **Service ID**: `com.luvio.app.signin`
   - **Team ID**: tu Apple Team ID
   - **Key ID**: el que generaste
   - **Private Key**: contenido del `.p8`

## 4. Push Notifications

### APNs Key:
1. Apple Developer → **Keys** → **Create a Key**
2. Activa **Apple Push Notifications service (APNs)**
3. Descarga el `.p8`

### En Firebase Console:
1. **Project Settings** → **Cloud Messaging** → **Apple app configuration**
2. Sube el APNs auth key (`.p8`)
3. Introduce tu Key ID y Team ID

### En Xcode:
La capability "Push Notifications" ya debe estar añadida (paso 2).

## 5. App Icons

```bash
# Crea un PNG de 1024x1024 con el logo de Luvio
# Fondo: #0a0a12 | Logo: gradiente coral→amber

# Instalar sharp para generar iconos
npm install sharp --save-dev

# Generar todos los tamaños
node scripts/generate-icons.js assets/icon-1024.png
```

## 6. Splash Screen

Edita `ios/App/App/Assets.xcassets/Splash.imageset/`:
- Crea una imagen splash con fondo `#0a0a12` y el logo "luvio"
- Tamaños: 1x, 2x, 3x

O configúralo en Xcode:
1. Abre `LaunchScreen.storyboard`
2. Pon background color `#0a0a12`
3. Añade el logo centrado

## 7. Universal Links (Deep Links)

Para que `https://luvio.app/join/CODE` abra la app:

1. Crea `public/.well-known/apple-app-site-association`:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.luvio.app",
        "paths": ["/join/*"]
      }
    ]
  }
}
```

2. En Xcode → Associated Domains: `applinks:luvio.app`

## 8. Stripe In-App Purchases

Apple requiere usar su sistema de pagos (StoreKit) para suscripciones in-app.
Stripe funciona si el pago es por servicios fuera de la app.

**Opción recomendada**: Usar StoreKit 2 para la suscripción Premium.

```bash
# Instalar plugin de Capacitor para StoreKit
npm install @capacitor-community/in-app-purchases
```

### En App Store Connect:
1. **My Apps** → Luvio → **Subscriptions**
2. Crea grupo: "Luvio Premium"
3. Producto: 3,99€/mes, ID: `com.luvio.app.premium.monthly`

## 9. Build para TestFlight

```bash
# Build web y sincronizar
npm run build
npx cap sync ios

# Abrir Xcode
npx cap open ios
```

En Xcode:
1. **Product** → **Archive**
2. **Distribute App** → **App Store Connect**
3. Sube el build
4. En App Store Connect → TestFlight → Manage Compliance → seleccionar build

## 10. App Store Submission

### Información requerida:
- **Nombre**: Luvio — Gastos en pareja
- **Subtítulo**: Comparte gastos con amor
- **Categoría**: Finanzas
- **Descripción**: (ver abajo)
- **Keywords**: gastos pareja, splitwise parejas, compartir gastos, cuentas pareja, finanzas pareja
- **Screenshots**: iPhone 15 Pro (6.7") + iPhone SE (4.7")
- **App Privacy**: Recopilas email y nombre (de Firebase Auth)
- **URL de privacidad**: https://luvio.app/privacy

### Descripción sugerida:

```
Luvio es la forma más sencilla de llevar las cuentas con tu pareja.

¿Quién pagó la cena? ¿Cuánto debemos del súper? Con Luvio lo sabéis en un vistazo.

✨ AÑADIR GASTO EN 3 TOQUES
Quién pagó → Categoría → Importe. Listo.

⚖️ BALANCE VISUAL
Nada de números aburridos. Ved quién debe a quién con una barra de progreso simple.

🎯 METAS COMPARTIDAS
¿Japón en agosto? Cread una meta y ahorrad juntos.

📸 RESUMEN MENSUAL VIRAL
Cada mes recibís una tarjeta con vuestros hábitos de gasto. Compartidla en Stories.

💡 INSIGHTS AUTOMÁTICOS
"Este mes habéis gastado 40% más en cenas" — Luvio os conoce.

Diseñado para parejas. Sin grupos, sin complicaciones.
Operativo en menos de 60 segundos.
```

### Review Guidelines a tener en cuenta:
- **4.3**: Tu app es diferente a Splitwise (solo 2 personas, insights emocionales, viral card)
- **3.1.1**: Si usas Stripe en vez de StoreKit, Apple puede rechazarte. Usa StoreKit para suscripciones.
- **5.1.1**: Necesitas política de privacidad y cuenta de prueba para el reviewer.
- **2.1**: Proporciona credenciales de demo en las notas del reviewer.

---

## Comandos útiles

```bash
npm run ios:live    # Dev con live reload en dispositivo
npx cap sync ios    # Sincronizar después de cambios en web
npx cap open ios    # Abrir Xcode
npx cap run ios     # Build y ejecutar en simulator
```
