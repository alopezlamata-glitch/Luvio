import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import "./styles/index.css";
import { configureStatusBar, hideSplash, setupAppListeners } from "./utils/native";

// ─── iOS Native Init ───
async function initNative() {
  if (Capacitor.isNativePlatform()) {
    document.body.classList.add("capacitor");

    // Status bar: texto claro, transparente
    await configureStatusBar();

    // Ocultar splash screen cuando React monta
    setTimeout(() => hideSplash(), 300);

    // Lifecycle listeners
    setupAppListeners(() => {
      // onResume: refrescar datos cuando vuelve del background
      console.log("[Luvio] App resumed");
    });
  }
}

initNative();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

