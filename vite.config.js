import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Capacitor-only packages — stub on web so Vite doesn't fail to resolve them.
// All usage is gated behind isNative checks in native.js so stubs are never called.
const STUB = path.resolve("src/utils/capacitor-stub.js");

const CAPACITOR_PACKAGES = [
  "@capacitor/filesystem",
  "@capacitor/share",
  "@capacitor/status-bar",
  "@capacitor/keyboard",
  "@capacitor/splash-screen",
  "@capacitor/app",
  "@capacitor/push-notifications",
  "@capacitor/haptics",
  "@capacitor-firebase/authentication",
];

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  resolve: {
    alias: Object.fromEntries(CAPACITOR_PACKAGES.map((pkg) => [pkg, STUB])),
  },
  build: {
    target: "esnext",
    minify: "esbuild",
  },
});
