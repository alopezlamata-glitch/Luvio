import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoals } from "../../hooks/useGoals";

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

// stroke-based icons: simples, geométricos, nítidos a cualquier tamaño
const GOAL_ICONS = [
  { id: "plane",  label: "Viaje",
    svg: <><path d="M3 12l2-9 16 9-16 9-2-9zm0 0h10"/></> },
  { id: "home",   label: "Casa",
    svg: <><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z"/><polyline points="9 21 9 13 15 13 15 21"/></> },
  { id: "ring",   label: "Boda",
    svg: <><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 3.5L12 13l1.5 2.5L16 12M9 9h6"/></> },
  { id: "book",   label: "Estudios",
    svg: <><path d="M4 4h7a1 1 0 011 1v14a1 1 0 00-1-1H4V4z"/><path d="M20 4h-7a1 1 0 00-1 1v14a1 1 0 001-1h7V4z"/></> },
  { id: "car",    label: "Coche",
    svg: <><rect x="2" y="10" width="20" height="9" rx="2"/><path d="M6 10l2.5-5h7L18 10"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></> },
  { id: "sun",    label: "Vacaciones",
    svg: <><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></> },
  { id: "music",  label: "Música",
    svg: <><path d="M9 17V6l10-2v11"/><circle cx="6" cy="17" r="3"/><circle cx="16" cy="15" r="3"/></> },
  { id: "laptop", label: "Tech",
    svg: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M1 21h22M9 21l1-4h4l1 4"/></> },
  { id: "gift",   label: "Regalo",
    svg: <><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M12 9C12 7 10 5 8 6s-1 4 4 3M12 9c0-2 2-4 4-3s1 4-4 3"/></> },
  { id: "heart",  label: "Otro",
    svg: <path d="M12 21C12 21 3 15 3 9a5 5 0 0110 0 5 5 0 0110 0c0 6-9 12-9 12z"/> },
];

function sanitizeText(str) {
  return str.replace(/[<>"'&]/g, "").slice(0, 80);
}

function GoalIcon({ id, size = 22, color = "#8A7060" }) {
  const icon = GOAL_ICONS.find((i) => i.id === id) || GOAL_ICONS[GOAL_ICONS.length - 1];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icon.svg}
    </svg>
  );
}

// v2
export default function GoalsScreen({ onBack, embedded = false }) {
  const { goals, loading, addGoal, updateSaved, deleteGoal } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", target: "", icon: "plane" });
  const [addingAmount, setAddingAmount] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function handleCreate() {
    const name = sanitizeText(formData.name);
    const target = parseFloat(formData.target);
    if (!name || !target || target <= 0) return;
    setSaving(true);
    setError(null);
    try {
      await addGoal({ name, target, icon: formData.icon });
      setFormData({ name: "", target: "", icon: "plane" });
      setShowForm(false);
    } catch (e) {
      console.error("addGoal error:", e);
      setError("No se pudo crear la meta. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSavings(goalId, currentSaved) {
    const amount = parseFloat(addingAmount[goalId]);
    if (!amount || amount <= 0 || amount > 1000000) return;
    try {
      await updateSaved(goalId, currentSaved + amount);
      setAddingAmount((prev) => ({ ...prev, [goalId]: "" }));
    } catch (e) {
      console.error("updateSaved error:", e);
    }
  }

  async function handleDelete(goalId) {
    try {
      await deleteGoal(goalId);
    } catch (e) {
      console.error("deleteGoal error:", e);
    } finally {
      setConfirmDelete(null);
    }
  }

  const standaloneHeader = !embedded ? (
    <header className="px-6 pt-5 pb-4 flex items-center gap-3 sticky top-0 z-10 glass border-b border-luvio-warm100">
      <button
        onClick={onBack}
        aria-label="Volver"
        className="w-9 h-9 rounded-xl bg-luvio-warm100 text-luvio-warm500
                   flex items-center justify-center press-scale shrink-0"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div>
        <h2 className="font-display italic text-luvio-terra text-2xl font-light leading-none">Metas</h2>
        <p className="text-luvio-warm500 text-[10px] tracking-widest uppercase font-sans mt-0.5">compartidas</p>
      </div>
    </header>
  ) : null;

  return (
    <div className={embedded ? "pb-4" : "min-h-screen pb-28 bg-luvio-bg safe-top"}>
      {standaloneHeader}

      <div className="px-5 pt-5">
        {loading && (
          <div className="text-center py-16">
            <p className="text-luvio-warm500 text-sm font-sans">Cargando...</p>
          </div>
        )}

        {/* Goal cards */}
        <AnimatePresence>
          {goals.map((g, i) => {
            const pct = Math.min(((g.saved || 0) / (g.target || 1)) * 100, 100);
            const remaining = Math.max((g.target || 0) - (g.saved || 0), 0);
            const isComplete = remaining <= 0;

            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="mb-4 rounded-3xl bg-luvio-surface border border-luvio-warm100 shadow-surface overflow-hidden"
              >
                {/* Top section */}
                <div className="p-5 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-luvio-warm100 flex items-center justify-center shrink-0">
                        <GoalIcon id={g.icon || g.emoji} />
                      </div>
                      <div>
                        <p className="text-luvio-text font-sans font-medium text-base leading-tight">{g.name}</p>
                        <p className="text-luvio-warm500 text-xs mt-0.5 font-sans">
                          objetivo {fmt(g.target)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className={`font-display text-2xl font-light leading-none ${isComplete ? "text-luvio-success" : "text-luvio-terra"}`}>
                        {Math.round(pct)}%
                      </p>
                      <p className="text-luvio-warm500 text-[10px] font-sans mt-0.5">{fmt(g.saved || 0)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-luvio-warm100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
                      className={`h-full rounded-full ${isComplete ? "bg-luvio-success" : "bg-luvio-terra"}`}
                    />
                  </div>

                  {!isComplete && (
                    <p className="text-luvio-warm500 text-xs mt-2 font-sans">
                      Faltan {fmt(remaining)}
                    </p>
                  )}

                  {isComplete && (
                    <p className="text-luvio-success text-xs mt-2 font-sans font-medium">
                      Meta alcanzada
                    </p>
                  )}
                </div>

                {/* Add savings row */}
                {!isComplete && (
                  <div className="px-5 pb-4">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-luvio-warm500 text-xs font-sans pointer-events-none">€</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        max="100000"
                        value={addingAmount[g.id] || ""}
                        onChange={(e) => setAddingAmount((prev) => ({ ...prev, [g.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleAddSavings(g.id, g.saved)}
                        onBlur={() => addingAmount[g.id] && handleAddSavings(g.id, g.saved)}
                        placeholder="Añadir ahorro · Enter para guardar"
                        className="w-full py-2.5 pl-7 pr-3 rounded-xl text-sm font-sans
                                   border border-luvio-warm200 bg-luvio-bg text-luvio-text
                                   focus:outline-none focus:border-luvio-terra transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Delete row */}
                <div className="border-t border-luvio-warm100 px-5 py-2.5">
                  {confirmDelete === g.id ? (
                    <div className="flex items-center justify-between">
                      <p className="text-luvio-warm500 text-xs font-sans">¿Eliminar esta meta?</p>
                      <div className="flex gap-3">
                        <button onClick={() => setConfirmDelete(null)} className="text-luvio-warm500 text-xs font-sans press-scale">Cancelar</button>
                        <button onClick={() => handleDelete(g.id)} className="text-red-500 text-xs font-sans font-medium press-scale">Eliminar</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(g.id)}
                      className="text-luvio-warm400 text-xs font-sans press-scale"
                    >
                      Eliminar meta
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && goals.length === 0 && !showForm && (
          <div className="text-center py-20">
            <p className="font-display italic text-luvio-warm400 text-2xl font-light mb-2">
              Sin metas aún
            </p>
            <p className="text-luvio-warm400 text-sm font-sans">
              Cread algo especial juntos
            </p>
          </div>
        )}

        {/* New goal form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 rounded-2xl border border-dashed border-luvio-warm200
                       text-luvio-warm500 text-sm font-sans mt-1 press-scale
                       hover:border-luvio-terra hover:text-luvio-terra transition-colors"
          >
            Nueva meta
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-luvio-surface border border-luvio-warm100 shadow-surface p-5 mt-1"
          >
            <p className="text-luvio-warm500 text-[10px] tracking-widest uppercase font-sans mb-4">
              Nueva meta
            </p>

            {/* Icon picker */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {GOAL_ICONS.map((ic) => {
                const active = formData.icon === ic.id;
                return (
                  <button
                    key={ic.id}
                    onClick={() => setFormData((d) => ({ ...d, icon: ic.id }))}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all press-scale
                      ${active
                        ? "bg-luvio-blush border border-luvio-terra"
                        : "bg-luvio-warm100 border border-transparent"
                      }`}
                  >
                    <GoalIcon id={ic.id} size={20} color={active ? "#C4704F" : "#8A7060"} />
                    <span className={`text-[9px] font-sans leading-none ${active ? "text-luvio-terra" : "text-luvio-warm500"}`}>
                      {ic.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <input
              value={formData.name}
              onChange={(e) => setFormData((d) => ({ ...d, name: sanitizeText(e.target.value) }))}
              onKeyDown={(e) => e.key === "Enter" && formData.name && formData.target && handleCreate()}
              placeholder="Nombre de la meta"
              maxLength={80}
              autoFocus
              className="w-full py-3 px-4 rounded-xl border border-luvio-warm200 font-sans
                         bg-luvio-bg text-luvio-text text-sm
                         focus:outline-none focus:border-luvio-terra transition-colors mb-3"
            />

            <div className="relative mb-5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-luvio-warm500 text-sm font-sans pointer-events-none">€</span>
              <input
                type="number"
                inputMode="decimal"
                min="1"
                max="1000000"
                value={formData.target}
                onChange={(e) => setFormData((d) => ({ ...d, target: e.target.value }))}
                placeholder="Objetivo"
                className="w-full py-3 pl-8 pr-4 rounded-xl border border-luvio-warm200 font-sans
                           bg-luvio-bg text-luvio-text text-sm
                           focus:outline-none focus:border-luvio-terra transition-colors"
              />
            </div>

            {error && <p className="text-red-500 text-xs text-center mb-3 font-sans">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowForm(false); setFormData({ name: "", target: "", icon: "plane" }); setError(null); }}
                className="flex-1 py-3 rounded-xl bg-luvio-warm100
                           text-luvio-warm500 text-sm font-sans font-medium press-scale"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.name.trim() || !formData.target || saving}
                className="flex-1 py-3 rounded-xl bg-luvio-terra text-white
                           text-sm font-sans font-medium disabled:opacity-30 transition-opacity press-scale"
              >
                {saving ? "Guardando…" : "Crear meta"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
