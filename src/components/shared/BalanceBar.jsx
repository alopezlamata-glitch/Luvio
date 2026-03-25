import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useExpenses } from "../../hooks/useExpenses";
import { hapticMedium, hapticSuccess } from "../../utils/native";

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

function getAmountClass(abs) {
  if (abs < 5)  return "font-display text-balance-sm text-luvio-success";
  if (abs < 30) return "font-display text-balance-md text-luvio-caution";
  if (abs < 80) return "font-display text-balance-lg text-luvio-terra";
  return "font-display text-balance-xl text-luvio-terra";
}

function getBarColor(abs) {
  if (abs < 5)  return "#7FA87A";
  if (abs < 30) return "#D4A04A";
  return "#C4704F";
}

const MONTH_ES = ["enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre"];

function getMonthlyPhrase(thisTotal, lastTotal, count) {
  const now = new Date();

  if (thisTotal === 0) {
    const empty = [
      "La cartera descansa. Vosotros, también.",
      "Cero euros. O muy frugales o muy enamorados.",
      "El mes acaba de empezar. O eso, o vivís del amor.",
    ];
    return empty[now.getDate() % empty.length];
  }

  if (lastTotal > 0) {
    const pct = Math.round(((thisTotal - lastTotal) / lastTotal) * 100);
    if (pct > 20)  return `Un ${pct}% más que el mes pasado. Vivís bien, eso está claro.`;
    if (pct < -20) return `Un ${Math.abs(pct)}% menos que el mes pasado. La moderación os sienta.`;
  }

  const phrases = [
    "El dinero va y viene. Vosotros os quedáis.",
    "Cada euro compartido, una historia que contar.",
    "Partís los gastos. Os quedáis lo mejor.",
    "En las cuentas, justos. En lo demás, generosos.",
    "Compartir es querer. Y también pagar a medias.",
    `${count} ${count === 1 ? "gasto" : "gastos"} este mes. Una sola cuenta que importa.`,
    "El mejor plan no tiene precio. Los demás, sí.",
    "Cada céntimo gastado juntos, bien gastado.",
  ];
  return phrases[(now.getDate() + count) % phrases.length];
}

