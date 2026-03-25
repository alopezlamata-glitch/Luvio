import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useExpenses } from "../../hooks/useExpenses";
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning, hapticError } from "../../utils/native";

const CATEGORIES = [
  { id: "cena", label: "Cena", emoji: "🍽️", color: "#F97066" },
  { id: "casa", label: "Casa", emoji: "🏠", color: "#7C6EF6" },
  { id: "viaje", label: "Viaje", emoji: "✈️", color: "#36B5A0" },
  { id: "capricho", label: "Capricho", emoji: "🎁", color: "#F5A524" },
  { id: "super", label: "Super", emoji: "🛒", color: "#4AA8FF" },
  { id: "otro", label: "Otro", emoji: "📎", color: "#A0A0B0" },
];

/**
 * AddExpense — Flujo de 3 clicks:
 *   Click 1: ¿Quién pagó? (Yo / Pareja)
 *   Click 2: Categoría (preseleccionada si repite)
 *   Click 3: Importe + Confirmar
 *
 * Mobile-first, fullscreen overlay, haptic feedback ready.
 */
export default function AddExpense({ isOpen, onClose }) {
  const { user, partner } = useAuth();
  const { addExpense, monthlyCount, freeLimit, isPremium } = useExpenses();

  const [step, setStep] = useState(0); // 0: quién, 1: categoría+importe, 2: éxito
  const [paidBy, setPaidBy] = useState(null);
  const [category, setCategory] = useState(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const amountRef = useRef(null);

  // Auto-focus en el input de importe
  useEffect(() => {
    if (step === 1 && amountRef.current) {
      setTimeout(() => amountRef.current.focus(), 200);
    }
  }, [step]);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setPaidBy(null);
      setCategory(null);
      setAmount("");
      setDescription("");
      setError(null);
    }
  }, [isOpen]);

  async function handleSubmit() {
    if (!amount || parseFloat(amount) <= 0 || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await addExpense({
        amount: parseFloat(amount),
        category: category || "otro",
        paidBy: paidBy, // uid
        description: description || CATEGORIES.find((c) => c.id === category)?.label || "",
      });
      setStep(2); // Éxito
      await hapticSuccess();
      setTimeout(onClose, 1200);
    } catch (err) {
      if (err.message === "PAYWALL") {
        setError("paywall");
        await hapticWarning();
      } else {
        setError(err.message);
        await hapticError();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#0a0a12]/95 backdrop-blur-xl
                   flex flex-col items-center justify-center px-6"
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300
                     text-2xl transition-colors p-2"
        >
          ×
        </button>

        {/* Contador free */}
        {!isPremium && (
          <div className="absolute top-4 left-4 text-xs text-zinc-600">
            {monthlyCount}/{freeLimit} este mes
          </div>
        )}

        {/* ═══ STEP 0: ¿Quién pagó? ═══ */}
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-zinc-500 text-xs tracking-[0.2em] uppercase mb-8">
              ¿Quién pagó?
            </p>
            <div className="flex gap-4">
              {/* Yo */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setPaidBy(user.uid);
                  setStep(1);
                }}
                className="w-36 h-36 rounded-3xl border-2 border-white/5
                           bg-gradient-to-br from-white/[0.04] to-white/[0.01]
                           flex flex-col items-center justify-center gap-3
                           hover:border-coral-400 transition-all cursor-pointer"
              >
                <img
                  src={user?.photoURL}
                  alt=""
                  className="w-12 h-12 rounded-full"
                />
                <span className="text-white font-semibold text-sm">Yo</span>
              </motion.button>

              {/* Pareja */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setPaidBy(partner?.uid || "partner");
                  setStep(1);
                }}
                className="w-36 h-36 rounded-3xl border-2 border-white/5
                           bg-gradient-to-br from-white/[0.04] to-white/[0.01]
                           flex flex-col items-center justify-center gap-3
                           hover:border-violet-400 transition-all cursor-pointer"
              >
                <img
                  src={partner?.photo || "/default-avatar.png"}
                  alt=""
                  className="w-12 h-12 rounded-full"
                />
                <span className="text-white font-semibold text-sm">
                  {partner?.name?.split(" ")[0] || "Pareja"}
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ═══ STEP 1: Categoría + Importe ═══ */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            {/* Categorías */}
            <p className="text-zinc-500 text-xs tracking-[0.2em] uppercase mb-5 text-center">
              Categoría
            </p>
            <div className="flex flex-wrap gap-2.5 justify-center mb-8">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className="px-4 py-2 rounded-2xl border-2 text-sm transition-all"
                  style={{
                    borderColor: category === c.id ? c.color : "rgba(255,255,255,0.06)",
                    background: category === c.id ? `${c.color}18` : "rgba(255,255,255,0.02)",
                    color: category === c.id ? c.color : "#999",
                  }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            {/* Importe */}
            <div className="relative mb-5">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 text-2xl font-light">
                €
              </span>
              <input
                ref={amountRef}
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full py-4 pl-12 pr-5 rounded-2xl
                           border-2 border-white/5 bg-white/[0.03]
                           text-white text-2xl font-semibold
                           focus:border-[#F97066] focus:outline-none transition-colors"
              />
            </div>

            {/* Descripción opcional */}
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              className="w-full py-3.5 px-5 rounded-2xl
                         border border-white/5 bg-white/[0.02]
                         text-zinc-300 text-sm focus:outline-none
                         focus:border-white/10 transition-colors mb-7"
            />

            {/* Error */}
            {error === "paywall" && (
              <div className="mb-5 p-4 rounded-2xl bg-[#F97066]/10 border border-[#F97066]/20 text-center">
                <p className="text-[#F97066] text-sm font-medium mb-1">
                  Has llegado al límite de {freeLimit} gastos/mes
                </p>
                <p className="text-zinc-400 text-xs mb-3">
                  Pasa a Premium por 3,99€/mes para gastos ilimitados
                </p>
                <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F97066] to-[#F5A524] text-white text-sm font-semibold">
                  Desbloquear Premium ✨
                </button>
              </div>
            )}

            {error && error !== "paywall" && (
              <p className="text-red-400 text-sm text-center mb-4">{error}</p>
            )}

            {/* Confirmar */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0 || submitting}
              className="w-full py-4.5 rounded-2xl text-white text-base font-bold
                         tracking-wide transition-all disabled:opacity-30"
              style={{
                background:
                  amount && parseFloat(amount) > 0
                    ? "linear-gradient(135deg, #F97066, #F5A524)"
                    : "rgba(255,255,255,0.06)",
              }}
            >
              {submitting ? "Añadiendo..." : "Añadir gasto"}
            </motion.button>
          </motion.div>
        )}

        {/* ═══ STEP 2: Éxito ═══ */}
        {step === 2 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="text-6xl mb-4"
            >
              ✓
            </motion.div>
            <p className="text-white text-xl font-semibold">¡Añadido!</p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
