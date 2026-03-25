import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useExpenses } from "../../hooks/useExpenses";
import { useGoals } from "../../hooks/useGoals";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { hapticMedium, hapticLight } from "../../utils/native";
import AddExpense from "../expenses/AddExpense";
import BalanceBar from "../shared/BalanceBar";
import SharedTimeline from "../shared/SharedTimeline";
import GoalsPreview from "../goals/GoalsPreview";
import GoalsScreen from "../goals/GoalsScreen";
import ViralCard from "../viral/ViralCard";
import Settings from "../settings/Settings";
import NotificationPrompt from "../shared/NotificationPrompt";

export default function Dashboard() {
  const { partner, user, userPhoto, partnerViewPhoto, inviteCode } = useAuth();
  const { expenses, getBalance } = useExpenses();
  const { goals } = useGoals();
  const { isEnabled: pushEnabled, requestPermission } = usePushNotifications();
  const [screen, setScreen] = useState("dash");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  const balance = getBalance();

  useEffect(() => {
    if (!pushEnabled && expenses.length >= 3) {
      const dismissed = sessionStorage.getItem("luvio_notif_dismissed");
      if (!dismissed) setShowNotifPrompt(true);
    }
  }, [pushEnabled, expenses.length]);

  function nav(s) {
    hapticLight();
    setScreen(s);
  }

  return (
    <div className="min-h-screen scroll-container bg-luvio-bg">

      {/* Header */}
      <header className="safe-top px-6 pt-3 pb-3 flex justify-between items-center sticky top-0 z-30 glass">
        {screen === "goals" ? (
          <h2 className="font-display italic text-luvio-terra text-2xl font-light leading-none">Metas</h2>
        ) : screen === "settings" ? (
          <h2 className="font-sans font-medium text-luvio-text text-lg">Ajustes</h2>
        ) : (
          <img src="/logo.jpg" alt="luvio" className="h-8 w-auto mix-blend-multiply brightness-110" />
        )}
        <div className="flex items-center gap-3">
          {/* Couple avatars — solo en dash */}
          {screen === "dash" && <div className="flex items-center -space-x-2">
            {(userPhoto || user?.photoURL) ? (
              <img
                src={userPhoto || user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-xl border-2 border-luvio-bg object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-luvio-blush border-2 border-luvio-bg flex items-center justify-center text-xs text-luvio-terra font-medium">
                {user?.displayName?.[0] || "?"}
              </div>
            )}
            {(partnerViewPhoto || partner?.photo) ? (
              <img
                src={partnerViewPhoto || partner.photo}
                alt=""
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-xl border-2 border-luvio-bg object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-luvio-blush border-2 border-luvio-bg flex items-center justify-center text-xs text-luvio-terra font-medium">
                {partner?.name?.[0] || "?"}
              </div>
            )}
          </div>}

          {/* Settings icon — solo en dash */}
          {screen === "dash" && (
          <button
            onClick={() => nav("settings")}
            aria-label="Ajustes"
            className="w-8 h-8 rounded-xl bg-luvio-warm100 flex items-center justify-center text-luvio-warm500 press-scale"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="px-5 pb-32">
        {screen === "dash" && (
          <>
            {!partner && inviteCode && <InviteBanner code={inviteCode} />}
            <BalanceBar balance={balance} partner={partner} />
            <SharedTimeline expenses={expenses} partner={partner} userId={user?.uid} />
            <GoalsPreview goals={goals} onViewAll={() => nav("goals")} />
          </>
        )}
        {screen === "goals" && <GoalsScreen embedded />}
        {screen === "settings" && <Settings embedded />}
      </div>

      {/* FAB — solo en inicio */}
      {screen === "dash" && <button
        onClick={() => {
          hapticMedium();
          setShowAddExpense(true);
        }}
        aria-label="Añadir gasto"
        className="fixed left-1/2 -translate-x-1/2 w-14 h-14 rounded-[18px]
                   bg-luvio-terra text-white shadow-terra
                   flex items-center justify-center z-50 press-scale"
        style={{ bottom: "calc(max(env(safe-area-inset-bottom), 20px) + 60px)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto
                      flex justify-around pt-3 glass nav-bottom z-40
                      border-t border-luvio-warm100">
        {[
          { key: "dash",  label: "Inicio",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
          { key: "goals", label: "Metas",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
          { key: "viral", label: "Resumen",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => nav(t.key)}
            className={`flex flex-col items-center gap-1 text-[10px] press-scale font-sans
                       transition-colors ${screen === t.key ? "text-luvio-terra" : "text-luvio-warm500"}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      <AddExpense isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} />
      <ViralCard isOpen={screen === "viral"} onClose={() => setScreen("dash")} />

      {showNotifPrompt && (
        <NotificationPrompt
          onAllow={async () => {
            await requestPermission();
            setShowNotifPrompt(false);
          }}
          onDismiss={() => {
            sessionStorage.setItem("luvio_notif_dismissed", "1");
            setShowNotifPrompt(false);
          }}
        />
      )}
    </div>
  );
}

function InviteBanner({ code }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  }

  function shareLink() {
    const safeCode = code.replace(/[^A-Z0-9]/g, "");
    const url = `${window.location.origin}/join/${safeCode}`;
    if (navigator.share) {
      navigator.share({ title: "Únete a Luvio", text: "Lleva nuestros gastos juntos", url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="mt-4 mb-2 rounded-3xl bg-luvio-surface border border-luvio-warm100 p-5 text-center shadow-surface">
      <p className="text-luvio-warm500 text-xs tracking-widest uppercase mb-3 font-sans">
        Invita a tu pareja
      </p>
      <p className="font-display text-4xl text-luvio-terra tracking-[0.25em] font-light mb-3">
        {code}
      </p>
      <p className="text-luvio-warm500 text-xs mb-4 leading-relaxed font-sans">
        Comparte este código para conectaros
      </p>
      <div className="flex gap-2">
        <button
          onClick={copyCode}
          className="flex-1 py-2.5 rounded-xl bg-luvio-warm100 text-luvio-warm500
                     text-sm font-sans font-medium press-scale transition-colors"
        >
          {copied ? "Copiado" : "Copiar"}
        </button>
        <button
          onClick={shareLink}
          className="flex-1 py-2.5 rounded-xl bg-luvio-terra text-white
                     text-sm font-sans font-medium press-scale transition-opacity"
        >
          Compartir
        </button>
      </div>
    </div>
  );
}
