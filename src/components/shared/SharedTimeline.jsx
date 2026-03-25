import { useState } from "react";
import { motion } from "framer-motion";

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

const CATEGORY_LABELS = {
  cena:     "Cena",
  casa:     "Casa",
  viaje:    "Viaje",
  capricho: "Capricho",
  super:    "Supermercado",
  otro:     "Otro",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

function groupByDate(expenses) {
  const groups = [];
  let currentDate = null;
  let currentGroup = null;

  for (const e of expenses) {
    const day = e.date?.slice(0, 10) || "";
    if (day !== currentDate) {
      currentDate = day;
      currentGroup = { date: day, items: [] };
      groups.push(currentGroup);
    }
    currentGroup.items.push(e);
  }
  return groups;
}

const PAGE_SIZE = 20;

const itemVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const listVariants = {
  visible: { transition: { staggerChildren: 0.05 } },
};

export default function SharedTimeline({ expenses, partner, userId }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  const sorted  = [...expenses].sort((a, b) => b.date?.localeCompare(a.date) || 0);
  const sliced  = sorted.slice(0, visible);
  const grouped = groupByDate(sliced);
  const hasMore = sorted.length > visible;

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
      <p className="text-luvio-warm500 text-[10px] tracking-widest uppercase mb-6 font-sans">
        Vuestro recorrido
      </p>

      {/* Vertical spine */}
      <div
        className="timeline-spine absolute top-8 bottom-0 pointer-events-none"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      />

      <motion.div variants={listVariants} initial="hidden" animate="visible">
        {grouped.map(({ date, items }) => (
          <div key={date}>
            {/* Date label — floats over spine */}
            <div className="relative flex justify-center mb-4 mt-2">
              <span className="bg-luvio-bg px-3 font-display italic text-luvio-warm500 text-sm relative z-10">
                {formatDate(date)}
              </span>
            </div>

            {items.map((expense, i) => {
              const isUser = expense.paidBy === userId;
              const label  = CATEGORY_LABELS[expense.category] || "Otro";
              const desc   = expense.description || label;

              return (
                <motion.div
                  key={expense.id}
                  variants={itemVariants}
                  className={`flex items-center mb-4 ${isUser ? "flex-row" : "flex-row-reverse"}`}
                >
                  {/* Expense card */}
                  <div className="w-[44%] bg-luvio-surface border border-luvio-warm100 rounded-2xl p-3.5 shadow-surface">
                    <p className="text-[10px] text-luvio-warm500 uppercase tracking-wider font-sans mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm font-medium text-luvio-text truncate font-sans leading-tight">
                      {desc}
                    </p>
                    <p className="font-display text-luvio-terra text-lg font-light mt-1">
                      {fmt(expense.amount)}
                    </p>
                    <p className="text-[10px] text-luvio-warm500 font-sans mt-0.5">
                      {isUser ? "Tú" : partnerName}
                    </p>
                  </div>

                  {/* Connector: thin line + center dot */}
                  <div className="w-[12%] flex items-center justify-center relative">
                    <div
                      className="absolute h-px bg-luvio-warm200"
                      style={{
                        width: "100%",
                        left: 0,
                      }}
                    />
                    {/* Node dot */}
                    <div className="w-2.5 h-2.5 rounded-full bg-luvio-terra border-2 border-luvio-bg relative z-10 shrink-0" />
                  </div>

                  {/* Opposite spacer */}
                  <div className="w-[44%]" />
                </motion.div>
              );
            })}
          </div>
        ))}
      </motion.div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center mt-4 mb-2">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="text-luvio-warm500 text-sm font-sans press-scale"
          >
            Ver más gastos
          </button>
        </div>
      )}
    </div>
  );
}
