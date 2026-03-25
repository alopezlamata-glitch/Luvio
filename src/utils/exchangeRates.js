const CACHE_KEY = "luvio_fx_rates";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// Tasas hardcoded de emergencia (por si falla todo)
const FALLBACK = { EUR: 1, USD: 0.92, GBP: 1.17, JPY: 0.0062, CHF: 1.04, MXN: 0.053, ARS: 0.001, BRL: 0.18, AED: 0.25, COP: 0.00023 };

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, rates } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return rates;
  } catch { return null; }
}

function writeCache(rates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), rates }));
  } catch {}
}

// API primaria: soporta ~170 monedas, CDN-cached, sin API key
// Devuelve cuántas unidades de cada moneda equivalen a 1 EUR
async function fetchFromCDN() {
  const res = await fetch(
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json",
    { signal: AbortSignal.timeout(6000) }
  );
  const data = await res.json();
  // data.eur = { usd: 1.09, gbp: 0.85, ... } → invertir para obtener X→EUR
  const rates = { EUR: 1 };
  for (const [code, val] of Object.entries(data.eur || {})) {
    if (val > 0) rates[code.toUpperCase()] = 1 / val;
  }
  return rates;
}

// API secundaria: frankfurter (solo ~30 monedas ECB)
async function fetchFromFrankfurter() {
  const res = await fetch(
    "https://api.frankfurter.app/latest?from=EUR",
    { signal: AbortSignal.timeout(5000) }
  );
  const data = await res.json();
  const rates = { EUR: 1 };
  for (const [code, val] of Object.entries(data.rates || {})) {
    if (val > 0) rates[code] = 1 / val;
  }
  return rates;
}

export async function getRatesToEUR(force = false) {
  if (!force) {
    const cached = readCache();
    if (cached) return cached;
  }
  try {
    const rates = await fetchFromCDN();
    writeCache(rates);
    return rates;
  } catch {
    try {
      const rates = await fetchFromFrankfurter();
      writeCache(rates);
      return rates;
    } catch {
      return readCache() || FALLBACK;
    }
  }
}

export function getRateSync(currency) {
  if (currency === "EUR") return 1;
  const cached = readCache();
  return cached?.[currency] ?? FALLBACK[currency] ?? null; // null = desconocido
}

export function prefetchRates() {
  if (!readCache()) getRatesToEUR();
}
