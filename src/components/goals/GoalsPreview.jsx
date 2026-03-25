import { motion } from "framer-motion";

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

const GOAL_ICON_PATHS = {
  plane:  <><path d="M3 12l2-9 16 9-16 9-2-9zm0 0h10"/></>,
  home:   <><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z"/><polyline points="9 21 9 13 15 13 15 21"/></>,
  ring:   <><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 3.5L12 13l1.5 2.5L16 12M9 9h6"/></>,
  book:   <><path d="M4 4h7a1 1 0 011 1v14a1 1 0 00-1-1H4V4z"/><path d="M20 4h-7a1 1 0 00-1 1v14a1 1 0 001-1h7V4z"/></>,
  car:    <><rect x="2" y="10" width="20" height="9" rx="2"/><path d="M6 10l2.5-5h7L18 10"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></>,
  sun:    <><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></>,
  music:  <><path d="M9 17V6l10-2v11"/><circle cx="6" cy="17" r="3"/><circle cx="16" cy="15" r="3"/></>,
  laptop: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M1 21h22M9 21l1-4h4l1 4"/></>,
  gift:   <><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M12 9C12 7 10 5 8 6s-1 4 4 3M12 9c0-2 2-4 4-3s1 4-4 3"/></>,
  heart:  <path d="M12 21C12 21 3 15 3 9a5 5 0 0110 0 5 5 0 0110 0c0 6-9 12-9 12z"/>,
};

function GoalIcon({ id, size = 16, color = "#8A7060" }) {
  const paths = GOAL_ICON_PATHS[id] || GOAL_ICON_PATHS.heart;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths}
    </svg>
  );
}

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
              <span className="flex items-center gap-1.5 text-sm text-luvio-text font-sans font-medium">
                <GoalIcon id={g.icon || "star"} />
                {g.name}
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
