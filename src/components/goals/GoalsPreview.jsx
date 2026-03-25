const fmt = (n) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

export default function GoalsPreview({ goals, onViewAll }) {
  if (!goals.length) return null;

  return (
    <div className="mt-7">
      <div className="flex justify-between items-center mb-3.5">
        <p className="text-zinc-500 text-xs tracking-[0.2em] uppercase">
          Metas compartidas
        </p>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-coral-400 text-xs font-medium press-scale"
          >
            Ver todas →
          </button>
        )}
      </div>
      {goals.slice(0, 2).map((g) => {
        const pct = Math.min((g.saved / g.target) * 100, 100);
        return (
          <div key={g.id} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] mb-2.5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">{g.emoji} {g.name}</span>
              <span className="text-zinc-500 text-xs">{fmt(g.saved)} / {fmt(g.target)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-violet-400 transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
