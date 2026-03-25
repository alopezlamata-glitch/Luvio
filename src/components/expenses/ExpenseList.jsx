const CATEGORIES = {
  cena: { emoji: "🍽️", color: "#F97066" },
  casa: { emoji: "🏠", color: "#7C6EF6" },
  viaje: { emoji: "✈️", color: "#36B5A0" },
  capricho: { emoji: "🎁", color: "#F5A524" },
  super: { emoji: "🛒", color: "#4AA8FF" },
  otro: { emoji: "📎", color: "#A0A0B0" },
};

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

export default function ExpenseList({ expenses, partner }) {
  return (
    <div className="mt-7">
      <p className="text-zinc-500 text-xs tracking-[0.2em] uppercase mb-4">
        Últimos gastos
      </p>
      {expenses.slice(0, 8).map((e) => {
        const cat = CATEGORIES[e.category] || CATEGORIES.otro;
        return (
          <div
            key={e.id}
            className="flex items-center gap-3.5 py-3.5 border-b border-white/[0.03]"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: `${cat.color}14` }}
            >
              {cat.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">
                {e.description || e.category}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">
                {e.paidBy === "you" ? "Tú" : partner?.name?.split(" ")[0] || "Pareja"} ·{" "}
                {e.date.slice(5).replace("-", "/")}
              </p>
            </div>
            <p
              className="text-base font-semibold shrink-0"
              style={{ color: cat.color }}
            >
              {fmt(e.amount)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
