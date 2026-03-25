import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { hapticMedium } from "../../utils/native";

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

function getAmountClass(abs) {
  if (abs < 5)  return "font-display text-balance-sm text-luvio-success";
  if (abs < 30) return "font-display text-balance-md text-luvio-caution";
  if (abs < 80) return "font-display text-balance-lg text-luvio-terra";
  return "font-display text-balance-xl text-luvio-terra";
}

function getBarColor(abs) {
  if (abs < 5)  return "#7FA87A"; // success
  if (abs < 30) return "#D4A04A"; // caution
  return "#C4704F";               // terra
}

export default function BalanceBar({ balance, partner }) {
  const { user } = useAuth();
  const { totals = {}, balanced, owes, amount: rawAmount } = balance || {};

  const uids      = Object.keys(totals);
  const total     = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const absAmount = Math.abs(rawAmount || 0);

  // Determine what percentage the current user paid
  const userIsFirst = uids[0] === user?.uid;
  const userRawPct  = uids[0] ? ((totals[uids[0]] || 0) / total) * 100 : 50;
  const userPct     = userIsFirst ? userRawPct : 100 - userRawPct;

  // fillPct: how far from center (0–50, representing 0–50% of the bar width)
  const fillPct      = Math.min(Math.abs(userPct - 50), 50);
  // fillGoesRight: user spent more → partner owes user → fill right of center
  const fillGoesRight = userPct >= 50;

  // Animate fill with spring
  const fillMotion = useMotionValue(0);
  const springFill = useSpring(fillMotion, { stiffness: 80, damping: 20 });
  const fillWidth  = useTransform(springFill, (v) => `${v}%`);

  useEffect(() => {
    fillMotion.set(fillPct);
  }, [fillPct]);

  const barColor     = getBarColor(absAmount);
  const partnerName  = partner?.name?.split(" ")[0] || "Pareja";
  const amountClass  = getAmountClass(absAmount);

  function getLabel() {
    if (balanced || absAmount < 0.5) return "Estáis en paz";
    if (owes === "you") return `Debes a ${partnerName}`;
    return `${partnerName} te debe`;
  }

  async function handleSettle() {
    await hapticMedium();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mt-6 px-5 py-6 rounded-3xl bg-luvio-surface border border-luvio-warm100 shadow-surface"
    >
      {/* Section label */}
      <p className="text-luvio-warm500 text-[10px] tracking-widest uppercase mb-5 font-sans">
        Balance actual
      </p>

      {/* Avatars flanking */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-luvio-blush flex items-center justify-center text-xs text-luvio-terra font-medium">
              {user?.displayName?.[0] || "?"}
            </div>
          )}
          <span className="text-luvio-warm500 text-xs font-sans">Tú</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-luvio-warm500 text-xs font-sans">{partnerName}</span>
          {partner?.photo ? (
            <img src={partner.photo} alt="" className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-luvio-blush flex items-center justify-center text-xs text-luvio-terra font-medium">
              {partner?.name?.[0] || "?"}
            </div>
          )}
        </div>
      </div>

      {/* The visceral balance bar */}
      <div className="relative h-3 rounded-full bg-luvio-warm100 overflow-hidden mb-1">
        {/* Fill: grows from center left or right */}
        <motion.div
          style={{
            width: fillWidth,
            backgroundColor: barColor,
            position: "absolute",
            top: 0,
            bottom: 0,
            ...(fillGoesRight ? { left: "50%" } : { right: "50%" }),
            borderRadius: "999px",
          }}
        />
      </div>

      {/* Center tick — sits on top of bar, slightly taller */}
      <div className="relative h-0 overflow-visible">
        <div
          className="absolute top-[-14px] left-1/2 -translate-x-1/2 w-0.5 rounded-full"
          style={{ height: "14px", background: "rgba(44,24,16,0.2)" }}
        />
      </div>

      {/* Amount + label */}
      <div className="mt-5 text-center">
        <p className="text-luvio-warm500 text-xs font-sans mb-1">{getLabel()}</p>
        {(!balanced && absAmount >= 0.5) && (
          <p className={amountClass}>{fmt(absAmount)}</p>
        )}
      </div>

      {/* Settle action — text link, not button */}
      {!balanced && absAmount >= 0.5 && (
        <button
          onClick={handleSettle}
          className="mt-5 w-full text-sm text-luvio-terra font-sans font-medium
                     border-b border-luvio-terra/30 pb-0.5 mx-auto block text-center
                     press-scale"
        >
          Equilibrar ahora
        </button>
      )}
    </motion.div>
  );
}
