import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useExpenses } from "../../hooks/useExpenses";
import { useGoals } from "../../hooks/useGoals";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { generateInsights } from "../../utils/insights";
import { hapticMedium, hapticLight, onDeepLink } from "../../utils/native";
import AddExpense from "../expenses/AddExpense";
import ExpenseList from "../expenses/ExpenseList";
import BalanceCard from "./BalanceCard";
import GoalsPreview from "../goals/GoalsPreview";
import GoalsScreen from "../goals/GoalsScreen";
import InsightTicker from "../shared/InsightTicker";
import ViralCard from "../viral/ViralCard";
import Settings from "../settings/Settings";
import NotificationPrompt from "../shared/NotificationPrompt";

export default function Dashboard() {
  const { partner, user } = useAuth();
  const { expenses, getBalance, getMonthlyExpenses, getByCategory } = useExpenses();
  const { goals } = useGoals();
  const { isEnabled: pushEnabled, requestPermission } = usePushNotifications();
  const [screen, setScreen] = useState("dash"); // dash, goals, viral, settings
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  const balance = getBalance();
  const monthlyExpenses = getMonthlyExpenses();
  const insights = generateInsights(monthlyExpenses, [], balance);

  // Mostrar prompt de notificaciones la primera vez (después de 3 gastos)
  useEffect(() => {
    if (!pushEnabled && expenses.length >= 3) {
      const dismissed = sessionStorage.getItem("luvio_notif_dismissed");
      if (!dismissed) setShowNotifPrompt(true);
    }
  }, [pushEnabled, expenses.length]);

  // Deep link handler: luvio://viral → abrir resumen
  useEffect(() => {
    const cleanup = onDeepLink((code) => {
      // Manejar deep links si es necesario
    });
    return cleanup;
  }, []);

  function nav(s) {
    hapticLight();
    setScreen(s);
  }

  // ─── Goals Screen ───
  if (screen === "goals") {
    return <GoalsScreen onBack={() => setScreen("dash")} />;
  }

  // ─── Settings Screen ───
  if (screen === "settings") {
    return <Settings onBack={() => setScreen("dash")} />;
  }

  return (
    <div className="min-h-screen scroll-container">
      {/* Header — respeta safe area top del notch */}
      <header className="safe-top px-6 pt-3 flex justify-between items-center sticky top-0 z-30 glass">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-coral-400 to-amber-400 bg-clip-text text-transparent">
          luvio
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-xl border-2 border-[#0a0a12]" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-coral-400 to-amber-400 flex items-center justify-center text-xs text-white font-bold">
                {user?.displayName?.[0] || "?"}
              </div>
            )}
            {partner?.photo ? (
              <img src={partner.photo} alt="" className="w-8 h-8 rounded-xl border-2 border-[#0a0a12]" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-teal-400 flex items-center justify-center text-xs text-white font-bold">
                {partner?.name?.[0] || "?"}
              </div>
            )}
          </div>
          <button
            onClick={() => nav("settings")}
            className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-zinc-500 text-sm press-scale"
          >
            ⚙
          </button>
        </div>
      </header>

      <div className="px-6 pb-28">
        <BalanceCard balance={balance} partner={partner} />
        <InsightTicker insights={insights} />
        <GoalsPreview goals={goals} onViewAll={() => nav("goals")} />
        <ExpenseList expenses={expenses} partner={partner} />
      </div>

      {/* FAB — posicionado sobre el safe area bottom */}
      <button
        onClick={() => {
          hapticMedium();
          setShowAddExpense(true);
        }}
        className="fixed left-1/2 -translate-x-1/2 w-16 h-16 rounded-[22px]
                   bg-gradient-to-br from-coral-400 to-amber-400 text-white text-3xl
                   font-light shadow-[0_8px_32px_rgba(249,112,102,0.35)]
                   flex items-center justify-center z-50
                   press-scale"
        style={{ bottom: "calc(max(env(safe-area-inset-bottom), 20px) + 56px)" }}
      >
        +
      </button>

      {/* Bottom Nav — respeta safe area bottom */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto
                      flex justify-around pt-3 glass nav-bottom z-40
                      border-t border-white/[0.04]">
        {[
          { key: "dash", label: "Inicio", icon: "◉" },
          { key: "goals", label: "Metas", icon: "◎" },
          { key: "viral", label: "Resumen", icon: "◈" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => nav(t.key)}
            className={`flex flex-col items-center gap-1 text-[10px] press-scale
                       transition-colors ${
                         screen === t.key ? "text-coral-400" : "text-zinc-500"
                       }`}
          >
            <span className="text-xl">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Add Expense — iOS sheet-style overlay */}
      <AddExpense isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} />

      {/* Viral Card overlay */}
      <ViralCard isOpen={screen === "viral"} onClose={() => setScreen("dash")} />

      {/* Notification permission prompt (iOS style) */}
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
