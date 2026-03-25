import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useExpenses } from "../../hooks/useExpenses";
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning, hapticError } from "../../utils/native";
import { getRateSync, getRatesToEUR } from "../../utils/exchangeRates";

const CATEGORIES = [
  { id: "cena",     label: "Cena" },
  { id: "casa",     label: "Casa" },
  { id: "viaje",    label: "Viaje" },
  { id: "capricho", label: "Capricho" },
  { id: "super",    label: "Super" },
  { id: "otro",     label: "Otro" },
];

const CURRENCIES = [
  { symbol: "€", code: "EUR" },
  { symbol: "$", code: "USD" },
  { symbol: "£", code: "GBP" },
  { symbol: "¥", code: "JPY" },
  { symbol: "CHF", code: "CHF" },
];

const ALL_CURRENCIES = [
  { code: "AED", name: "Dírham emiratí" },
  { code: "AFN", name: "Afgani afgano" },
  { code: "ALL", name: "Lek albanés" },
  { code: "AMD", name: "Dram armenio" },
  { code: "ANG", name: "Florín antillano" },
  { code: "AOA", name: "Kwanza angoleño" },
  { code: "ARS", name: "Peso argentino" },
  { code: "AUD", name: "Dólar australiano" },
  { code: "AWG", name: "Florín arubeño" },
  { code: "AZN", name: "Manat azerbaiyano" },
  { code: "BAM", name: "Marco bosnio" },
  { code: "BBD", name: "Dólar de Barbados" },
  { code: "BDT", name: "Taka bangladesí" },
  { code: "BGN", name: "Lev búlgaro" },
  { code: "BHD", name: "Dinar bareiní" },
  { code: "BIF", name: "Franco burundés" },
  { code: "BMD", name: "Dólar de Bermudas" },
  { code: "BND", name: "Dólar de Brunéi" },
  { code: "BOB", name: "Boliviano" },
  { code: "BRL", name: "Real brasileño" },
  { code: "BSD", name: "Dólar bahameño" },
  { code: "BTN", name: "Ngultrum butanés" },
  { code: "BWP", name: "Pula botsuanesa" },
  { code: "BYN", name: "Rublo bielorruso" },
  { code: "BZD", name: "Dólar de Belice" },
  { code: "CAD", name: "Dólar canadiense" },
  { code: "CDF", name: "Franco congoleño" },
  { code: "CHF", name: "Franco suizo" },
  { code: "CLP", name: "Peso chileno" },
  { code: "CNY", name: "Yuan chino" },
  { code: "COP", name: "Peso colombiano" },
  { code: "CRC", name: "Colón costarricense" },
  { code: "CUP", name: "Peso cubano" },
  { code: "CVE", name: "Escudo caboverdiano" },
  { code: "CZK", name: "Corona checa" },
  { code: "DJF", name: "Franco yibutiano" },
  { code: "DKK", name: "Corona danesa" },
  { code: "DOP", name: "Peso dominicano" },
  { code: "DZD", name: "Dinar argelino" },
  { code: "EGP", name: "Libra egipcia" },
  { code: "ERN", name: "Nakfa eritreo" },
  { code: "ETB", name: "Birr etíope" },
  { code: "EUR", name: "Euro" },
  { code: "FJD", name: "Dólar fiyiano" },
  { code: "FKP", name: "Libra malvinense" },
  { code: "GBP", name: "Libra esterlina" },
  { code: "GEL", name: "Lari georgiano" },
  { code: "GHS", name: "Cedi ghanés" },
  { code: "GIP", name: "Libra gibraltareña" },
  { code: "GMD", name: "Dalasi gambiano" },
  { code: "GNF", name: "Franco guineano" },
  { code: "GTQ", name: "Quetzal guatemalteco" },
  { code: "GYD", name: "Dólar guyanés" },
  { code: "HKD", name: "Dólar de Hong Kong" },
  { code: "HNL", name: "Lempira hondureño" },
  { code: "HRK", name: "Kuna croata" },
  { code: "HTG", name: "Gourde haitiano" },
  { code: "HUF", name: "Forinto húngaro" },
  { code: "IDR", name: "Rupia indonesia" },
  { code: "ILS", name: "Séquel israelí" },
  { code: "INR", name: "Rupia india" },
  { code: "IQD", name: "Dinar iraquí" },
  { code: "IRR", name: "Rial iraní" },
  { code: "ISK", name: "Corona islandesa" },
  { code: "JMD", name: "Dólar jamaicano" },
  { code: "JOD", name: "Dinar jordano" },
  { code: "JPY", name: "Yen japonés" },
  { code: "KES", name: "Chelín keniano" },
  { code: "KGS", name: "Som kirguís" },
  { code: "KHR", name: "Riel camboyano" },
  { code: "KMF", name: "Franco comorense" },
  { code: "KRW", name: "Won surcoreano" },
  { code: "KWD", name: "Dinar kuwaití" },
  { code: "KYD", name: "Dólar de Caimán" },
  { code: "KZT", name: "Tenge kazajo" },
  { code: "LAK", name: "Kip laosiano" },
  { code: "LBP", name: "Libra libanesa" },
  { code: "LKR", name: "Rupia de Sri Lanka" },
  { code: "LRD", name: "Dólar liberiano" },
  { code: "LSL", name: "Loti lesotense" },
  { code: "LYD", name: "Dinar libio" },
  { code: "MAD", name: "Dírham marroquí" },
  { code: "MDL", name: "Leu moldavo" },
  { code: "MGA", name: "Ariary malgache" },
  { code: "MKD", name: "Denar macedonio" },
  { code: "MMK", name: "Kyat birmano" },
  { code: "MNT", name: "Tugrik mongol" },
  { code: "MOP", name: "Pataca macaense" },
  { code: "MRU", name: "Uguiya mauritana" },
  { code: "MUR", name: "Rupia mauriciana" },
  { code: "MVR", name: "Rufiyaa maldiva" },
  { code: "MWK", name: "Kwacha malauí" },
  { code: "MXN", name: "Peso mexicano" },
  { code: "MYR", name: "Ringgit malayo" },
  { code: "MZN", name: "Metical mozambiqueño" },
  { code: "NAD", name: "Dólar namibio" },
  { code: "NGN", name: "Naira nigeriana" },
  { code: "NIO", name: "Córdoba nicaragüense" },
  { code: "NOK", name: "Corona noruega" },
  { code: "NPR", name: "Rupia nepalesa" },
  { code: "NZD", name: "Dólar neozelandés" },
  { code: "OMR", name: "Rial omaní" },
  { code: "PAB", name: "Balboa panameño" },
  { code: "PEN", name: "Sol peruano" },
  { code: "PGK", name: "Kina de Papúa Nueva Guinea" },
  { code: "PHP", name: "Peso filipino" },
  { code: "PKR", name: "Rupia pakistaní" },
  { code: "PLN", name: "Esloti polaco" },
  { code: "PYG", name: "Guaraní paraguayo" },
  { code: "QAR", name: "Riyal catarí" },
  { code: "RON", name: "Leu rumano" },
  { code: "RSD", name: "Dinar serbio" },
  { code: "RUB", name: "Rublo ruso" },
  { code: "RWF", name: "Franco ruandés" },
  { code: "SAR", name: "Riyal saudí" },
  { code: "SBD", name: "Dólar de Salomón" },
  { code: "SCR", name: "Rupia de Seychelles" },
  { code: "SDG", name: "Libra sudanesa" },
  { code: "SEK", name: "Corona sueca" },
  { code: "SGD", name: "Dólar de Singapur" },
  { code: "SHP", name: "Libra de Santa Elena" },
  { code: "SLL", name: "Leone de Sierra Leona" },
  { code: "SOS", name: "Chelín somalí" },
  { code: "SRD", name: "Dólar surinamés" },
  { code: "STN", name: "Dobra de Santo Tomé" },
  { code: "SVC", name: "Colón salvadoreño" },
  { code: "SYP", name: "Libra siria" },
  { code: "SZL", name: "Lilangeni suazi" },
  { code: "THB", name: "Baht tailandés" },
  { code: "TJS", name: "Somoni tayiko" },
  { code: "TMT", name: "Manat turcomano" },
  { code: "TND", name: "Dinar tunecino" },
  { code: "TOP", name: "Paʻanga tongano" },
  { code: "TRY", name: "Lira turca" },
  { code: "TTD", name: "Dólar de Trinidad y Tobago" },
  { code: "TWD", name: "Nuevo dólar taiwanés" },
  { code: "TZS", name: "Chelín tanzano" },
  { code: "UAH", name: "Grivna ucraniana" },
  { code: "UGX", name: "Chelín ugandés" },
  { code: "USD", name: "Dólar estadounidense" },
  { code: "UYU", name: "Peso uruguayo" },
  { code: "UZS", name: "Som uzbeko" },
  { code: "VES", name: "Bolívar venezolano" },
  { code: "VND", name: "Dong vietnamita" },
  { code: "VUV", name: "Vatu vanuatense" },
  { code: "WST", name: "Tālā samoano" },
  { code: "XAF", name: "Franco CFA de África Central" },
  { code: "XCD", name: "Dólar del Caribe Oriental" },
  { code: "XOF", name: "Franco CFA de África Occidental" },
  { code: "XPF", name: "Franco CFP" },
  { code: "YER", name: "Rial yemení" },
  { code: "ZAR", name: "Rand sudafricano" },
  { code: "ZMW", name: "Kwacha zambiano" },
  { code: "ZWL", name: "Dólar zimbabuense" },
];


