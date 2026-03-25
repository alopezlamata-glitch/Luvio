import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.luvio.app",
  appName: "Luvio",
  webDir: "dist",
  
  // ─── iOS-specific ───
  ios: {
    scheme: "Luvio",
    contentInset: "automatic",       // Respeta safe areas automáticamente
    backgroundColor: "#0a0a12",      // Fondo nativo mientras carga
    preferredContentMode: "mobile",
    allowsLinkPreview: false,        // Desactiva peek/pop en links
  },

  // ─── Plugins ───
  plugins: {
    SplashScreen: {
      launchAutoHide: false,         // Lo controlamos nosotros
      backgroundColor: "#0a0a12",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
      launchFadeOutDuration: 300,
    },
    StatusBar: {
      style: "DARK",                 // Texto claro sobre fondo oscuro
      backgroundColor: "#0a0a12",
    },
    Keyboard: {
      resize: "body",               // El body se ajusta al teclado
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },

  // ─── Server (dev only) ───
  // Descomentar para livereload en desarrollo:
  // server: {
  //   url: "http://YOUR_LOCAL_IP:3000",
  //   cleartext: true,
  // },
};

export default config;
