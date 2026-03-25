import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "../../hooks/useSubscription";
import { hapticMedium } from "../../utils/native";

/**
 * Paywall — Aparece cuando el usuario free llega al límite de 20 gastos/mes.
 *
 * Usa StoreKit 2 (Apple) para suscripciones in-app.
 * Apple exige usar su sistema de pagos — Stripe NO está permitido
 * para suscripciones de contenido digital dentro de la app.
 */

const FEATURES = [
  { emoji: "♾️", text: "Gastos ilimitados" },
  { emoji: "🎯", text: "Metas ilimitadas" },
  { emoji: "📸", text: "Resumen mensual viral con IA" },
  { emoji: "📊", text: "Insights avanzados" },
  { emoji: "💕", text: "Apoyar a una startup indie" },
];

export default function Paywall({ isOpen, onClose, monthlyCount, limit }) {
  const { product, purchasing, purchase, restore } = useSubscription();

  async function handleUpgrade() {
    await hapticMedium();
    await purchase();
  }

  if (!isOpen) return null;

  // Precio real del producto StoreKit, o fallback
  const priceLabel = product?.price || "3,99€/mes";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-[#0a0a12]/95 backdrop-blur-xl
                   flex flex-col items-center justify-center px-6 safe-top safe-bottom"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 text-2xl p-2 safe-top press-scale"
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
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-white text-2xl font-bold mb-2">Luvio Premium</h2>
          <p className="text-zinc-400 text-sm mb-1">
            Habéis usado {monthlyCount} de {limit} gastos este mes
          </p>
          <p className="text-zinc-500 text-xs mb-8">
            Desbloqueadlo todo por solo {priceLabel}
          </p>

          {/* Progress to limit */}
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-8 mx-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-coral-400 to-red-500 transition-all"
              style={{ width: `${Math.min((monthlyCount / limit) * 100, 100)}%` }}
            />
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.02]"
              >
                <span className="text-lg">{f.emoji}</span>
                <span className="text-zinc-300 text-sm text-left">{f.text}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleUpgrade}
            disabled={purchasing}
            className="w-full py-4 rounded-2xl text-white text-base font-bold
                       bg-gradient-to-r from-coral-400 via-amber-400 to-coral-400
                       bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]
                       shadow-[0_8px_32px_rgba(249,112,102,0.3)]
                       disabled:opacity-60 press-scale"
          >
            {purchasing ? "Procesando..." : `Desbloquear por ${priceLabel}`}
          </motion.button>

          {/* Restaurar compras — requerido por Apple */}
          <button
            onClick={restore}
            className="text-zinc-600 text-xs mt-4 underline press-scale"
          >
            Restaurar compras
          </button>

          <p className="text-zinc-700 text-[10px] mt-3 leading-relaxed px-4">
            Suscripción auto-renovable. Cancela cuando quieras en Ajustes de tu iPhone.
            El pago se carga a tu cuenta de Apple ID.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
