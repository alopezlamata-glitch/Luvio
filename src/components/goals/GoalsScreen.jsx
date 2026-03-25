import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoals } from "../../hooks/useGoals";

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

const GOAL_EMOJIS = ["🎯", "✈️", "🏠", "🎓", "💍", "🎸", "🚗", "🏖️", "💻", "🎄"];

function sanitizeText(str) {
  return str.replace(/[<>"'&]/g, "").slice(0, 80);
}

export default function GoalsScreen({ onBack }) {
  const { goals, loading, addGoal, updateSaved, deleteGoal } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", target: "", emoji: "🎯" });
  const [addingAmount, setAddingAmount] = useState({});

  async function handleCreate() {
    const name = sanitizeText(formData.name);
    const target = parseFloat(formData.target);
    if (!name || !target || target <= 0) return;
    await addGoal({ ...formData, name, target });
    setFormData({ name: "", target: "", emoji: "🎯" });
    setShowForm(false);
  }

  async function handleAddSavings(goalId, currentSaved) {
    const amount = parseFloat(addingAmount[goalId]);
    if (!amount || amount <= 0 || amount > 1000000) return;
    await updateSaved(goalId, currentSaved + amount);
    setAddingAmount((prev) => ({ ...prev, [goalId]: "" }));
  }

  return (
    <div className="min-h-screen pb-24 bg-luvio-bg safe-top">
      {/* Header */}
      <div className="px-6 pt-5 flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="w-9 h-9 rounded-xl bg-luvio-warm100 text-luvio-warm500
                     flex items-center justify-center press-scale"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="font-display text-luvio-text text-xl font-light">
          Metas compartidas
        </h2>
      </div>

      <div className="px-6">
        {loading && (
          <div className="text-center py-12">
            <p className="text-luvio-warm500 text-sm font-sans">Cargando metas...</p>
          </div>
        )}

        {/* Goal cards */}
        <AnimatePresence>
          {goals.map((g, i) => {
            const pct = Math.min(((g.saved || 0) / (g.target || 1)) * 100, 100);
            const remaining = (g.target || 0) - (g.saved || 0);
            const isComplete = remaining <= 0;
            const monthsLeft = remaining > 0 ? Math.ceil(remaining / 200) : 0;

            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-3xl mb-3.5 border border-luvio-warm100 bg-luvio-surface shadow-surface"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" aria-hidden="true">{g.emoji}</span>
                    <div>
                      <p className="text-luvio-text font-sans font-medium text-base">{g.name}</p>
                      <p className="text-luvio-warm500 text-xs mt-0.5 font-sans">
                        {fmt(g.saved)} ahorrados de {fmt(g.target)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium font-sans ${isComplete ? "text-luvio-success" : "text-luvio-terra"}`}>
                    {Math.round(pct)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full bg-luvio-warm100 overflow-hidden mt-3.5 mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                    className={`h-full rounded-full ${isComplete ? "bg-luvio-success" : "bg-luvio-terra"}`}
                  />
                </div>

                {isComplete ? (
                  <p className="text-luvio-success text-sm font-sans font-medium text-center py-1">
                    Meta conseguida
                  </p>
                ) : (
                  <>
                    <p className="text-luvio-warm500 text-xs mb-3 font-sans">
                      Faltan {fmt(remaining)} · ~{monthsLeft} {monthsLeft === 1 ? "mes" : "meses"}
                    </p>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-luvio-warm500 text-xs font-sans">
                          €
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0.01"
                          max="100000"
                          value={addingAmount[g.id] || ""}
                          onChange={(e) =>
                            setAddingAmount((prev) => ({ ...prev, [g.id]: e.target.value }))
                          }
                          placeholder="0"
                          className="w-full py-2.5 pl-7 pr-3 rounded-xl text-sm font-sans
                                     border border-luvio-warm200 bg-luvio-bg text-luvio-text
                                     focus:outline-none focus:border-luvio-terra transition-colors"
                        />
                      </div>
                      <button
                        onClick={() => handleAddSavings(g.id, g.saved)}
                        disabled={!addingAmount[g.id] || parseFloat(addingAmount[g.id]) <= 0}
                        className="px-5 py-2.5 rounded-xl bg-luvio-blush text-luvio-terra
                                   text-sm font-sans font-medium border border-luvio-terra/30
                                   disabled:opacity-30 transition-opacity press-scale"
                      >
                        Añadir
                      </button>
                    </div>
                  </>
                )}

                <button
                  onClick={() => {
                    if (window.confirm(`¿Eliminar "${g.name}"?`)) deleteGoal(g.id);
                  }}
                  className="mt-3 text-luvio-warm500 text-xs font-sans hover:text-red-500 transition-colors"
                >
                  Eliminar meta
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && goals.length === 0 && (
          <div className="text-center py-16">
            <p className="font-display italic text-luvio-warm500 text-xl font-light mb-2">
              Sin metas aún
            </p>
            <p className="text-luvio-warm500 text-sm font-sans font-light">
              Cread una y ahorrad juntos hacia algo especial
            </p>
          </div>
        )}

        {/* New goal form trigger */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-luvio-warm200
                       text-luvio-warm500 text-sm font-sans mt-2 hover:border-luvio-terra
                       hover:text-luvio-terra transition-colors press-scale"
          >
            Nueva meta
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl border border-luvio-terra/30 bg-luvio-blush/10 mt-2"
          >
            {/* Emoji picker */}
            <div className="flex gap-2 flex-wrap mb-4">
              {GOAL_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setFormData((d) => ({ ...d, emoji: e }))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    formData.emoji === e
                      ? "bg-luvio-blush border border-luvio-terra"
                      : "bg-luvio-warm100 border border-transparent"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            <input
              value={formData.name}
              onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
              placeholder="Nombre de la meta"
              maxLength={80}
              className="w-full py-3 px-4 rounded-xl border border-luvio-warm200 font-sans
                         bg-luvio-surface text-luvio-text text-sm
                         focus:outline-none focus:border-luvio-terra transition-colors mb-3"
            />

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-luvio-warm500 text-sm font-sans">
                €
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="1"
                max="1000000"
                value={formData.target}
                onChange={(e) => setFormData((d) => ({ ...d, target: e.target.value }))}
                placeholder="Objetivo"
                className="w-full py-3 pl-8 pr-4 rounded-xl border border-luvio-warm200 font-sans
                           bg-luvio-surface text-luvio-text text-sm
                           focus:outline-none focus:border-luvio-terra transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowForm(false); setFormData({ name: "", target: "", emoji: "🎯" }); }}
                className="flex-1 py-3 rounded-xl border border-luvio-warm200
                           text-luvio-warm500 text-sm font-sans font-medium press-scale"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.name || !formData.target}
                className="flex-1 py-3 rounded-xl bg-luvio-terra text-white
                           text-sm font-sans font-medium disabled:opacity-30 transition-opacity press-scale"
              >
                Crear meta
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
