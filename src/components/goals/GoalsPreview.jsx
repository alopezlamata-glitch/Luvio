import { motion } from "framer-motion";

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

export default function GoalsPreview({ goals, onViewAll }) {
  if (!goals?.length) return null;

  return (
    <div className="mt-7">
      <div className="flex justify-between items-center mb-3.5">
        <p className="text-luvio-warm500 text-[10px] tracking-widest uppercase font-sans">
          Metas compartidas
        </p>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-luvio-terra text-xs font-sans font-medium press-scale"
          >
            Ver todas
          </button>
        )}
      </div>

      {goals.slice(0, 2).map((g) => {
        const pct = Math.min(((g.saved || 0) / (g.target || 1)) * 100, 100);
        return (
          <div
            key={g.id}
            className="p-3.5 rounded-2xl bg-luvio-surface border border-luvio-warm100 mb-2.5 shadow-surface"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-luvio-text font-sans font-medium">
                {g.emoji} {g.name}
              </span>
              <span className="text-luvio-warm500 text-xs font-sans">
                {fmt(g.saved)} / {fmt(g.target)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-luvio-warm100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                className="h-full rounded-full bg-luvio-terra"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
