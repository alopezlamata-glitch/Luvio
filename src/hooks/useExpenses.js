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
  const { coupleId, user } = useAuth();
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
  async function addExpense({ amount, category, paidBy, description }) {
    if (!coupleId || !user) throw new Error("No hay pareja vinculada");

    // Verificar límite free
    const subSnap = await get(ref(db, `couples/${coupleId}/subscription`));
    const sub = subSnap.val() || { plan: "free", limit: 20 };

    if (sub.plan === "free" && monthlyCount >= sub.limit) {
      throw new Error("PAYWALL");
    }

    const expenseData = {
      amount: parseFloat(amount),
      category,
      paidBy, // uid del que pagó
      description: description || "",
      date: new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
      createdBy: user.uid,
    };

    await push(ref(db, `couples/${coupleId}/expenses`), expenseData);

    // Incrementar contador
    await update(ref(db, `couples/${coupleId}/subscription`), {
      expenseCount: monthlyCount + 1,
    });
  }

  // Calcular balance entre los dos
  function getBalance() {
    const totals = {};
    expenses.forEach((e) => {
      totals[e.paidBy] = (totals[e.paidBy] || 0) + e.amount;
    });
    const uids = Object.keys(totals);
    if (uids.length < 2) return { diff: 0, totals, balanced: true };

    const diff = (totals[uids[0]] || 0) - (totals[uids[1]] || 0);
    return {
      diff,
      totals,
      balanced: Math.abs(diff) < 0.01,
      owes: diff > 0 ? uids[1] : uids[0],
      owed: diff > 0 ? uids[0] : uids[1],
      amount: Math.abs(diff / 2),
    };
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
    getBalance,
    getMonthlyExpenses,
    getByCategory,
    isPremium: false, // TODO: Stripe check
    freeLimit: 20,
  };
}
