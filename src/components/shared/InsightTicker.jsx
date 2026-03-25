import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function InsightTicker({ insights }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (insights.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % insights.length), 5000);
    return () => clearInterval(t);
  }, [insights.length]);

  if (!insights.length) return null;

  return (
    <div className="mt-4 px-4 py-3.5 rounded-2xl bg-coral-400/[0.04] border border-coral-400/[0.08] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="text-zinc-300 text-[13px] leading-relaxed"
        >
          💡 {insights[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
