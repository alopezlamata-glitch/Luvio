import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoals } from "../../hooks/useGoals";

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const GOAL_EMOJIS = ["🎯", "✈️", "🏠", "🎓", "💍", "🎸", "🚗", "🏖️", "💻", "🎄"];

export default function GoalsScreen({ onBack }) {
  const { goals, loading, addGoal, updateSaved, deleteGoal } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", target: "", emoji: "🎯" });
  const [addingAmount, setAddingAmount] = useState({}); // { goalId: amount }

  async function handleCreate() {
    if (!formData.name || !formData.target) return;
    await addGoal(formData);
    setFormData({ name: "", target: "", emoji: "🎯" });
    setShowForm(false);
  }

  async function handleAddSavings(goalId, currentSaved) {
    const amount = parseFloat(addingAmount[goalId]);
    if (!amount || amount <= 0) return;
    await updateSaved(goalId, currentSaved + amount);
    setAddingAmount((prev) => ({ ...prev, [goalId]: "" }));
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-5 flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white/[0.04] text-zinc-500
                     flex items-center justify-center text-lg"
        >
          ←
        </button>
        <h2 className="text-xl font-bold text-white">Metas compartidas</h2>
      </div>

      <div className="px-6">
        {loading && (
          <div className="text-center py-12">
            <div className="text-zinc-600 text-sm">Cargando metas...</div>
          </div>
        )}

        {/* Goal cards */}
        <AnimatePresence>
          {goals.map((g, i) => {
            const pct = Math.min((g.saved / g.target) * 100, 100);
            const remaining = g.target - g.saved;
            const isComplete = remaining <= 0;
            const monthsLeft = remaining > 0 ? Math.ceil(remaining / 200) : 0;

            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-[22px] mb-3.5 border border-white/[0.04]
                           bg-gradient-to-br from-white/[0.03] to-white/[0.01]"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{g.emoji}</span>
                    <div>
                      <p className="text-white font-semibold text-base">{g.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {fmt(g.saved)} ahorrados de {fmt(g.target)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      isComplete ? "text-teal-400" : "text-violet-400"
                    }`}
                  >
                    {Math.round(pct)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden mt-3.5 mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isComplete
                        ? "bg-gradient-to-r from-teal-400 to-emerald-400"
                        : "bg-gradient-to-r from-teal-400 to-violet-400"
                    }`}
                  />
                </div>

                {isComplete ? (
                  <p className="text-teal-400 text-sm font-medium text-center py-1">
                    🎉 ¡Meta conseguida!
                  </p>
                ) : (
                  <>
                    <p className="text-zinc-600 text-xs mb-3">
                      Faltan {fmt(remaining)} · a este ritmo ~{monthsLeft}{" "}
                      {monthsLeft === 1 ? "mes" : "meses"}
                    </p>

                    {/* Quick add savings */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">
                          €
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={addingAmount[g.id] || ""}
                          onChange={(e) =>
                            setAddingAmount((prev) => ({
                              ...prev,
                              [g.id]: e.target.value,
                            }))
                          }
                          placeholder="0"
                          className="w-full py-2.5 pl-7 pr-3 rounded-xl text-sm
                                     border border-white/[0.06] bg-white/[0.02]
                                     text-white focus:outline-none focus:border-teal-400/40
                                     transition-colors"
                        />
                      </div>
                      <button
                        onClick={() => handleAddSavings(g.id, g.saved)}
                        disabled={!addingAmount[g.id] || parseFloat(addingAmount[g.id]) <= 0}
                        className="px-5 py-2.5 rounded-xl bg-teal-400/10 text-teal-400
                                   text-sm font-semibold border border-teal-400/20
                                   disabled:opacity-30 transition-opacity"
                      >
                        + Añadir
                      </button>
                    </div>
                  </>
                )}

                {/* Delete button */}
                <button
                  onClick={() => {
                    if (window.confirm(`¿Eliminar "${g.name}"?`)) deleteGoal(g.id);
                  }}
                  className="mt-3 text-zinc-700 text-xs hover:text-red-400 transition-colors"
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
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-zinc-400 text-sm">Aún no tenéis metas</p>
            <p className="text-zinc-600 text-xs mt-1">
              Cread una y ahorrad juntos hacia algo especial
            </p>
          </div>
        )}

        {/* New goal form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-white/[0.06]
                       text-zinc-500 text-sm mt-2 hover:border-white/[0.12] transition-colors"
          >
            + Nueva meta
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-[22px] border border-coral-400/20 bg-coral-400/[0.03] mt-2"
          >
            {/* Emoji picker */}
            <div className="flex gap-2 flex-wrap mb-4">
              {GOAL_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setFormData((d) => ({ ...d, emoji: e }))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                    ${
                      formData.emoji === e
                        ? "bg-coral-400/20 border border-coral-400/40"
                        : "bg-white/[0.03] border border-transparent"
                    } transition-all`}
                >
                  {e}
                </button>
              ))}
            </div>

            <input
              value={formData.name}
              onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
              placeholder="Nombre de la meta"
              className="w-full py-3 px-4 rounded-xl border border-white/[0.06]
                         bg-white/[0.03] text-white text-sm
                         focus:outline-none focus:border-coral-400/40
                         transition-colors mb-3"
            />

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">
                €
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={formData.target}
                onChange={(e) => setFormData((d) => ({ ...d, target: e.target.value }))}
                placeholder="Objetivo"
                className="w-full py-3 pl-8 pr-4 rounded-xl border border-white/[0.06]
                           bg-white/[0.03] text-white text-sm
                           focus:outline-none focus:border-coral-400/40
                           transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: "", target: "", emoji: "🎯" });
                }}
                className="flex-1 py-3 rounded-xl border border-white/[0.06]
                           text-zinc-400 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.name || !formData.target}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold
                           bg-gradient-to-r from-coral-400 to-amber-400
                           disabled:opacity-30 transition-opacity"
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
