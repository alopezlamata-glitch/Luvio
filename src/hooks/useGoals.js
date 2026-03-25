import { useState, useEffect } from "react";
import { ref, push, onValue, update, remove } from "firebase/database";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

export function useGoals() {
  const { coupleId } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) return;

    const goalsRef = ref(db, `couples/${coupleId}/goals`);
    const unsub = onValue(goalsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setGoals(list);
      } else {
        setGoals([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [coupleId]);

  async function addGoal({ name, target, emoji = "🎯" }) {
    if (!coupleId) return;
    await push(ref(db, `couples/${coupleId}/goals`), {
      name,
      target: parseFloat(target),
      saved: 0,
      emoji,
      createdAt: Date.now(),
    });
  }

  async function updateSaved(goalId, amount) {
    if (!coupleId) return;
    await update(ref(db, `couples/${coupleId}/goals/${goalId}`), {
      saved: parseFloat(amount),
    });
  }

  async function deleteGoal(goalId) {
    if (!coupleId) return;
    await remove(ref(db, `couples/${coupleId}/goals/${goalId}`));
  }

  return { goals, loading, addGoal, updateSaved, deleteGoal };
}
