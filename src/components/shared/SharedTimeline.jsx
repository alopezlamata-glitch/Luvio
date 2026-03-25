import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

const CATEGORY_META = {
  cena:     { label: "Cena",         color: "#C4704F", bg: "bg-[#C4704F]/10" },
  casa:     { label: "Casa",         color: "#8A7060", bg: "bg-[#8A7060]/10" },
  viaje:    { label: "Viaje",        color: "#5B8DB8", bg: "bg-[#5B8DB8]/10" },
  capricho: { label: "Capricho",     color: "#B87C8A", bg: "bg-[#B87C8A]/10" },
  super:    { label: "Supermercado", color: "#7A9B6A", bg: "bg-[#7A9B6A]/10" },
  otro:     { label: "Otro",         color: "#A09080", bg: "bg-[#A09080]/10" },
};

const CATEGORY_ICONS = {
  cena: (
    <>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/>
      <path d="M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </>
  ),
  casa: (
    <>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z"/>
      <polyline points="9 21 9 13 15 13 15 21"/>
    </>
  ),
  viaje: (
    <>
      <path d="M3 12l2-9 16 9-16 9-2-9zm0 0h10"/>
    </>
  ),
  capricho: (
    <>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </>
  ),
  super: (
    <>
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57L23 6H6"/>
    </>
  ),
  otro: (
    <>
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </>
  ),
};

function CategoryIcon({ category, size = 16, color = "#A09080" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {CATEGORY_ICONS[category] || CATEGORY_ICONS.otro}
    </svg>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

function groupByDate(expenses) {
  const map = new Map();
  for (const e of expenses) {
    const day = e.date?.slice(0, 10) || "";
    if (!map.has(day)) map.set(day, []);
    map.get(day).push(e);
  }
  return [...map.entries()].map(([date, items]) => ({ date, items }));
}

const PREVIEW_SIZE = 3;
const PAGE_SIZE = 20;

const rowVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export default function SharedTimeline({ expenses, partner, userId }) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible]   = useState(PAGE_SIZE);

  const sorted = [...expenses].sort((a, b) => {
    const dateCmp = (b.date || "").localeCompare(a.date || "");
    return dateCmp !== 0 ? dateCmp : (b.id || "").localeCompare(a.id || "");
  });

  const preview   = sorted.slice(0, PREVIEW_SIZE);
  const sliced    = expanded ? sorted.slice(0, visible) : preview;
  const grouped   = groupByDate(sliced);
  const hasMore   = expanded && sorted.length > visible;
  const canExpand = !expanded && sorted.length > PREVIEW_SIZE;

  const partnerName = partner?.name?.split(" ")[0] || "Pareja";

  if (expenses.length === 0) {
    return (
      <div className="mt-10 text-center px-8 py-12">
        <p className="font-display italic text-luvio-warm500 text-xl font-light leading-relaxed">
          Vuestro primer gasto juntos empieza aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 relative">
      <p className="text-luvio-warm500 text-[10px] tracking-widest uppercase mb-4 font-sans">
        Vuestro recorrido
      </p>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        className="bg-luvio-surface border border-luvio-warm100 rounded-3xl overflow-hidden shadow-surface"
      >
        {grouped.map(({ date, items }, gi) => (
          <div key={date}>
            {/* Date chip */}
            <div className={`px-4 py-2 flex items-center gap-3 ${gi > 0 ? "border-t border-luvio-warm100" : ""}`}>
              <span className="text-[10px] text-luvio-warm400 font-sans uppercase tracking-widest">
                {formatDate(date)}
              </span>
              <div className="flex-1 h-px bg-luvio-warm100" />
            </div>

            {/* Expense rows */}
            {items.map((expense, i) => {
              const isUser  = expense.paidBy === userId;
              const meta    = CATEGORY_META[expense.category] || CATEGORY_META.otro;
              const label   = meta.label;
              const desc    = expense.description || label;
              const isLast  = i === items.length - 1;

              /* ── Settlement card ── */
              if (expense.settlement) {
                return (
                  <motion.div key={expense.id} variants={rowVariants}
                    className={`flex items-center gap-3 px-4 py-3 ${!isLast ? "border-b border-luvio-warm100" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-luvio-success/10 flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="#7FA87A" strokeWidth="2" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-luvio-text text-sm font-sans font-medium leading-tight">
                        {isUser ? "Tú equilibrasteis" : `${partnerName} equilibró`}
                      </p>
                      <p className="text-[11px] text-luvio-success font-sans">Balance</p>
                    </div>
                    <p className="font-display italic text-luvio-success text-base font-light shrink-0">
                      {fmt(expense.amount / 2)}
                    </p>
                  </motion.div>
                );
              }

              /* ── Regular expense row ── */
              const splitLabel =
                expense.split?.type === "payer" ? "invitó" :
                expense.split?.type === "custom" ? "split" : null;

              return (
                <motion.div key={expense.id} variants={rowVariants}
                  className={`flex items-center gap-3 px-4 py-3 ${!isLast ? "border-b border-luvio-warm100/70" : ""}`}
                >
                  {/* Category icon */}
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${meta.bg}`}>
                    <CategoryIcon category={expense.category} size={15} color={meta.color} />
                  </div>

                  {/* Description + payer */}
                  <div className="flex-1 min-w-0">
                    <p className="text-luvio-text text-sm font-sans font-medium truncate leading-tight">
                      {desc}
                    </p>
                    <p className="text-[11px] text-luvio-warm500 font-sans">
                      {isUser ? "Tú" : partnerName}
                      {splitLabel && (
                        <span className="ml-1 text-luvio-warm400">· {splitLabel}</span>
                      )}
                    </p>
                  </div>

                  {/* Amount */}
                  <p className="font-display italic text-luvio-terra text-base font-light shrink-0">
                    {fmt(expense.amountEUR ?? expense.amount)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* Ver más — dentro del card */}
        {canExpand && (
          <div className="relative">
            <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none rounded-b-3xl"
              style={{ background: "linear-gradient(to bottom, transparent, #FAF5EE 80%)" }} />
            <button
              onClick={() => setExpanded(true)}
              className="w-full py-3.5 flex items-center justify-center gap-1.5
                         text-luvio-terra text-xs font-sans font-medium press-scale
                         border-t border-luvio-warm100 relative z-10 bg-luvio-surface rounded-b-3xl"
            >
              Ver recorrido completo
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        )}
      </motion.div>

      {/* Paginación + colapsar — fuera del card */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center mt-3"
          >
            {hasMore && (
              <button onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="text-luvio-warm500 text-sm font-sans press-scale block mx-auto mb-2">
                Ver más gastos
              </button>
            )}
            <button
              onClick={() => { setExpanded(false); setVisible(PAGE_SIZE); }}
              className="text-luvio-warm400 text-xs font-sans press-scale flex items-center gap-1 mx-auto"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
              Colapsar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
