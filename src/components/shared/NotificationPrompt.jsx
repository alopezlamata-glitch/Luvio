import { motion } from "framer-motion";

/**
 * Pre-prompt para pedir permisos de notificaciones.
 *
 * Best practice iOS: mostrar un prompt custom ANTES del dialog de sistema.
 * Si el usuario dice "no" aquí, no gastamos el prompt de sistema (que solo sale 1 vez).
 * Si dice "sí", entonces lanzamos el requestPermission() real.
 */
export default function NotificationPrompt({ onAllow, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center px-4 pb-8"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden
                   bg-[#1c1c2e] border border-white/[0.06]"
      >
        <div className="p-6 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <h3 className="text-white text-lg font-bold mb-2">
            ¿Activar notificaciones?
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Te avisamos cuando tu pareja añade un gasto y cuando toca equilibrar.
            Sin spam, prometido.
          </p>
        </div>

        <div className="border-t border-white/[0.06]">
          <button
            onClick={onAllow}
            className="w-full py-4 text-coral-400 font-semibold text-base
                       border-b border-white/[0.06] press-scale"
          >
            Activar
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-4 text-zinc-500 text-base press-scale"
          >
            Ahora no
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
