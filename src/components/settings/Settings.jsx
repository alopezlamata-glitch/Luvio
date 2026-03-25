import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useExpenses } from "../../hooks/useExpenses";
import { hapticLight, isNative } from "../../utils/native";

export default function Settings({ onBack }) {
  const { user, partner, coupleId, logout } = useAuth();
  const { permissionStatus, requestPermission, isEnabled } = usePushNotifications();
  const { monthlyCount, freeLimit, isPremium } = useExpenses();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleNotificationToggle() {
    await hapticLight();
    if (!isEnabled) {
      await requestPermission();
    }
  }

  async function handleLogout() {
    await hapticLight();
    await logout();
  }

  return (
    <div className="min-h-screen pb-24 safe-top">
      {/* Header */}
      <div className="px-6 pt-5 flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white/[0.04] text-zinc-500
                     flex items-center justify-center text-lg press-scale"
        >
          ←
        </button>
        <h2 className="text-xl font-bold text-white">Ajustes</h2>
      </div>

      <div className="px-6 space-y-6">
        {/* ─── Perfil ─── */}
        <Section title="Tu cuenta">
          <div className="flex items-center gap-4 mb-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-14 h-14 rounded-2xl"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-coral-400 to-amber-400 flex items-center justify-center text-xl text-white font-bold">
                {user?.displayName?.[0] || "?"}
              </div>
            )}
            <div>
              <p className="text-white font-semibold">
                {user?.displayName || "Usuario"}
              </p>
              <p className="text-zinc-500 text-sm">{user?.email}</p>
            </div>
          </div>
        </Section>

        {/* ─── Pareja ─── */}
        <Section title="Vuestra pareja">
          {partner ? (
            <div className="flex items-center gap-4">
              {partner?.photo ? (
                <img
                  src={partner.photo}
                  alt=""
                  className="w-10 h-10 rounded-xl"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-teal-400 flex items-center justify-center text-sm text-white font-bold">
                  {partner?.name?.[0] || "?"}
                </div>
              )}
              <div className="flex-1">
                <p className="text-zinc-200 text-sm font-medium">
                  {partner.name}
                </p>
                <p className="text-zinc-600 text-xs">{partner.email}</p>
              </div>
              <span className="text-teal-400 text-xs font-medium">
                Conectados 💕
              </span>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">
              Tu pareja aún no se ha unido
            </p>
          )}
        </Section>

        {/* ─── Plan ─── */}
        <Section title="Tu plan">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-medium text-sm">
                {isPremium ? "Premium ✨" : "Gratuito"}
              </p>
              <p className="text-zinc-500 text-xs">
                {isPremium
                  ? "Gastos ilimitados"
                  : `${monthlyCount}/${freeLimit} gastos este mes`}
              </p>
            </div>
            {!isPremium && (
              <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-coral-400 to-amber-400 text-white text-xs font-semibold press-scale">
                Upgrade
              </button>
            )}
          </div>
          {!isPremium && (
            <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-coral-400 to-amber-400 transition-all"
                style={{
                  width: `${Math.min((monthlyCount / freeLimit) * 100, 100)}%`,
                }}
              />
            </div>
          )}
        </Section>

        {/* ─── Notificaciones ─── */}
        {isNative && (
          <Section title="Notificaciones">
            <SettingRow
              label="Push notifications"
              description="Cuando tu pareja añade un gasto"
              action={
                <Toggle
                  enabled={isEnabled}
                  onToggle={handleNotificationToggle}
                />
              }
            />
            {permissionStatus === "denied" && (
              <p className="text-zinc-600 text-xs mt-2">
                Las notificaciones están desactivadas. Actívalas en Ajustes → Luvio → Notificaciones.
              </p>
            )}
          </Section>
        )}

        {/* ─── Privacidad ─── */}
        <Section title="Legal">
          <SettingRow
            label="Política de Privacidad"
            action={<span className="text-zinc-600">→</span>}
            onClick={() => window.open("/privacy", "_blank")}
          />
          <SettingRow
            label="Términos de Uso"
            action={<span className="text-zinc-600">→</span>}
            onClick={() => window.open("/terms", "_blank")}
          />
        </Section>

        {/* ─── Zona peligrosa ─── */}
        <Section title="Cuenta">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-white/[0.03] text-zinc-400 text-sm
                       font-medium press-scale mb-3"
          >
            Cerrar sesión
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 rounded-xl text-red-500/60 text-sm press-scale"
            >
              Eliminar cuenta
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <p className="text-red-400 text-sm font-medium mb-1">
                ¿Estás seguro?
              </p>
              <p className="text-zinc-500 text-xs mb-3">
                Se borrarán todos tus datos permanentemente.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 rounded-lg bg-white/[0.05] text-zinc-400 text-sm"
                >
                  Cancelar
                </button>
                <button className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold">
                  Eliminar
                </button>
              </div>
            </motion.div>
          )}
        </Section>

        <p className="text-zinc-800 text-[10px] text-center pt-4 pb-8">
          Luvio v0.1.0 · Hecho con 💕
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function Section({ title, children }) {
  return (
    <div>
      <p className="text-zinc-500 text-xs tracking-[0.15em] uppercase mb-3">
        {title}
      </p>
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, action, onClick }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className="flex items-center justify-between py-2.5 w-full text-left"
    >
      <div>
        <p className="text-zinc-200 text-sm">{label}</p>
        {description && (
          <p className="text-zinc-600 text-xs mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </Wrapper>
  );
}

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
        enabled ? "bg-teal-400" : "bg-white/10"
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
