/**
 * Luvio · Native iOS Utilities
 *
 * Wrapper sobre Capacitor plugins que degrada gracefully en web.
 * Importa estas funciones en vez de los plugins directamente.
 */

import { Capacitor } from "@capacitor/core";

// ─── Platform detection ───
export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === "ios";
export const isWeb = !isNative;

// ─── Haptics ───
// Feedback táctil nativo — crucial para UX iOS premium
let HapticsPlugin = null;

async function loadHaptics() {
  if (!isNative) return null;
  if (!HapticsPlugin) {
    const mod = await import("@capacitor/haptics");
    HapticsPlugin = mod.Haptics;
  }
  return HapticsPlugin;
}

export async function hapticLight() {
  const h = await loadHaptics();
  h?.impact({ style: "light" }); // Seleccionar categoría
}

export async function hapticMedium() {
  const h = await loadHaptics();
  h?.impact({ style: "medium" }); // Confirmar gasto
}

export async function hapticHeavy() {
  const h = await loadHaptics();
  h?.impact({ style: "heavy" }); // Equilibrar balance
}

export async function hapticSuccess() {
  const h = await loadHaptics();
  h?.notification({ type: "success" }); // Gasto añadido ✓
}

export async function hapticWarning() {
  const h = await loadHaptics();
  h?.notification({ type: "warning" }); // Paywall
}

export async function hapticError() {
  const h = await loadHaptics();
  h?.notification({ type: "error" }); // Error
}

export async function hapticSelection() {
  const h = await loadHaptics();
  h?.selectionStart(); // Cambiar entre opciones
}

// ─── Share ───
// Share Sheet nativo de iOS
export async function nativeShare({ title, text, url, files }) {
  if (!isNative) {
    // Fallback web: Web Share API o clipboard
    if (navigator.share) {
      return navigator.share({ title, text, url, files });
    }
    if (url) {
      await navigator.clipboard.writeText(url);
      return { activityType: "clipboard" };
    }
    return null;
  }

  const { Share } = await import("@capacitor/share");

  // Si hay archivos (imagen del resumen viral), usar share con file
  if (files?.length) {
    return Share.share({
      title: title || "Luvio",
      text: text || "",
      url: files[0], // Capacitor Share acepta file URIs
      dialogTitle: title || "Compartir desde Luvio",
    });
  }

  return Share.share({
    title: title || "Luvio",
    text: text || "",
    url: url || "",
    dialogTitle: title || "Compartir desde Luvio",
  });
}

// Compartir imagen generada (para resumen viral)
export async function shareImage(canvas, metadata = {}) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

  if (isNative) {
    // En nativo: convertir a base64 y compartir
    const reader = new FileReader();
    const base64 = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const fileName = `luvio-resumen-${Date.now()}.png`;

    // Guardar temporalmente
    await Filesystem.writeFile({
      path: fileName,
      data: base64.split(",")[1],
      directory: Directory.Cache,
    });

    const fileUri = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    });

    return nativeShare({
      title: metadata.title || "Mi resumen Luvio",
      text: metadata.text || "Nuestro resumen del mes en Luvio 💕",
      files: [fileUri.uri],
    });
  }

  // Fallback web
  const file = new File([blob], "luvio-resumen.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    return navigator.share({
      files: [file],
      title: metadata.title || "Luvio",
      text: metadata.text || "",
    });
  }

  // Último fallback: descargar
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "luvio-resumen.png";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Status Bar ───
export async function configureStatusBar() {
  if (!isNative) return;

  const { StatusBar, Style } = await import("@capacitor/status-bar");
  await StatusBar.setStyle({ style: Style.Dark });
  if (isIOS) {
    await StatusBar.setOverlaysWebView({ overlay: true }); // Content under status bar
  }
}

// ─── Keyboard ───
export async function setupKeyboard(onShow, onHide) {
  if (!isNative) return () => {};

  const { Keyboard } = await import("@capacitor/keyboard");

  const showListener = await Keyboard.addListener("keyboardWillShow", (info) => {
    document.documentElement.style.setProperty("--keyboard-height", `${info.keyboardHeight}px`);
    onShow?.(info.keyboardHeight);
  });

  const hideListener = await Keyboard.addListener("keyboardWillHide", () => {
    document.documentElement.style.setProperty("--keyboard-height", "0px");
    onHide?.();
  });

  return () => {
    showListener.remove();
    hideListener.remove();
  };
}

// ─── Splash Screen ───
export async function hideSplash() {
  if (!isNative) return;
  const { SplashScreen } = await import("@capacitor/splash-screen");
  await SplashScreen.hide({ fadeOutDuration: 300 });
}

// ─── App lifecycle ───
export async function setupAppListeners(onResume) {
  if (!isNative) return () => {};

  const { App } = await import("@capacitor/app");

  // Manejar back button (Android, no aplica en iOS pero por si acaso)
  const backListener = await App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    }
  });

  // Cuando la app vuelve a primer plano, refrescar datos
  const resumeListener = await App.addListener("resume", () => {
    onResume?.();
  });

  return () => {
    backListener.remove();
    resumeListener.remove();
  };
}

// ─── Push Notifications ───
export async function setupPushNotifications(onToken, onNotification) {
  if (!isNative) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  // Pedir permiso
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return;

  // Registrar
  await PushNotifications.register();

  // Token recibido — guardar en Firebase para enviar notificaciones
  await PushNotifications.addListener("registration", (token) => {
    console.log("[Push] Token:", token.value);
    onToken?.(token.value);
  });

  // Notificación recibida con app abierta
  await PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("[Push] Received:", notification);
    onNotification?.(notification);
  });

  // Tap en notificación
  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("[Push] Action:", action);
    // Navegar a la pantalla relevante
    const data = action.notification.data;
    if (data?.screen === "balance") {
      window.location.hash = "/";
    } else if (data?.screen === "viral") {
      window.location.hash = "/viral";
    }
  });
}
