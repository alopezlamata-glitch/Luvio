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
    if (!isEnabled) await requestPermission();
  }

  async function handleLogout() {
    await hapticLight();
    await logout();
  }

  return (
    <div className="min-h-screen pb-24 safe-top bg-luvio-bg">
      {/* Header */}
      <div className="px-6 pt-5 flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="w-9 h-9 rounded-xl bg-luvio-warm100 text-luvio-warm500
                     flex items-center justify-center press-scale"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="font-sans font-medium text-luvio-text text-lg">Ajustes</h2>
      </div>

      <div className="px-6 space-y-5">
        {/* Tu cuenta */}
        <Section title="Tu cuenta">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-luvio-blush flex items-center justify-center text-xl text-luvio-terra font-medium">
                {user?.displayName?.[0] || "?"}
              </div>
            )}
            <div>
              <p className="text-luvio-text font-sans font-medium">
                {user?.displayName || "Usuario"}
              </p>
              <p className="text-luvio-warm500 text-sm font-sans">{user?.email}</p>
            </div>
          </div>
        </Section>

        {/* Pareja */}
        <Section title="Vuestra pareja">
          {partner ? (
            <div className="flex items-center gap-4">
              {partner?.photo ? (
                <img src={partner.photo} alt="" referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-luvio-blush flex items-center justify-center text-sm text-luvio-terra font-medium">
                  {partner?.name?.[0] || "?"}
                </div>
              )}
              <div className="flex-1">
                <p className="text-luvio-text text-sm font-sans font-medium">{partner.name}</p>
                <p className="text-luvio-warm500 text-xs font-sans">{partner.email}</p>
              </div>
              <span className="text-luvio-terra text-xs font-sans font-medium">Conectados</span>
            </div>
          ) : (
            <p className="text-luvio-warm500 text-sm font-sans">
              Tu pareja aún no se ha unido
            </p>
          )}
        </Section>

        {/* Plan */}
        <Section title="Tu plan">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-luvio-text font-sans font-medium text-sm">
                {isPremium ? "Premium" : "Gratuito"}
              </p>
              <p className="text-luvio-warm500 text-xs font-sans">
                {isPremium
                  ? "Gastos ilimitados"
                  : `${monthlyCount}/${freeLimit} gastos este mes`}
              </p>
            </div>
            {!isPremium && (
              <button className="px-4 py-2 rounded-xl bg-luvio-terra text-white text-xs font-sans font-medium press-scale">
                Upgrade
              </button>
            )}
          </div>
          {!isPremium && (
            <div className="h-1.5 rounded-full bg-luvio-warm100 overflow-hidden">
              <div
                className="h-full rounded-full bg-luvio-terra transition-all"
                style={{ width: `${Math.min((monthlyCount / freeLimit) * 100, 100)}%` }}
              />
            </div>
          )}
        </Section>

        {/* Notificaciones (solo nativo) */}
        {isNative && (
          <Section title="Notificaciones">
            <SettingRow
              label="Push notifications"
              description="Cuando tu pareja añade un gasto"
              action={<Toggle enabled={isEnabled} onToggle={handleNotificationToggle} />}
            />
            {permissionStatus === "denied" && (
              <p className="text-luvio-warm500 text-xs mt-2 font-sans">
                Actívalas en Ajustes → Luvio → Notificaciones.
              </p>
            )}
          </Section>
        )}

        {/* Legal */}
        <Section title="Legal">
          <SettingRow
            label="Política de Privacidad"
            action={<span className="text-luvio-warm500 text-sm">→</span>}
            onClick={() => window.open("/privacy", "_blank", "noopener,noreferrer")}
          />
          <SettingRow
            label="Términos de Uso"
            action={<span className="text-luvio-warm500 text-sm">→</span>}
            onClick={() => window.open("/terms", "_blank", "noopener,noreferrer")}
          />
        </Section>

        {/* Cuenta */}
        <Section title="Cuenta">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl border border-luvio-warm200
                       text-luvio-warm500 text-sm font-sans font-medium
                       press-scale mb-3 bg-luvio-surface"
          >
            Cerrar sesión
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 rounded-xl text-red-500/60 text-sm font-sans press-scale"
            >
              Eliminar cuenta
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-50 border border-red-200"
            >
              <p className="text-red-600 text-sm font-sans font-medium mb-1">
                ¿Estás seguro?
              </p>
              <p className="text-red-400 text-xs mb-3 font-sans">
                Se borrarán todos tus datos permanentemente.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 rounded-lg bg-luvio-warm100 text-luvio-warm500 text-sm font-sans"
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 py-2 rounded-lg bg-red-100 text-red-600 text-sm font-sans font-medium"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          )}
        </Section>

        <p className="text-luvio-warm200 text-[10px] text-center pt-4 pb-8 font-sans">
          Luvio v0.1.0 · Hecho con amor
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-luvio-warm500 text-[10px] tracking-widest uppercase mb-3 font-sans">
        {title}
      </p>
      <div className="rounded-2xl bg-luvio-surface border border-luvio-warm100 p-4">
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
        <p className="text-luvio-text text-sm font-sans">{label}</p>
        {description && (
          <p className="text-luvio-warm500 text-xs mt-0.5 font-sans">{description}</p>
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
      aria-pressed={enabled}
      className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
        enabled ? "bg-luvio-terra" : "bg-luvio-warm200"
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
