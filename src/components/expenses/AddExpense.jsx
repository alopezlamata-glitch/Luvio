import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useExpenses } from "../../hooks/useExpenses";
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning, hapticError } from "../../utils/native";

const CATEGORIES = [
  { id: "cena",     label: "Cena" },
  { id: "casa",     label: "Casa" },
  { id: "viaje",    label: "Viaje" },
  { id: "capricho", label: "Capricho" },
  { id: "super",    label: "Super" },
  { id: "otro",     label: "Otro" },
];

// Sanitize text input: strip HTML-dangerous characters
function sanitizeText(str) {
  return str.replace(/[<>"'&]/g, "").slice(0, 100);
}

function validateAmount(val) {
  const n = parseFloat(val);
  return !isNaN(n) && n > 0 && n < 100000;
}

export default function AddExpense({ isOpen, onClose }) {
  const { user, partner } = useAuth();
  const { addExpense, monthlyCount, freeLimit, isPremium } = useExpenses();

  const [step, setStep] = useState(0);
  const [paidBy, setPaidBy] = useState(null);
  const [category, setCategory] = useState(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const amountRef = useRef(null);

  useEffect(() => {
    if (step === 1 && amountRef.current) {
      setTimeout(() => amountRef.current?.focus(), 200);
    }
  }, [step]);

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
    if (!validateAmount(amount) || submitting) return;

    const cleanDesc = sanitizeText(description);
    setSubmitting(true);
    setError(null);

    try {
      await addExpense({
        amount: parseFloat(amount),
        category: category || "otro",
        paidBy,
        description: cleanDesc || CATEGORIES.find((c) => c.id === category)?.label || "",
      });
      setStep(2);
      await hapticSuccess();
      setTimeout(onClose, 1400);
    } catch (err) {
      if (err.message === "PAYWALL") {
        setError("paywall");
        await hapticWarning();
      } else {
        setError("No se pudo añadir el gasto. Inténtalo de nuevo.");
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
        className="fixed inset-0 z-50 bg-luvio-bg/97 backdrop-blur-xl
                   flex flex-col items-center justify-center px-6"
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-luvio-warm500 text-2xl p-2 press-scale"
        >
          ×
        </button>

        {/* Free limit counter */}
        {!isPremium && (
          <div className="absolute top-4 left-4 text-xs text-luvio-warm500 font-sans">
            {monthlyCount}/{freeLimit} este mes
          </div>
        )}

        {/* Step dots */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {[0, 1].map((s) => (
            <div
              key={s}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                step >= s ? "bg-luvio-terra" : "bg-luvio-warm200"
              }`}
            />
          ))}
        </div>

        {/* ═══ STEP 0: ¿Quién pagó? ═══ */}
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="font-display italic text-luvio-terra text-2xl font-light mb-8">
              ¿Quién pagó?
            </p>
            <div className="flex gap-4">
              {/* Me */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { hapticLight(); setPaidBy(user.uid); setStep(1); }}
                className="w-36 h-36 rounded-3xl border-2 border-luvio-warm200 bg-luvio-surface
                           flex flex-col items-center justify-center gap-3
                           hover:border-luvio-terra active:border-luvio-terra transition-colors"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-luvio-blush flex items-center justify-center text-lg text-luvio-terra font-medium">
                    {user?.displayName?.[0] || "?"}
                  </div>
                )}
                <span className="text-luvio-text font-sans font-medium text-sm">Yo</span>
              </motion.button>

              {/* Partner */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { hapticLight(); setPaidBy(partner?.uid || "partner"); setStep(1); }}
                className="w-36 h-36 rounded-3xl border-2 border-luvio-warm200 bg-luvio-surface
                           flex flex-col items-center justify-center gap-3
                           hover:border-luvio-terra active:border-luvio-terra transition-colors"
              >
                {partner?.photo ? (
                  <img src={partner.photo} alt="" referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-luvio-blush flex items-center justify-center text-lg text-luvio-terra font-medium">
                    {partner?.name?.[0] || "?"}
                  </div>
                )}
                <span className="text-luvio-text font-sans font-medium text-sm">
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
            {/* Category chips */}
            <p className="font-display italic text-luvio-terra text-xl font-light mb-5 text-center">
              ¿Qué fue?
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-7">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-sans font-medium transition-all ${
                    category === c.id
                      ? "bg-luvio-blush border border-luvio-terra text-luvio-terra"
                      : "bg-luvio-warm100 border border-transparent text-luvio-warm500"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div className="relative mb-4">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-luvio-warm500 text-2xl font-light font-sans">
                €
              </span>
              <input
                ref={amountRef}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                max="99999"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full py-4 pl-12 pr-5 rounded-2xl
                           border-2 border-luvio-warm200 bg-luvio-surface
                           text-luvio-text text-2xl font-display font-light
                           focus:border-luvio-terra focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              maxLength={100}
              className="w-full py-3.5 px-5 rounded-2xl
                         border border-luvio-warm200 bg-luvio-surface
                         text-luvio-text text-sm font-sans
                         focus:outline-none focus:border-luvio-terra transition-colors mb-6"
            />

            {/* Paywall error */}
            {error === "paywall" && (
              <div className="mb-5 p-4 rounded-2xl bg-luvio-blush/40 border border-luvio-terra/30 text-center">
                <p className="text-luvio-terra text-sm font-medium mb-1 font-sans">
                  Has llegado al límite de {freeLimit} gastos/mes
                </p>
                <p className="text-luvio-warm500 text-xs mb-3 font-sans">
                  Pasa a Premium por 3,99€/mes para gastos ilimitados
                </p>
                <button className="px-6 py-2.5 rounded-xl bg-luvio-terra text-white text-sm font-medium font-sans">
                  Desbloquear Premium
                </button>
              </div>
            )}

            {error && error !== "paywall" && (
              <p className="text-red-500 text-sm text-center mb-4 font-sans">{error}</p>
            )}

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!validateAmount(amount) || submitting}
              className="w-full py-4 rounded-2xl text-white text-base font-sans font-medium
                         transition-all disabled:opacity-30
                         bg-luvio-terra active:opacity-80"
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
            {/* Animated SVG checkmark */}
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mx-auto mb-4" aria-hidden="true">
              <motion.circle
                cx="36" cy="36" r="32"
                stroke="#C4704F" strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              />
              <motion.path
                d="M22 36 L31 45 L50 27"
                stroke="#C4704F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.15, duration: 0.35 }}
              />
            </svg>
            <p className="font-display italic text-luvio-terra text-2xl font-light">
              Anotado
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
