import { motion } from "framer-motion";

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

export default function BalanceCard({ balance, partner }) {
  const { totals, diff, balanced, owes, owed, amount } = balance;
  const uids = Object.keys(totals);
  const total = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const pct = uids[0] ? ((totals[uids[0]] || 0) / total) * 100 : 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-[28px] p-7 relative overflow-hidden
                 bg-gradient-to-br from-coral-400/[0.06] to-violet-400/[0.04]
                 border border-white/[0.04]"
    >
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-30 h-30 rounded-full bg-[radial-gradient(circle,rgba(249,112,102,0.1),transparent)]" />

      <p className="text-zinc-500 text-xs tracking-[0.2em] uppercase mb-4">
        Balance actual
      </p>

      {/* Bar */}
      <div className="flex justify-between mb-2 text-xs font-semibold">
        <span className="text-coral-400">Tú · {fmt(totals[uids[0]] || 0)}</span>
        <span className="text-violet-400">
          {partner?.name?.split(" ")[0] || "Pareja"} · {fmt(totals[uids[1]] || 0)}
        </span>
      </div>
      <div className="h-3 rounded-full bg-white/[0.04] relative overflow-hidden">
        <motion.div
          initial={{ width: "50%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-coral-400 to-amber-400"
        />
        <div className="absolute top-[-2px] left-1/2 -translate-x-1/2 w-0.5 h-[calc(100%+4px)] bg-white/20 rounded-full" />
      </div>

      {/* Summary */}
      <div className="mt-5 text-center">
        {balanced ? (
          <p className="text-teal-400 font-semibold">¡Estáis en paz! ✨</p>
        ) : (
          <p className="text-zinc-300 text-sm">
            {owes === "you" ? "Debes" : `${partner?.name?.split(" ")[0]} te debe`}{" "}
            <span className="text-teal-400 font-bold text-xl">{fmt(amount)}</span>
          </p>
        )}
      </div>

      <button className="mt-4 w-full py-3 rounded-2xl border border-teal-400/30 bg-teal-400/[0.08] text-teal-400 text-sm font-semibold">
        Equilibrar ahora ⚖️
      </button>
    </motion.div>
  );
}
