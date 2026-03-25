import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useExpenses } from "../../hooks/useExpenses";
import { shareImage, hapticSuccess, hapticLight } from "../../utils/native";

const fmt = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const CATEGORY_META = {
  cena:     { label: "Cenas",        svg: <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/> },
  casa:     { label: "Casa",         svg: <><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z"/><polyline points="9 21 9 13 15 13 15 21"/></> },
  viaje:    { label: "Viajes",       svg: <path d="M3 12l2-9 16 9-16 9-2-9zm0 0h10"/> },
  capricho: { label: "Caprichos",    svg: <><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M12 9C12 7 10 5 8 6s-1 4 4 3M12 9c0-2 2-4 4-3s1 4-4 3"/></> },
  super:    { label: "Supermercado", svg: <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></> },
  otro:     { label: "Otros",        svg: <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></> },
};

const SEGMENT_COLORS = ["#C4704F","#D4956F","#E8C5B8","#D6C5B5","#B8A898"];

const PHRASES = {
  cena:     ["Este mes vuestra mesa fue el lugar más importante.",
             "Compartir una cena es compartir el día entero.",
             "El hambre une. El sabor lo celebra."],
  casa:     ["Construir un hogar tiene su precio — y vale cada euro.",
             "Lo que gastáis en casa es lo que invertís el uno en el otro.",
             "Casa no es un sitio. Es una decisión que renováis cada mes."],
  viaje:    ["Los kilómetros juntos no se olvidan.",
             "Este mes el mundo fue un poco más vuestro.",
             "Viajar juntos es la mejor forma de conocerse más."],
  capricho: ["Los pequeños lujos hacen grande la vida cotidiana.",
             "Un capricho compartido no es gasto — es recuerdo.",
             "Celebrar lo ordinario es un arte que practicáis bien."],
  super:    ["Llenar la nevera juntos es un acto de amor cotidiano.",
             "La rutina bien compartida es una forma de querer.",
             "El día a día también cuenta. Y vosotros lo sabéis."],
};
const DEFAULT_PHRASES = [
  "Cada gasto compartido es un pequeño compromiso.",
  "Este mes lo vivisteis juntos.",
  "Lo que se comparte, se multiplica.",
];

function getPhrase(expenses) {
  const counts = {};
  expenses.forEach((e) => { counts[e.category] = (counts[e.category] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const pool = PHRASES[top] || DEFAULT_PHRASES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function CategoryIcon({ id, size = 14, color = "#8A7060" }) {
  const meta = CATEGORY_META[id] || CATEGORY_META.otro;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {meta.svg}
    </svg>
  );
}

// Decorative ornament
function Ornament({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 justify-center ${className}`}>
      <div className="w-8 h-px bg-luvio-terra/25" />
      <div className="w-1 h-1 rounded-full bg-luvio-terra/30" />
      <div className="w-8 h-px bg-luvio-terra/25" />
    </div>
  );
}

export default function ViralCard({ isOpen, onClose }) {
  const { user, partner } = useAuth();
  const { getMonthlyExpenses, getByCategory } = useExpenses();
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  if (!isOpen) return null;

  const monthly    = getMonthlyExpenses().filter((e) => !e.settlement);
  const byCategory = getByCategory();
  const total      = monthly.reduce((s, e) => s + (e.amountEUR ?? e.amount ?? 0), 0);
  const avg        = total / (monthly.length || 1);
  const biggest    = [...monthly].sort(
    (a, b) => (b.amountEUR ?? b.amount ?? 0) - (a.amountEUR ?? a.amount ?? 0)
  )[0];

  const now         = new Date();
  const monthLabel  = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const monthName   = MONTH_NAMES[now.getMonth()];
  const phrase      = getPhrase(monthly);
  const userName    = user?.displayName?.split(" ")[0] || "Tú";
  const partnerName = partner?.name?.split(" ")[0] || "Pareja";
  const topCategory = byCategory[0]?.category;

  // Days without an expense this month
  const today = now.getDate();
  const daysWithExpense = new Set(
    monthly.map((e) => new Date((e.date || Date.now())).getDate())
  ).size;

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    hapticLight();
    try {
      const canvas = await renderCardToCanvas();
      const shared = await shareImage(canvas, "luvio-resumen.png");
      if (shared) hapticSuccess();
    } catch (err) {
      console.error("Error sharing:", err);
    } finally {
      setSharing(false);
    }
  }

  async function renderCardToCanvas() {
    if (window.html2canvas && cardRef.current) {
      return window.html2canvas(cardRef.current, { backgroundColor: "#FAF5EE", scale: 2 });
    }

    const canvas  = document.createElement("canvas");
    canvas.width  = 640;
    canvas.height = 1140;
    const ctx     = canvas.getContext("2d");
    ctx.fillStyle = "#FAF5EE";
    ctx.fillRect(0, 0, 640, 1140);

    // Decorative month name in background
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = "#C4704F";
    ctx.font = "italic 300 130px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(monthName, 320, 200);
    ctx.restore();

    // Names
    ctx.fillStyle = "#8A7060";
    ctx.font = "italic 20px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(`${userName} & ${partnerName}`, 320, 110);

    ctx.font = "11px system-ui";
    ctx.fillStyle = "#B8A898";
    ctx.fillText(monthLabel.toUpperCase(), 320, 136);

    // Total
    ctx.fillStyle = "#C4704F";
    ctx.font = "300 italic 96px Georgia, serif";
    ctx.fillText(fmt(total), 320, 262);

    // Ornament
    ctx.strokeStyle = "#C4704F";
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(268, 290); ctx.lineTo(308, 290); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(332, 290); ctx.lineTo(372, 290); ctx.stroke();
    ctx.globalAlpha = 1;

    // Stats row
    ctx.strokeStyle = "#F0E8DF";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80, 316); ctx.lineTo(560, 316); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(80, 400); ctx.lineTo(560, 400); ctx.stroke();

    // Left stat
    ctx.fillStyle = "#8A7060";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("PLANES", 186, 338);
    ctx.fillStyle = "#C4704F";
    ctx.font = "italic 300 52px Georgia, serif";
    ctx.fillText(monthly.length.toString(), 186, 388);

    // Divider vertical
    ctx.strokeStyle = "#F0E8DF";
    ctx.beginPath(); ctx.moveTo(320, 324); ctx.lineTo(320, 392); ctx.stroke();

    // Right stat
    ctx.fillStyle = "#8A7060";
    ctx.font = "11px system-ui";
    ctx.fillText("DE MEDIA", 454, 338);
    ctx.fillStyle = "#C4704F";
    ctx.font = "italic 300 36px Georgia, serif";
    ctx.fillText(fmt(avg), 454, 380);

    // Category bar
    ctx.strokeStyle = "#F0E8DF";
    ctx.beginPath(); ctx.moveTo(80, 440); ctx.lineTo(560, 440); ctx.stroke();

    let barX = 80;
    const barW = 480, barH = 20, barY = 456;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 10);
    ctx.clip();
    byCategory.forEach(({ category, total: catTotal }, i) => {
      const segW = (catTotal / (total || 1)) * barW;
      ctx.fillStyle = SEGMENT_COLORS[i] || "#D6C5B5";
      ctx.fillRect(barX, barY, segW, barH);
      barX += segW;
    });
    ctx.restore();

    // Category legend
    ctx.font = "12px system-ui";
    ctx.textAlign = "left";
    let lx = 80;
    byCategory.slice(0, 4).forEach(({ category, total: catTotal }, i) => {
      ctx.fillStyle = SEGMENT_COLORS[i] || "#D6C5B5";
      ctx.beginPath(); ctx.arc(lx + 5, 498, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#8A7060";
      ctx.fillText(
        `${CATEGORY_META[category]?.label || category}  ${fmt(catTotal)}`,
        lx + 14, 503
      );
      lx += 148;
    });

    // Biggest moment — warm card bg
    if (biggest) {
      ctx.strokeStyle = "#F0E8DF";
      ctx.beginPath(); ctx.moveTo(80, 528); ctx.lineTo(560, 528); ctx.stroke();

      ctx.fillStyle = "#F2E6DC";
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(80, 548, 480, 152, 20);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#C4704F";
      ctx.font = "11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("VUESTRO MOMENTO MÁS GRANDE", 320, 576);

      const desc = biggest.description || CATEGORY_META[biggest.category]?.label || "Gasto";
      ctx.fillStyle = "#2C1810";
      ctx.font = "italic 300 44px Georgia, serif";
      ctx.fillText(desc, 320, 640);

      ctx.fillStyle = "#C4704F";
      ctx.font = "italic 26px Georgia, serif";
      ctx.fillText(fmt(biggest.amountEUR ?? biggest.amount), 320, 678);
    }

    // Phrase
    ctx.strokeStyle = "#F0E8DF";
    ctx.beginPath(); ctx.moveTo(80, 728); ctx.lineTo(560, 728); ctx.stroke();

    ctx.fillStyle = "#8A7060";
    ctx.font = "italic 24px Georgia, serif";
    ctx.textAlign = "center";
    const words = phrase.split(" ");
    let line = "", py = 796;
    for (const w of words) {
      const test = line + w + " ";
      if (ctx.measureText(test).width > 440 && line) {
        ctx.fillText(line.trim(), 320, py); line = w + " "; py += 36;
      } else line = test;
    }
    ctx.fillText(line.trim(), 320, py);

    // Ornament bottom
    ctx.strokeStyle = "#C4704F";
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(268, py + 36); ctx.lineTo(308, py + 36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(332, py + 36); ctx.lineTo(372, py + 36); ctx.stroke();
    ctx.globalAlpha = 1;

    // Watermark
    ctx.fillStyle = "#D6C5B5";
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText("luvio", 320, 1100);

    return canvas;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-luvio-bg overflow-y-auto scroll-container"
    >
      {/* Header */}
      <header className="safe-top px-6 pt-3 pb-3 flex justify-between items-center sticky top-0 z-10 glass">
        <img src="/logo.jpg" alt="luvio" className="h-8 w-auto mix-blend-multiply brightness-110" />
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="w-8 h-8 rounded-xl bg-luvio-warm100 flex items-center justify-center
                     text-luvio-warm500 press-scale"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </header>

      <div ref={cardRef} className="pb-4">

        {/* ── Hero ── */}
        <div className="relative text-center px-6 pt-8 pb-7 overflow-hidden">
          {/* Decorative month name in background */}
          <p
            className="absolute inset-0 flex items-center justify-center
                       font-display italic text-luvio-terra/[0.07] font-light
                       select-none pointer-events-none leading-none"
            style={{ fontSize: "clamp(5rem, 32vw, 9rem)" }}
            aria-hidden="true"
          >
            {monthName}
          </p>

          {/* Content */}
          <div className="relative">
            <p className="font-display italic text-luvio-warm400 text-[13px] mb-0.5">
              {userName} &amp; {partnerName}
            </p>
            <p className="text-[10px] text-luvio-warm400/70 tracking-widest uppercase font-sans">
              {monthLabel}
            </p>

            <p
              className="font-display italic text-luvio-terra font-light leading-none mt-5"
              style={{ fontSize: "clamp(3.8rem, 20vw, 5.8rem)" }}
            >
              {fmt(total)}
            </p>

            <Ornament className="my-3" />

            <p className="text-luvio-warm500 text-xs font-sans">
              {monthly.length === 0
                ? "Aún no hay gastos este mes"
                : `${monthly.length} ${monthly.length === 1 ? "gasto compartido" : "gastos compartidos"}`}
            </p>
          </div>
        </div>

        {/* ── Stats row ── */}
        {monthly.length > 0 && (
          <div className="border-y border-luvio-warm100 flex divide-x divide-luvio-warm100">
            <div className="flex-1 text-center py-4 px-2">
              <p className="font-display italic text-luvio-terra font-light leading-none"
                 style={{ fontSize: "2.4rem" }}>
                {monthly.length}
              </p>
              <p className="text-[10px] text-luvio-warm500 tracking-widest uppercase font-sans mt-1">
                planes
              </p>
            </div>
            <div className="flex-1 text-center py-4 px-2">
              <p className="font-display italic text-luvio-terra font-light leading-none"
                 style={{ fontSize: "1.9rem" }}>
                {fmt(avg)}
              </p>
              <p className="text-[10px] text-luvio-warm500 tracking-widest uppercase font-sans mt-1">
                de media
              </p>
            </div>
            {topCategory && (
              <div className="flex-1 text-center py-4 px-2 flex flex-col items-center justify-center gap-1">
                <CategoryIcon id={topCategory} size={22} color="#C4704F" />
                <p className="text-[10px] text-luvio-warm500 tracking-widest uppercase font-sans">
                  {CATEGORY_META[topCategory]?.label}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Category bar ── */}
        {byCategory.length > 0 && (
          <div className="px-5 py-5">
            <div className="h-5 rounded-full overflow-hidden flex">
              {byCategory.map(({ category, total: catTotal }, i) => {
                const pct = Math.round((catTotal / (total || 1)) * 100);
                return (
                  <motion.div
                    key={category}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, delay: i * 0.08, ease: "easeOut" }}
                    style={{ backgroundColor: SEGMENT_COLORS[i] || "#D6C5B5", flexShrink: 0 }}
                    className="relative h-full flex items-center justify-center"
                  >
                    {pct > 14 && (
                      <span className="text-[9px] text-white/90 font-sans font-semibold">
                        {pct}%
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
              {byCategory.map(({ category, total: catTotal }, i) => (
                <span key={category} className="flex items-center gap-1.5 text-[11px] font-sans text-luvio-warm500">
                  <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: SEGMENT_COLORS[i] || "#D6C5B5" }} />
                  {CATEGORY_META[category]?.label || category}
                  <span className="text-luvio-text font-medium">{fmt(catTotal)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Biggest moment ── */}
        {biggest && (
          <>
            <div className="h-px bg-luvio-warm100 mx-5" />
            <div className="mx-5 my-5 rounded-3xl overflow-hidden"
                 style={{ background: "linear-gradient(135deg, #F5EAE0 0%, #EDD6C4 100%)" }}>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CategoryIcon id={biggest.category} size={14} color="#C4704F" />
                  <p className="text-[10px] text-luvio-terra tracking-widest uppercase font-sans">
                    Vuestro momento más grande
                  </p>
                </div>
                <p className="font-display italic text-luvio-text font-light leading-tight"
                   style={{ fontSize: "clamp(1.8rem, 7vw, 2.4rem)" }}>
                  {biggest.description || CATEGORY_META[biggest.category]?.label || "Gasto"}
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="font-display italic text-luvio-terra font-light text-2xl">
                    {fmt(biggest.amountEUR ?? biggest.amount)}
                  </p>
                  <span className="text-luvio-warm500 text-xs font-sans">
                    {CATEGORY_META[biggest.category]?.label}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Phrase ── */}
        <div className="px-8 py-10 text-center">
          <Ornament className="mb-6" />
          <p className="font-display italic text-luvio-text/80 leading-relaxed"
             style={{ fontSize: "clamp(1.15rem, 5vw, 1.4rem)" }}>
            {phrase}
          </p>
          <Ornament className="mt-6" />
        </div>

        {/* Watermark */}
        <img
          src="/logo.jpg"
          alt="luvio"
          className="h-5 w-auto mx-auto mb-4 opacity-30 mix-blend-multiply brightness-110"
        />

      </div>

      {/* Share CTA */}
      <div className="px-5 pb-10 safe-bottom">
        <button
          onClick={handleShare}
          disabled={sharing || monthly.length === 0}
          className="w-full py-4 rounded-2xl bg-luvio-terra text-white
                     text-sm font-sans font-medium press-scale disabled:opacity-40 transition-opacity"
        >
          {sharing ? "Preparando…" : "Compartir resumen"}
        </button>
      </div>
    </motion.div>
  );
}
