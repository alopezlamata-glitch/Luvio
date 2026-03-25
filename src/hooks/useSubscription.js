import { useState, useEffect, useCallback } from "react";
import { ref, update } from "firebase/database";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { isNative, hapticSuccess } from "../utils/native";

/**
 * Hook para In-App Purchases con StoreKit 2 vía Capacitor.
 *
 * Apple exige usar StoreKit para suscripciones dentro de la app.
 * Este hook gestiona:
 * - Cargar productos disponibles
 * - Comprar suscripción Premium
 * - Restaurar compras
 * - Verificar estado de suscripción
 *
 * Setup previo en App Store Connect:
 * 1. Crear grupo de suscripciones: "Luvio Premium"
 * 2. Crear producto: com.luvio.app.premium.monthly (3,99€/mes)
 * 3. Crear sandbox tester en Users & Access
 */

const PRODUCT_ID = "com.luvio.app.premium.monthly";

export function useSubscription() {
  const { coupleId, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Cargar producto y estado de suscripción
  useEffect(() => {
    if (!isNative) {
      setLoading(false);
      return;
    }

    let cleanup = () => {};

    async function init() {
      try {
        const { InAppPurchase2 } = await import(
          "@capacitor-community/in-app-purchases"
        );
        const store = InAppPurchase2;

        // Registrar producto
        store.register({
          id: PRODUCT_ID,
          type: store.PAID_SUBSCRIPTION,
        });

        // Listener: producto cargado
        store.when(PRODUCT_ID).loaded((p) => {
          setProduct({
            id: p.id,
            title: p.title,
            description: p.description,
            price: p.price,
            priceMicros: p.priceMicros,
            currency: p.currency,
          });
        });

        // Listener: suscripción activa
        store.when(PRODUCT_ID).owned(() => {
          setIsPremium(true);
          if (coupleId) {
            syncPremiumToFirebase(true);
          }
        });

        // Listener: compra aprobada → verificar recibo
        store.when(PRODUCT_ID).approved(async (p) => {
          // En producción: verificar recibo server-side
          await p.finish();
          await hapticSuccess();
          setIsPremium(true);
          setPurchasing(false);
          if (coupleId) {
            syncPremiumToFirebase(true);
          }
        });

        // Listener: suscripción cancelada/expirada
        store.when(PRODUCT_ID).expired(() => {
          setIsPremium(false);
          if (coupleId) {
            syncPremiumToFirebase(false);
          }
        });

        // Error
        store.when(PRODUCT_ID).error((err) => {
          console.error("StoreKit error:", err);
          setPurchasing(false);
        });

        // Iniciar
        await store.refresh();
        setLoading(false);

        cleanup = () => {
          store.off(PRODUCT_ID);
        };
      } catch (err) {
        console.warn("In-app purchases not available:", err);
        setLoading(false);
      }
    }

    init();
    return () => cleanup();
  }, [coupleId]);

  // Sincronizar estado premium con Firebase
  async function syncPremiumToFirebase(premium) {
    if (!coupleId) return;
    try {
      await update(ref(db, `couples/${coupleId}/subscription`), {
        plan: premium ? "premium" : "free",
        limit: premium ? 999999 : 20,
        source: "storekit",
        updatedAt: Date.now(),
        updatedBy: user?.uid,
      });
    } catch (err) {
      console.error("Error syncing premium status:", err);
    }
  }

  // Iniciar compra
  const purchase = useCallback(async () => {
    if (!isNative || !product || purchasing) return;

    setPurchasing(true);
    try {
      const { InAppPurchase2 } = await import(
        "@capacitor-community/in-app-purchases"
      );
      InAppPurchase2.order(PRODUCT_ID);
    } catch (err) {
      console.error("Purchase error:", err);
      setPurchasing(false);
    }
  }, [product, purchasing]);

  // Restaurar compras (requerido por Apple)
  const restore = useCallback(async () => {
    if (!isNative) return;

    setLoading(true);
    try {
      const { InAppPurchase2 } = await import(
        "@capacitor-community/in-app-purchases"
      );
      await InAppPurchase2.refresh();
    } catch (err) {
      console.error("Restore error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    product,        // { id, title, price, currency }
    isPremium,      // boolean
    loading,        // cargando productos
    purchasing,     // compra en progreso
    purchase,       // () => iniciar compra
    restore,        // () => restaurar compras anteriores
  };
}
