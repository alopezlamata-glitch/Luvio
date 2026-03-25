import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "../../hooks/useSubscription";
import { hapticMedium } from "../../utils/native";

const FEATURES = [
  { text: "Gastos ilimitados" },
  { text: "Metas ilimitadas" },
  { text: "Resumen mensual con IA" },
  { text: "Insights avanzados" },
  { text: "Apoyar a una startup indie" },
];

export default function Paywall({ isOpen, onClose, monthlyCount, limit }) {
  const { product, purchasing, purchase, restore } = useSubscription();

  async function handleUpgrade() {
    await hapticMedium();
    await purchase();
  }

  if (!isOpen) return null;

  const priceLabel = product?.price || "3,99€/mes";
  const usagePct   = Math.min(((monthlyCount || 0) / (limit || 20)) * 100, 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-luvio-bg/97 backdrop-blur-xl
                   flex flex-col items-center justify-center px-6 safe-top safe-bottom"
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-luvio-warm500 text-2xl p-2 press-scale"
        >
          ×
        </button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
          className="w-full max-w-sm text-center"
        >
          {/* Header */}
          <h2 className="font-display italic text-luvio-terra text-4xl font-light mb-2">
            luvio premium
          </h2>
          <p className="text-luvio-warm500 text-sm font-sans mb-1">
            {monthlyCount} de {limit} gastos usados este mes
          </p>
          <p className="text-luvio-warm500 text-xs font-sans mb-7">
            Desbloqueadlo todo por {priceLabel}
          </p>

          {/* Usage bar */}
          <div className="h-1.5 rounded-full bg-luvio-warm100 overflow-hidden mb-8 mx-4">
            <div
              className="h-full rounded-full bg-luvio-terra transition-all"
              style={{ width: `${usagePct}%` }}
            />
          </div>

          {/* Features */}
          <div className="space-y-2.5 mb-8">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-luvio-surface border border-luvio-warm100"
              >
                {/* Checkmark */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7FA87A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-luvio-text text-sm font-sans text-left">{f.text}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleUpgrade}
            disabled={purchasing}
            className="w-full py-4 rounded-2xl text-white text-base font-sans font-medium
                       bg-luvio-terra shadow-terra
                       active:opacity-80 transition-opacity disabled:opacity-60 press-scale"
          >
            {purchasing ? "Procesando..." : `Desbloquear por ${priceLabel}`}
          </motion.button>

          {/* Restore — Apple requirement */}
          <button
            onClick={restore}
            className="text-luvio-warm500 text-xs mt-4 underline font-sans press-scale"
          >
            Restaurar compras
          </button>

          <p className="text-luvio-warm200 text-[10px] mt-3 leading-relaxed px-4 font-sans">
            Suscripción auto-renovable. Cancela en cualquier momento en Ajustes de iPhone.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