function sanitizeText(str) {
  return str.replace(/[<>"'&]/g, "").slice(0, 100);
}

function validateAmount(val) {
  const n = parseFloat(val);
  return !isNaN(n) && n > 0 && n < 100000;
}

const fmtEur = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n || 0);

export default function AddExpense({ isOpen, onClose }) {
  const { user, partner, nickname } = useAuth();
  const { addExpense, monthlyCount, freeLimit, isPremium } = useExpenses();

  const [step, setStep]               = useState(0);
  const [paidBy, setPaidBy]           = useState(null);
  const [category, setCategory]       = useState(null);
  const [amount, setAmount]           = useState("");
  const [currency, setCurrency]       = useState("EUR");
  const [rateToEUR, setRateToEUR]     = useState(1);
  const [rateLoading, setRateLoading] = useState(false);
  const [splitType, setSplitType]     = useState("equal");
  // custom split: amounts in original currency
  const [myAmount, setMyAmount]       = useState("");
  const [partnerAmount, setPartnerAmount] = useState("");
  const [showCurrencies, setShowCurrencies] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError]             = useState(null);
  const [submitting, setSubmitting]   = useState(false);

  const amountRef     = useRef(null);
  const myAmountRef   = useRef(null);

  // Focus amount on step 1
  useEffect(() => {
    if (step === 1 && amountRef.current) {
      setTimeout(() => amountRef.current?.focus(), 200);
    }
  }, [step]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(0); setPaidBy(null); setCategory(null);
      setAmount(""); setCurrency("EUR"); setRateToEUR(1);
      setSplitType("equal"); setMyAmount(""); setPartnerAmount("");
      setShowCurrencies(false); setCurrencySearch(""); setShowCustomInput(false);
      setDescription(""); setError(null);
    }
  }, [isOpen]);

  // Tipos de cambio: usar caché local inmediatamente, refrescar si hace > 24h
  useEffect(() => {
    if (currency === "EUR") { setRateToEUR(1); setRateLoading(false); return; }
    // Tasa sincrónica desde caché (instantáneo)
    setRateToEUR(getRateSync(currency));
    setRateLoading(false);
    // Refrescar caché en background si está expirada
    getRatesToEUR().then((rates) => {
      if (rates[currency]) setRateToEUR(rates[currency]);
    });
  }, [currency]);

  // When total amount changes, keep custom split in sync (reset)
  useEffect(() => {
    if (splitType === "custom" && validateAmount(amount)) {
      const total = parseFloat(amount);
      const half  = (total / 2).toFixed(2);
      setMyAmount(half);
      setPartnerAmount(half);
    }
  }, [amount, splitType]);

  async function applyCustomCurrency(code) {
    const upper = code.toUpperCase().trim();
    if (!upper) return;
    setCurrency(upper);
    setShowCustomInput(false);
    setShowCurrencies(false);
    setCurrencySearch("");
    const syncRate = getRateSync(upper);
    if (syncRate) {
      setRateToEUR(syncRate);
    } else {
      // Rate desconocido — buscar en la API completa
      setRateLoading(true);
      const rates = await getRatesToEUR();
      setRateToEUR(rates[upper] ?? 1);
      setRateLoading(false);
    }
  }

  const myName      = nickname || user?.displayName?.split(" ")[0] || "Yo";
  const partnerName = partner?.name?.split(" ")[0] || "Pareja";
  const payerIsMe   = paidBy === user?.uid;
  const totalAmt    = parseFloat(amount) || 0;
  const amountEUR   = totalAmt * rateToEUR;
  const currSymbol  = CURRENCIES.find((c) => c.code === currency)?.symbol || currency;

  function handleMyAmountChange(val) {
    setMyAmount(val);
    const n = parseFloat(val);
    if (!isNaN(n) && validateAmount(amount)) {
      setPartnerAmount(Math.max(0, totalAmt - n).toFixed(2));
    }
  }

  function handlePartnerAmountChange(val) {
    setPartnerAmount(val);
    const n = parseFloat(val);
    if (!isNaN(n) && validateAmount(amount)) {
      setMyAmount(Math.max(0, totalAmt - n).toFixed(2));
    }
  }

  function buildSplit() {
    if (splitType === "payer") return { type: "payer" };
    if (splitType === "custom" && validateAmount(amount)) {
      const myAmt      = parseFloat(myAmount) || 0;
      const partnerAmt = parseFloat(partnerAmount) || 0;
      const total      = myAmt + partnerAmt || 1;
      // shares relative to the payer's perspective
      const myShare      = myAmt / total;
      const partnerShare = partnerAmt / total;
      return {
        type: "custom",
        shares: {
          [user.uid]: payerIsMe ? myShare : partnerShare,
          ...(partner?.uid ? { [partner.uid]: payerIsMe ? partnerShare : myShare } : {}),
        },
      };
    }
    return { type: "equal" };
  }

  async function handleSubmit() {
    if (!validateAmount(amount) || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await addExpense({
        amount:      totalAmt,
        amountEUR:   parseFloat(amountEUR.toFixed(2)),
        currency,
        category:    category || "otro",
        paidBy,
        split:       buildSplit(),
        description: sanitizeText(description) || CATEGORIES.find((c) => c.id === category)?.label || "",
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
        <button onClick={onClose} aria-label="Cerrar"
          className="absolute top-4 right-4 text-luvio-warm500 text-2xl p-2 press-scale">×</button>

        {!isPremium && (
          <div className="absolute top-4 left-4 text-xs text-luvio-warm500 font-sans">
            {monthlyCount}/{freeLimit} este mes
          </div>
        )}

        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {[0, 1].map((s) => (
            <div key={s} className={`w-1.5 h-1.5 rounded-full transition-colors ${step >= s ? "bg-luvio-terra" : "bg-luvio-warm200"}`} />
          ))}
        </div>

        {/* ═══ STEP 0: ¿Quién pagó? ═══ */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <p className="font-display italic text-luvio-terra text-2xl font-light mb-8">¿Quién pagó?</p>
            <div className="flex gap-4">
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { hapticLight(); setPaidBy(user.uid); setStep(1); }}
                className="w-36 h-36 rounded-3xl border-2 border-luvio-warm200 bg-luvio-surface
                           flex flex-col items-center justify-center gap-3
                           hover:border-luvio-terra active:border-luvio-terra transition-colors">
                {user?.photoURL
                  ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full object-cover" />
                  : <div className="w-12 h-12 rounded-full bg-luvio-blush flex items-center justify-center text-lg text-luvio-terra font-medium">{user?.displayName?.[0] || "?"}</div>}
                <span className="text-luvio-text font-sans font-medium text-sm">{myName}</span>
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { hapticLight(); setPaidBy(partner?.uid || "partner"); setStep(1); }}
                className="w-36 h-36 rounded-3xl border-2 border-luvio-warm200 bg-luvio-surface
                           flex flex-col items-center justify-center gap-3
                           hover:border-luvio-terra active:border-luvio-terra transition-colors">
                {partner?.photo
                  ? <img src={partner.photo} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full object-cover" />
                  : <div className="w-12 h-12 rounded-full bg-luvio-blush flex items-center justify-center text-lg text-luvio-terra font-medium">{partner?.name?.[0] || "?"}</div>}
                <span className="text-luvio-text font-sans font-medium text-sm">{partnerName}</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ═══ STEP 1: Categoría + Importe + Split ═══ */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">

            {/* Category */}
            <p className="font-display italic text-luvio-terra text-xl font-light mb-4 text-center">¿Qué fue?</p>
            <div className="flex flex-wrap gap-2 justify-center mb-5">
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-sans font-medium transition-all ${
                    category === c.id ? "bg-luvio-blush border border-luvio-terra text-luvio-terra"
                      : "bg-luvio-warm100 border border-transparent text-luvio-warm500"}`}>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Amount + currency picker */}
            <div className="relative mb-1">
              <button
                onClick={() => { hapticLight(); setShowCurrencies(!showCurrencies); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10
                           px-2 py-1 rounded-lg bg-luvio-warm100 text-luvio-warm500
                           text-sm font-sans font-medium flex items-center gap-1 press-scale"
              >
                {currSymbol}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
              <input
                ref={amountRef}
                type="number" inputMode="decimal" step="0.01" min="0.01" max="99999"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full py-4 pl-20 pr-5 rounded-2xl border-2 border-luvio-warm200 bg-luvio-surface
                           text-luvio-text text-2xl font-display font-light
                           focus:border-luvio-terra focus:outline-none transition-colors"
              />
            </div>

            {/* EUR conversion hint */}
            {currency !== "EUR" && validateAmount(amount) && (
              <p className="text-luvio-warm500 text-xs font-sans mb-2 text-right pr-1">
                {rateLoading ? "Obteniendo tipo de cambio…" : `≈ ${fmtEur(amountEUR)} para el balance`}
              </p>
            )}

            {/* Currency dropdown */}
            <AnimatePresence>
              {showCurrencies && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="mb-3 flex gap-2 flex-wrap">
                  {CURRENCIES.map((c) => (
                    <button key={c.code}
                      onClick={() => { hapticLight(); setCurrency(c.code); setShowCurrencies(false); setShowCustomInput(false); }}
                      className={`px-3 py-1.5 rounded-xl text-sm font-sans font-medium transition-all ${
                        currency === c.code ? "bg-luvio-terra text-white" : "bg-luvio-warm100 text-luvio-warm500"}`}>
                      {c.symbol} {c.code}
                    </button>
                  ))}
                  <button
                    onClick={() => { hapticLight(); setShowCustomInput(!showCustomInput); setCurrencySearch(""); }}
                    className={`px-3 py-1.5 rounded-xl text-sm font-sans font-medium transition-all ${
                      showCustomInput ? "bg-luvio-terra text-white" : "bg-luvio-warm100 text-luvio-warm500"}`}>
                    Otra…
                  </button>
                  {showCustomInput && (() => {
                    const filtered = ALL_CURRENCIES.filter((c) =>
                      c.code.includes(currencySearch.toUpperCase()) ||
                      c.name.toLowerCase().includes(currencySearch.toLowerCase())
                    );
                    return (
                      <div className="w-full mt-1">
                        <input
                          autoFocus
                          value={currencySearch}
                          onChange={(e) => setCurrencySearch(e.target.value)}
                          placeholder="Buscar moneda…"
                          className="w-full py-2 px-3 rounded-xl border border-luvio-warm200 bg-luvio-surface
                                     text-luvio-text text-sm font-sans mb-2
                                     focus:outline-none focus:border-luvio-terra transition-colors"
                        />
                        <div className="max-h-44 overflow-y-auto rounded-xl border border-luvio-warm100 bg-luvio-surface">
                          {filtered.length === 0 && (
                            <p className="text-luvio-warm500 text-xs text-center py-3 font-sans">Sin resultados</p>
                          )}
                          {filtered.map((c) => (
                            <button
                              key={c.code}
                              onClick={() => { hapticLight(); applyCustomCurrency(c.code); }}
                              className={`w-full px-3 py-2.5 flex justify-between items-center text-left
                                         border-b border-luvio-warm100 last:border-0 transition-colors
                                         hover:bg-luvio-warm100 active:bg-luvio-blush
                                         ${currency === c.code ? "bg-luvio-blush" : ""}`}
                            >
                              <span className="text-luvio-text text-sm font-sans">{c.name}</span>
                              <span className="text-luvio-warm500 text-xs font-sans font-medium ml-2 shrink-0">{c.code}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Split options */}
            <p className="text-luvio-warm500 text-[10px] tracking-widest uppercase mb-2 font-sans">Cómo se divide</p>
            <div className="flex gap-2 mb-3">
              {[
                {
                  id: "equal", label: "A medias",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M5 8h14M5 16h14"/></svg>,
                },
                {
                  id: "payer", label: payerIsMe ? "Invito yo" : `Invita ${partnerName}`,
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>,
                },
                {
                  id: "custom", label: "Personalizado",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
                },
              ].map((opt) => (
                <button key={opt.id}
                  onClick={() => { hapticLight(); setSplitType(opt.id); }}
                  className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all
                    text-xs font-sans font-medium border ${
                    splitType === opt.id
                      ? "bg-luvio-blush border-luvio-terra text-luvio-terra"
                      : "bg-luvio-warm100 border-transparent text-luvio-warm500"}`}>
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom split — importes en dinero */}
            <AnimatePresence>
              {splitType === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 overflow-hidden"
                >
                  <div className="flex gap-2">
                    {/* Me */}
                    <div className="flex-1">
                      <p className="text-luvio-warm500 text-xs font-sans mb-1 text-center">{payerIsMe ? myName : partnerName}</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-luvio-warm500 text-sm font-sans">{currSymbol}</span>
                        <input
                          ref={myAmountRef}
                          type="number" inputMode="decimal" step="0.01" min="0"
                          value={myAmount}
                          onChange={(e) => handleMyAmountChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full py-2.5 pl-7 pr-3 rounded-xl border-2 border-luvio-warm200 bg-luvio-surface
                                     text-luvio-text text-base font-display font-light
                                     focus:border-luvio-terra focus:outline-none transition-colors text-center"
                        />
                      </div>
                    </div>
                    {/* Partner */}
                    <div className="flex-1">
                      <p className="text-luvio-warm500 text-xs font-sans mb-1 text-center">{payerIsMe ? partnerName : myName}</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-luvio-warm500 text-sm font-sans">{currSymbol}</span>
                        <input
                          type="number" inputMode="decimal" step="0.01" min="0"
                          value={partnerAmount}
                          onChange={(e) => handlePartnerAmountChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full py-2.5 pl-7 pr-3 rounded-xl border-2 border-luvio-warm200 bg-luvio-surface
                                     text-luvio-text text-base font-display font-light
                                     focus:border-luvio-terra focus:outline-none transition-colors text-center"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Validation */}
                  {validateAmount(amount) && (() => {
                    const sum = (parseFloat(myAmount) || 0) + (parseFloat(partnerAmount) || 0);
                    const diff = Math.abs(sum - totalAmt);
                    return diff > 0.01 ? (
                      <p className="text-luvio-caution text-xs font-sans mt-1.5 text-center">
                        La suma ({currSymbol}{sum.toFixed(2)}) no cuadra con el total ({currSymbol}{totalAmt.toFixed(2)})
                      </p>
                    ) : null;
                  })()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Description */}
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              maxLength={100}
              className="w-full py-3.5 px-5 rounded-2xl mb-5
                         border border-luvio-warm200 bg-luvio-surface
                         text-luvio-text text-sm font-sans
                         focus:outline-none focus:border-luvio-terra transition-colors"
            />

            {error === "paywall" && (
              <div className="mb-5 p-4 rounded-2xl bg-luvio-blush/40 border border-luvio-terra/30 text-center">
                <p className="text-luvio-terra text-sm font-medium mb-1 font-sans">Has llegado al límite de {freeLimit} gastos/mes</p>
                <p className="text-luvio-warm500 text-xs mb-3 font-sans">Pasa a Premium por 3,99€/mes para gastos ilimitados</p>
                <button className="px-6 py-2.5 rounded-xl bg-luvio-terra text-white text-sm font-medium font-sans">Desbloquear Premium</button>
              </div>
            )}
            {error && error !== "paywall" && (
              <p className="text-red-500 text-sm text-center mb-4 font-sans">{error}</p>
            )}

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
              disabled={!validateAmount(amount) || submitting}
              className="w-full py-4 rounded-2xl text-white text-base font-sans font-medium
                         transition-all disabled:opacity-30 bg-luvio-terra active:opacity-80">
              {submitting ? "Añadiendo..." : "Añadir gasto"}
            </motion.button>
          </motion.div>
        )}

        {/* ═══ STEP 2: Éxito ═══ */}
        {step === 2 && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mx-auto mb-4">
              <motion.circle cx="36" cy="36" r="32" stroke="#C4704F" strokeWidth="2"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }} />
              <motion.path d="M22 36 L31 45 L50 27" stroke="#C4704F" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 0.15, duration: 0.35 }} />
            </svg>
            <p className="font-display italic text-luvio-terra text-2xl font-light">Anotado</p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