export default function BalanceBar({ balance, partner }) {
  const { user } = useAuth();
  const { expenses } = useExpenses();
  const { balanced, owes, amount: rawAmount, myTotal = 0, partnerTotal = 0 } = balance || {};
  const [showSettle, setShowSettle] = useState(false);

  // Totales mensuales para la frase (excluye liquidaciones)
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const lastMonthKey  = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth()+1).padStart(2,"0")}`;

  const monthlyExpenses = expenses.filter(e => !e.settlement && e.date?.startsWith(thisMonthKey));
  const lastMonthExpenses = expenses.filter(e => !e.settlement && e.date?.startsWith(lastMonthKey));

  const thisTotal = monthlyExpenses.reduce((s,e) => s + (e.amountEUR ?? e.amount ?? 0), 0);
  const lastTotal = lastMonthExpenses.reduce((s,e) => s + (e.amountEUR ?? e.amount ?? 0), 0);
  const monthlyPhrase = getMonthlyPhrase(thisTotal, lastTotal, monthlyExpenses.length);

  const absAmount = Math.abs(rawAmount || 0);
  const grandTotal = myTotal + partnerTotal;

  // La barra refleja la DEUDA, no los totales brutos.
  // "invito yo" no genera deuda → barra centrada aunque yo haya pagado más.
  const fillPct = (balanced || absAmount < 0.5 || grandTotal === 0)
    ? 0
    : Math.min((absAmount / grandTotal) * 100, 50);
  // fill va a la derecha cuando la pareja me debe (yo pagué más neto)
  const fillGoesRight = owes === "partner";

  const fillMotion = useMotionValue(0);
  const springFill = useSpring(fillMotion, { stiffness: 80, damping: 20 });
  const fillWidth  = useTransform(springFill, (v) => `${v}%`);

  useEffect(() => { fillMotion.set(fillPct); }, [fillPct]);

  const barColor    = getBarColor(absAmount);
  const partnerName = partner?.name?.split(" ")[0] || "Pareja";
  const amountClass = getAmountClass(absAmount);

  function getLabel() {
    if (balanced || absAmount < 0.5) return "Estáis en paz";
    if (owes === "you") return `Le debes a ${partnerName}`;
    return `${partnerName} te debe`;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mt-6 px-5 py-6 rounded-3xl bg-luvio-surface border border-luvio-warm100 shadow-surface"
      >
        {/* Header: balance mensual total */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <p className="text-luvio-warm500 text-[10px] tracking-widest uppercase font-sans">
              Gasto mensual
            </p>
            {thisTotal > 0 && (
              <p className="font-display italic text-luvio-terra text-lg font-light leading-tight mt-0.5">
                {fmt(thisTotal)}
              </p>
            )}
          </div>
          {/* Avatares apilados */}
          <div className="flex items-center -space-x-2">
            {partner?.photo
              ? <img src={partner.photo} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-luvio-surface" referrerPolicy="no-referrer" />
              : <div className="w-7 h-7 rounded-full bg-luvio-blush ring-2 ring-luvio-surface flex items-center justify-center text-xs text-luvio-terra font-medium">{partner?.name?.[0] || "?"}</div>}
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-luvio-surface" referrerPolicy="no-referrer" />
              : <div className="w-7 h-7 rounded-full bg-luvio-terra/20 ring-2 ring-luvio-surface flex items-center justify-center text-xs text-luvio-terra font-medium">{user?.displayName?.[0] || "?"}</div>}
          </div>
        </div>

        {/* Barra */}
        <div className="relative h-3 rounded-full bg-luvio-warm100 overflow-hidden mb-1">
          <motion.div style={{ width: fillWidth, backgroundColor: barColor, position: "absolute", top: 0, bottom: 0, ...(fillGoesRight ? { left: "50%" } : { right: "50%" }), borderRadius: "999px" }} />
        </div>
        <div className="relative h-0 overflow-visible">
          <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 w-0.5 rounded-full" style={{ height: "14px", background: "rgba(44,24,16,0.2)" }} />
        </div>

        {/* Deuda */}
        <div className="mt-5 text-center">
          <p className="text-luvio-warm500 text-xs font-sans mb-1">{getLabel()}</p>
          {!balanced && absAmount >= 0.5 && <p className={amountClass}>{fmt(absAmount)}</p>}
        </div>

        {!balanced && absAmount >= 0.5 && (
          <button
            onClick={() => { hapticMedium(); setShowSettle(true); }}
            className="mt-5 w-full text-sm text-luvio-terra font-sans font-medium
                       border-b border-luvio-terra/30 pb-0.5 mx-auto block text-center press-scale"
          >
            Equilibrar ahora
          </button>
        )}
      </motion.div>

      {/* Frase del mes — fuera del card */}
      <p className="font-display italic text-luvio-warm500 text-base text-center mt-5 mb-1 leading-snug px-8">
        {monthlyPhrase}
      </p>

      {/* Modal de liquidación */}
      <AnimatePresence>
        {showSettle && (
          <SettleModal
            amount={absAmount}
            owes={owes}
            partnerName={partnerName}
            partner={partner}
            user={user}
            onClose={() => setShowSettle(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function SettleModal({ amount, owes, partnerName, partner, user, onClose }) {
  const { settleBalance } = useExpenses();
  const { user: authUser } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [settling, setSettling] = useState(false);
  const [settled, setSettled] = useState(false);
  const [error, setError] = useState(null);

  const debtorName   = owes === "you" ? "Tú" : partnerName;
  const creditorName = owes === "you" ? partnerName : "Tú";
  const amountFmt    = fmt(amount);
  const payerId = owes === "you" ? authUser?.uid : partner?.uid;

  function copyAmount() {
    navigator.clipboard?.writeText(amount.toFixed(2)).catch(() => {});
  }

  async function openBizum() {
    window.location.href = `bizum://send?amount=${amount.toFixed(2)}`;
  }

  async function handleSettle() {
    if (settling || !payerId) return;
    setSettling(true);
    setError(null);
    try {
      await settleBalance({ amount: amount * 2, paidBy: payerId });
      await hapticSuccess();
      setSettled(true);
      setTimeout(onClose, 2000);
    } catch (e) {
      console.error("settleBalance error:", e);
      setError("No se pudo registrar. Comprueba tu conexión.");
      setSettling(false);
      setConfirming(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end justify-center px-4 pb-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-[430px] bg-luvio-surface rounded-3xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-luvio-warm200 rounded-full mx-auto mb-5" />

        {settled ? (
          <div className="text-center py-4">
            <p className="font-display italic text-luvio-terra text-2xl font-light mb-1">Confirmado</p>
            <p className="text-luvio-warm500 text-sm font-sans">El balance está en paz</p>
          </div>
        ) : (
          <>
            <p className="text-luvio-warm500 text-[10px] tracking-widest uppercase mb-2 font-sans text-center">
              Cómo saldar
            </p>
            <p className="font-display italic text-luvio-terra text-xl font-light text-center mb-1">
              {debtorName} {owes === "you" ? "debes" : "debe"} {amountFmt}
            </p>
            <p className="text-luvio-warm500 text-xs font-sans text-center mb-6">a {creditorName}</p>

            <div className="flex flex-col gap-3 mb-5">
              <button onClick={openBizum}
                className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl bg-luvio-warm100 press-scale text-left">
                <div className="w-10 h-10 rounded-xl bg-[#00AEEF]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#00AEEF] font-bold text-sm font-sans">B</span>
                </div>
                <div>
                  <p className="text-luvio-text text-sm font-sans font-medium">Bizum</p>
                  <p className="text-luvio-warm500 text-xs font-sans">Abre la app de Bizum</p>
                </div>
              </button>

              <button onClick={copyAmount}
                className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl bg-luvio-warm100 press-scale text-left">
                <div className="w-10 h-10 rounded-xl bg-luvio-blush flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4704F" strokeWidth="1.8">
                    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                  </svg>
                </div>
                <div>
                  <p className="text-luvio-text text-sm font-sans font-medium">Transferencia</p>
                  <p className="text-luvio-warm500 text-xs font-sans">Copia el importe: {amountFmt}</p>
                </div>
              </button>

              {owes === "you" ? (
                <button
                  onClick={() => confirming ? handleSettle() : setConfirming(true)}
                  disabled={settling}
                  className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl press-scale text-left disabled:opacity-50 transition-colors
                    ${confirming
                      ? "bg-luvio-terra border border-luvio-terra"
                      : "bg-luvio-warm100 border border-luvio-warm200"
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${confirming ? "bg-white/20" : "bg-luvio-warm200"}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={confirming ? "white" : "#8A7060"} strokeWidth="1.8">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm font-sans font-medium ${confirming ? "text-white" : "text-luvio-warm500"}`}>
                      {settling ? "Registrando…" : confirming ? "Confirmar" : "Marcar como saldado"}
                    </p>
                    <p className={`text-xs font-sans ${confirming ? "text-white/70" : "text-luvio-warm400"}`}>
                      {confirming ? "Toca de nuevo para confirmar" : "Registra que ya pagaste"}
                    </p>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl bg-luvio-warm100 opacity-40">
                  <div className="w-10 h-10 rounded-xl bg-luvio-warm200 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A7060" strokeWidth="1.8">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-luvio-warm500 text-sm font-sans font-medium">Marcar como saldado</p>
                    <p className="text-luvio-warm400 text-xs font-sans">Solo {partnerName} puede confirmar el pago</p>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-xs text-center mb-3 font-sans">{error}</p>}

            <button onClick={onClose}
              className="w-full py-3.5 rounded-2xl text-luvio-warm500 text-sm font-sans font-medium bg-luvio-warm100 press-scale">
              Cerrar
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
