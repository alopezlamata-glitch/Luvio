import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useExpenses } from "../../hooks/useExpenses";
import { generateViralPhrase } from "../../utils/insights";
import { shareImage, hapticSuccess, hapticLight } from "../../utils/native";

const CATEGORIES = {
  cena: { emoji: "🍽️", label: "Cenas" },
  casa: { emoji: "🏠", label: "Casa" },
  viaje: { emoji: "✈️", label: "Viajes" },
  capricho: { emoji: "🎁", label: "Caprichos" },
  super: { emoji: "🛒", label: "Super" },
  otro: { emoji: "📎", label: "Otros" },
};

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function ViralCard({ isOpen, onClose }) {
  const { user, partner } = useAuth();
  const { getMonthlyExpenses, getByCategory } = useExpenses();
  const cardRef = useRef(null);

  if (!isOpen) return null;

  const monthly = getMonthlyExpenses();
  const byCategory = getByCategory();
  const topCat = byCategory[0];

  // Calcular quién pagó más
  const totals = { you: 0, partner: 0 };
  monthly.forEach((e) => {
    if (e.paidBy === user?.uid) totals.you += e.amount;
    else totals.partner += e.amount;
  });
  const total = totals.you + totals.partner || 1;
  const youPct = Math.round((totals.you / total) * 100);
  const partnerPct = 100 - youPct;

  const partnerName = partner?.name?.split(" ")[0] || "Pareja";
  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const viralPhrase = generateViralPhrase(
    monthly,
    [user?.displayName?.split(" ")[0] || "Tú", partnerName]
  );

  // Compartir via iOS share sheet nativo (canvas → image → share sheet)
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    await hapticLight();

    try {
      const canvas = await renderCardToCanvas();
      const shared = await shareImage(canvas, "luvio-resumen.png");
      if (shared) await hapticSuccess();
    } catch (err) {
      console.error("Error sharing:", err);
    } finally {
      setSharing(false);
    }
  }

  // Renderizar la tarjeta como canvas para exportar
  async function renderCardToCanvas() {
    // Usamos html2canvas si está disponible, sino fallback simple
    if (window.html2canvas && cardRef.current) {
      return window.html2canvas(cardRef.current, {
        backgroundColor: "#0a0a12",
        scale: 2,
      });
    }

    // Fallback: canvas manual
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 1136;
    const ctx = canvas.getContext("2d");

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 640, 1136);
    grad.addColorStop(0, "#1a1028");
    grad.addColorStop(0.5, "#0f1923");
    grad.addColorStop(1, "#121a12");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 1136);

    // Header
    ctx.fillStyle = "#666";
    ctx.font = "22px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`Luvio · ${monthLabel}`, 320, 200);

    ctx.fillStyle = "#f0f0f0";
    ctx.font = "bold 44px system-ui";
    ctx.fillText("Vuestro resumen", 320, 280);

    // Percentages
    ctx.fillStyle = "#F97066";
    ctx.font = "bold 64px system-ui";
    ctx.fillText(`${youPct}%`, 180, 440);

    ctx.fillStyle = "#7C6EF6";
    ctx.fillText(`${partnerPct}%`, 460, 440);

    ctx.fillStyle = "#aaa";
    ctx.font = "24px system-ui";
    ctx.fillText("Tú", 180, 480);
    ctx.fillText(partnerName, 460, 480);

    // Phrase
    ctx.fillStyle = "#ccc";
    ctx.font = "italic 28px system-ui";
    ctx.fillText(`"${viralPhrase}"`, 320, 700);

    // Watermark
    ctx.fillStyle = "#333";
    ctx.font = "20px system-ui";
    ctx.fillText("luvio.app", 320, 1050);

    return canvas;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0a12]/95 backdrop-blur-xl
                 flex flex-col items-center justify-center px-6"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 text-2xl p-2"
      >
        ×
      </button>

      {/* ── La tarjeta ── */}
      <div
        ref={cardRef}
        className="w-80 rounded-[28px] overflow-hidden p-7
                   bg-gradient-to-br from-[#1a1028] via-[#0f1923] to-[#121a12]
                   border border-white/[0.06]"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-zinc-600 text-[11px] tracking-[0.25em] uppercase">
            Luvio · {monthLabel}
          </p>
          <p className="text-white text-xl font-bold mt-2">Vuestro resumen</p>
        </div>

        {/* Who paid more */}
        <div className="flex justify-between mb-5">
          <div className="text-center">
            <p className="text-zinc-500 text-xs">Tú</p>
            <p className="text-coral-400 text-2xl font-bold">{youPct}%</p>
            <p className="text-zinc-600 text-[11px]">{fmt(totals.you)}</p>
          </div>
          <div className="text-center">
            <p className="text-zinc-500 text-xs">{partnerName}</p>
            <p className="text-violet-400 text-2xl font-bold">{partnerPct}%</p>
            <p className="text-zinc-600 text-[11px]">{fmt(totals.partner)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${youPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-coral-400 to-amber-400"
          />
        </div>

        {/* Top category */}
        {topCat && (
          <div className="bg-white/[0.03] rounded-2xl p-4 mb-5 text-center">
            <p className="text-zinc-500 text-xs mb-1">Más gastasteis en</p>
            <p className="text-2xl">
              {CATEGORIES[topCat.category]?.emoji || "📎"}
            </p>
            <p className="text-white text-base font-semibold mt-1">
              {CATEGORIES[topCat.category]?.label || topCat.category} ·{" "}
              {fmt(topCat.total)}
            </p>
          </div>
        )}

        {/* Category breakdown mini */}
        {byCategory.length > 1 && (
          <div className="flex gap-2 flex-wrap justify-center mb-5">
            {byCategory.slice(0, 4).map((c) => (
              <div
                key={c.category}
                className="px-3 py-1.5 rounded-xl bg-white/[0.03] text-xs text-zinc-400"
              >
                {CATEGORIES[c.category]?.emoji} {fmt(c.total)}
              </div>
            ))}
          </div>
        )}

        {/* AI Phrase */}
        <p className="text-zinc-300 text-sm text-center italic leading-relaxed px-2">
          "{viralPhrase}"
        </p>

        {/* Watermark */}
        <p className="text-zinc-700 text-[10px] text-center mt-5 tracking-widest">
          luvio.app
        </p>
      </div>

      {/* ── Single iOS Share Button (share sheet handles destination) ── */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="mt-6 w-80 py-4 rounded-2xl border-none text-white text-base font-semibold
                   bg-gradient-to-r from-coral-400 to-amber-400
                   shadow-[0_8px_24px_rgba(249,112,102,0.25)]
                   press-scale disabled:opacity-60"
      >
        {sharing ? "Preparando..." : "📤 Compartir resumen"}
      </button>

      <button
        onClick={handleShare}
        className="mt-3 w-80 py-3 rounded-2xl bg-white/[0.04] text-zinc-400 text-sm font-medium press-scale"
      >
        💾 Guardar imagen
      </button>
    </motion.div>
  );
}
