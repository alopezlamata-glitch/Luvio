import { useState, useEffect } from "react";
import { ref, push, onValue, query, orderByChild, limitToLast, get, update } from "firebase/database";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

/**
 * Hook para gestionar gastos en tiempo real.
 * - Escucha cambios en Firebase Realtime DB
 * - Controla el límite de 20 gastos/mes para plan free
 * - Calcula balance automáticamente
 */
export function useExpenses() {
  const { coupleId, user, partner } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyCount, setMonthlyCount] = useState(0);

  // Suscripción en tiempo real a gastos
  useEffect(() => {
    if (!coupleId) return;

    const expensesRef = query(
      ref(db, `couples/${coupleId}/expenses`),
      orderByChild("date"),
      limitToLast(100)
    );

    const unsub = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setExpenses(list);

        // Contar gastos del mes actual
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const count = list.filter((e) => e.date.startsWith(thisMonth)).length;
        setMonthlyCount(count);
      } else {
        setExpenses([]);
        setMonthlyCount(0);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [coupleId]);

  // Añadir gasto — máximo 3 clicks
  async function addExpense({ amount, amountEUR, category, paidBy, currency, split, description }) {
    if (!coupleId || !user) throw new Error("No hay pareja vinculada");

    // Verificar límite free
    const subSnap = await get(ref(db, `couples/${coupleId}/subscription`));
    const sub = subSnap.val() || { plan: "free", limit: 20 };

    if (sub.plan === "free" && monthlyCount >= sub.limit) {
      throw new Error("PAYWALL");
    }

    const expenseData = {
      amount:    parseFloat(amount),
      amountEUR: parseFloat(amountEUR ?? amount),
      currency:  currency || "EUR",
      category,
      paidBy,
      split:       split || { type: "equal" },
      description: description || "",
      date: new Date().toISOString().slice(0, 10),
    };

    await push(ref(db, `couples/${coupleId}/expenses`), expenseData);

    // Incrementar contador
    await update(ref(db, `couples/${coupleId}/subscription`), {
      expenseCount: monthlyCount + 1,
    });
  }

  // Calcular balance entre los dos respetando splits
  function getBalance() {
    const myUid      = user?.uid;
    const partnerUid = partner?.uid;

    let myPaid = 0, partnerPaid = 0;
    let myShouldPay = 0, partnerShouldPay = 0;
    // settleNet: cuánto he "pagado" neto en liquidaciones
    // +X = yo pagué X en liquidaciones (reduzco mi deuda)
    // -X = la pareja pagó X (aumenta mi deuda relativa)
    let settleNet = 0;

    expenses.forEach((e) => {
      const amt = e.amountEUR ?? e.amount ?? 0;

      // Liquidaciones: se contabilizan aparte para que
      // myPaid/partnerPaid nunca sean negativos.
      // Se almacenan como amount*2 → half = deuda real saldada
      if (e.settlement) {
        const half = amt / 2;
        if (e.paidBy === myUid)           settleNet += half;
        else if (e.paidBy === partnerUid) settleNet -= half;
        return;
      }

      if (e.paidBy === myUid)           myPaid      += amt;
      else if (e.paidBy === partnerUid) partnerPaid += amt;

      const splitType = e.split?.type || "equal";
      if (splitType === "payer") {
        if (e.paidBy === myUid)           myShouldPay      += amt;
        else if (e.paidBy === partnerUid) partnerShouldPay += amt;
      } else if (splitType === "custom" && e.split?.shares && myUid && partnerUid) {
        myShouldPay      += amt * (e.split.shares[myUid]      ?? 0.5);
        partnerShouldPay += amt * (e.split.shares[partnerUid] ?? 0.5);
      } else {
        myShouldPay      += amt / 2;
        partnerShouldPay += amt / 2;
      }
    });

    if (myPaid + partnerPaid === 0 && settleNet === 0)
      return { balanced: true, amount: 0, myTotal: 0, partnerTotal: 0 };

    // myNet > 0: yo pagué más de lo que debería → partner me debe
    const myNet = (myPaid - myShouldPay) + settleNet;

    return {
      balanced:     Math.abs(myNet) < 0.01,
      owes:         myNet > 0 ? "partner" : "you",
      amount:       Math.abs(myNet),
      myTotal:      myPaid,
      partnerTotal: partnerPaid,
    };
  }

  // Registrar liquidación — anota un pago que equilibra el balance
  async function settleBalance({ amount, paidBy }) {
    if (!coupleId || !user) throw new Error("No hay pareja vinculada");
    await push(ref(db, `couples/${coupleId}/expenses`), {
      amount:      parseFloat(amount),
      amountEUR:   parseFloat(amount),
      currency:    "EUR",
      category:    "otro",
      paidBy,
      split:       { type: "equal" },
      description: "Liquidación de deuda",
      date:        new Date().toISOString().slice(0, 10),
      settlement:  true,
    });
  }

  // Gastos del mes actual
  function getMonthlyExpenses() {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return expenses.filter((e) => e.date.startsWith(thisMonth));
  }

  // Gastos por categoría (para insights)
  function getByCategory() {
    const map = {};
    getMonthlyExpenses().forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([category, total]) => ({ category, total }));
  }

  return {
    expenses,
    loading,
    monthlyCount,
    addExpense,
    settleBalance,
    getBalance,
    getMonthlyExpenses,
    getByCategory,
    isPremium: false, // TODO: Stripe check
    freeLimit: 20,
  };
}
