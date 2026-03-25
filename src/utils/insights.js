/**
 * Generador de insights automáticos para Luvio.
 * Analiza patrones de gasto y genera frases cercanas, no financieras.
 */

const CATEGORY_NAMES = {
  cena: "cenas", casa: "casa", viaje: "viajes",
  capricho: "caprichos", super: "supermercado", otro: "otros",
};

/**
 * Genera insights basados en los gastos actuales y del mes anterior.
 * @param {Array} currentMonth - Gastos del mes actual
 * @param {Array} lastMonth - Gastos del mes anterior
 * @param {Object} balance - { diff, owes, owed, amount }
 * @returns {string[]} Array de frases de insight
 */
export function generateInsights(currentMonth, lastMonth, balance) {
  const insights = [];

  // 1. Comparación mes a mes por categoría
  const currentByCat = groupByCategory(currentMonth);
  const lastByCat = groupByCategory(lastMonth);

  for (const [cat, total] of Object.entries(currentByCat)) {
    const prev = lastByCat[cat] || 0;
    if (prev > 0) {
      const change = ((total - prev) / prev) * 100;
      if (change > 30) {
        insights.push(
          `Este mes habéis gastado ${Math.round(change)}% más en ${CATEGORY_NAMES[cat] || cat} que el mes pasado 📈`
        );
      } else if (change < -30) {
        insights.push(
          `Habéis reducido un ${Math.round(Math.abs(change))}% en ${CATEGORY_NAMES[cat] || cat} — ¡bien! 🎯`
        );
      }
    }
  }

  // 2. Desequilibrio prolongado
  if (balance && !balance.balanced && balance.amount > 50) {
    insights.push(`Lleváis acumulados ${formatEur(balance.amount)} sin equilibrar — ¿lo hacemos ya? ⚖️`);
  }

  // 3. Categoría dominante
  const topCat = Object.entries(currentByCat).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    const total = Object.values(currentByCat).reduce((a, b) => a + b, 0);
    const pct = Math.round((topCat[1] / total) * 100);
    if (pct > 40) {
      insights.push(
        `El ${pct}% de lo que gastáis juntos va en ${CATEGORY_NAMES[topCat[0]] || topCat[0]} 🔍`
      );
    }
  }

  // 4. Racha sin gastos
  if (currentMonth.length === 0) {
    insights.push("Aún no habéis registrado gastos este mes — ¡a por ello! ✨");
  }

  // 5. Frase motivacional si están equilibrados
  if (balance?.balanced) {
    insights.push("Estáis perfectamente equilibrados — sois un equipo 💪");
  }

  return insights.length > 0 ? insights : ["Todo en orden por aquí — seguid así 💕"];
}

/**
 * Genera la frase graciosa para el resumen viral mensual.
 * En producción, esto llamaría a la API de Claude para generar frases únicas.
 */
export function generateViralPhrase(expenses, partnerNames) {
  const byCat = groupByCategory(expenses);
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

  const phrases = {
    cena: [
      `${partnerNames[0]} cocina, ${partnerNames[1]} pide — el equilibrio perfecto 🍕`,
      "Vuestro restaurante favorito debería daros acciones 📈",
      "Si comer fuera fuese deporte, seríais olímpicos 🏅",
    ],
    casa: [
      "Adulting level: gastáis más en casa que en cenas 🏠",
      "El piso no se paga solo... pero casi 💸",
    ],
    viaje: [
      "Más kilómetros que un piloto de Ryanair ✈️",
      "Vuestra cuenta bancaria viaja más que vosotros 🗺️",
    ],
    capricho: [
      "Caprichos juntos = inversión emocional 🎁",
      "Uno no cuenta los caprichos cuando es amor 💝",
    ],
    super: [
      "Carrito lleno, corazón lleno 🛒",
      "El Mercadona os debería dar la tarjeta VIP 🏪",
    ],
  };

  const catPhrases = phrases[topCat?.[0]] || [
    "Sois el dúo perfecto de gastar 💸",
    "Amor es no mirar la cuenta del banco juntos 🫣",
  ];

  return catPhrases[Math.floor(Math.random() * catPhrases.length)];
}

// ─── Helpers ───

function groupByCategory(expenses) {
  const map = {};
  expenses.forEach((e) => {
    map[e.category] = (map[e.category] || 0) + e.amount;
  });
  return map;
}

function formatEur(n) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}
