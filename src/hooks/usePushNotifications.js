import { useEffect, useRef, useState } from "react";
import { ref, set, get } from "firebase/database";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { isNative } from "../utils/native";

/**
 * Hook para push notifications en iOS.
 *
 * Notificaciones que envía Luvio:
 * - Tu pareja ha añadido un gasto
 * - Lleváis X días sin equilibrar
 * - Resumen mensual disponible
 * - Tu pareja se ha unido
 *
 * Requiere:
 * 1. Apple Push Notification Service (APNs) key en Firebase Console
 * 2. Capability "Push Notifications" activada en Xcode
 * 3. Cloud Function que envíe FCM messages
 */
export function usePushNotifications() {
  const { user, coupleId } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState("unknown");
  const [token, setToken] = useState(null);
  const listenerRef = useRef(null);

  useEffect(() => {
    if (!isNative || !user) return;

    let cleanup = () => {};

    async function init() {
      try {
        const { PushNotifications } = await import(
          "@capacitor/push-notifications"
        );

        // Verificar estado actual de permisos
        const status = await PushNotifications.checkPermissions();
        setPermissionStatus(status.receive);

        if (status.receive === "granted") {
          await registerAndListen(PushNotifications);
        }
      } catch (err) {
        console.warn("Push notifications not available:", err);
      }
    }

    async function registerAndListen(PushNotifications) {
      // Registrar con APNs
      await PushNotifications.register();

      // Token recibido → guardar en Firebase para enviar desde Cloud Functions
      const tokenListener = await PushNotifications.addListener(
        "registration",
        async ({ value: fcmToken }) => {
          setToken(fcmToken);

          // Guardar token asociado a este usuario y pareja
          if (user?.uid) {
            await set(ref(db, `pushTokens/${user.uid}`), {
              token: fcmToken,
              platform: "ios",
              coupleId: coupleId || null,
              updatedAt: Date.now(),
            });
          }
        }
      );

      // Error de registro
      const errorListener = await PushNotifications.addListener(
        "registrationError",
        (error) => {
          console.error("Push registration error:", error);
        }
      );

      // Notificación recibida con app en foreground
      const foregroundListener = await PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          console.log("Push received in foreground:", notification);
          // Podemos mostrar un banner in-app o refrescar datos
          handleNotification(notification.data, false);
        }
      );

      // Usuario tocó la notificación (app en background/cerrada)
      const actionListener = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action) => {
          console.log("Push action:", action);
          handleNotification(action.notification.data, true);
        }
      );

      cleanup = () => {
        tokenListener.remove();
        errorListener.remove();
        foregroundListener.remove();
        actionListener.remove();
      };
    }

    init();
    return () => cleanup();
  }, [user, coupleId]);

  // Pedir permisos (llamar desde la UI, no automáticamente)
  async function requestPermission() {
    if (!isNative) return false;

    try {
      const { PushNotifications } = await import(
        "@capacitor/push-notifications"
      );

      const result = await PushNotifications.requestPermissions();
      setPermissionStatus(result.receive);

      if (result.receive === "granted") {
        await PushNotifications.register();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Manejar payload de la notificación
  function handleNotification(data, fromTap) {
    if (!data) return;

    switch (data.type) {
      case "new_expense":
        // Refrescar gastos — el hook useExpenses ya escucha en tiempo real
        // Si fue un tap, podemos navegar al dashboard
        break;

      case "monthly_summary":
        // Navegar a la viral card
        if (fromTap) {
          window.location.hash = "#/viral";
        }
        break;

      case "partner_joined":
        // Refrescar datos de pareja
        window.location.reload();
        break;

      case "balance_reminder":
        // Mostrar modal de equilibrar
        break;
    }
  }

  return {
    permissionStatus,
    token,
    requestPermission,
    isEnabled: permissionStatus === "granted",
  };
}
