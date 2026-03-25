/**
 * Cloud Function: Push Notifications
 *
 * Envía notificaciones cuando:
 * 1. Tu pareja añade un gasto
 * 2. Resumen mensual disponible (cron)
 * 3. Recordatorio de equilibrar balance
 * 4. Tu pareja se ha unido
 */

const { onValueCreated } = require("firebase-functions/v2/database");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

// Asumimos que admin ya está inicializado en index.js
// Si este archivo es separado: admin.initializeApp();

const db = admin.database();
const messaging = admin.messaging();

// ─── 1. Notificar cuando la pareja añade un gasto ───
exports.onNewExpense = onValueCreated(
  { ref: "/couples/{coupleId}/expenses/{expenseId}", region: "europe-west1" },
  async (event) => {
    const expense = event.data.val();
    const { coupleId } = event.params;

    // Obtener miembros de la pareja
    const membersSnap = await db.ref(`couples/${coupleId}/members`).once("value");
    const members = membersSnap.val();
    if (!members) return;

    // Encontrar al otro miembro (el que NO creó el gasto)
    const partnerUid = Object.keys(members).find(
      (uid) => uid !== expense.createdBy
    );
    if (!partnerUid) return;

    // Obtener token del partner
    const tokenSnap = await db.ref(`pushTokens/${partnerUid}/token`).once("value");
    const token = tokenSnap.val();
    if (!token) return;

    const payerName = members[expense.paidBy]?.name?.split(" ")[0] || "Tu pareja";
    const amount = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(expense.amount);

    const categoryEmojis = {
      cena: "🍽️", casa: "🏠", viaje: "✈️",
      capricho: "🎁", super: "🛒", otro: "📎",
    };
    const emoji = categoryEmojis[expense.category] || "💰";

    try {
      await messaging.send({
        token,
        notification: {
          title: `${emoji} ${payerName} ha pagado ${amount}`,
          body: expense.description || expense.category,
        },
        data: {
          type: "new_expense",
          coupleId,
          expenseId: event.params.expenseId,
        },
        apns: {
          headers: { "apns-priority": "10" },
          payload: {
            aps: {
              badge: 1,
              sound: "default",
              "thread-id": coupleId,
              "interruption-level": "active",
            },
          },
        },
      });
    } catch (err) {
      // Token inválido → limpiar
      if (
        err.code === "messaging/invalid-registration-token" ||
        err.code === "messaging/registration-token-not-registered"
      ) {
        await db.ref(`pushTokens/${partnerUid}`).remove();
      }
      console.error("Error sending push:", err);
    }
  }
);

// ─── 2. Recordatorio semanal de equilibrar balance ───
exports.balanceReminder = onSchedule(
  { schedule: "every monday 10:00", timeZone: "Europe/Madrid", region: "europe-west1" },
  async () => {
    const couplesSnap = await db.ref("couples").once("value");
    const couples = couplesSnap.val();
    if (!couples) return;

    for (const [coupleId, couple] of Object.entries(couples)) {
      if (!couple.expenses || !couple.members) continue;

      // Calcular balance
      const totals = {};
      Object.values(couple.expenses).forEach((e) => {
        totals[e.paidBy] = (totals[e.paidBy] || 0) + e.amount;
      });

      const uids = Object.keys(totals);
      if (uids.length < 2) continue;

      const diff = Math.abs(totals[uids[0]] - totals[uids[1]]) / 2;
      if (diff < 20) continue; // Solo si hay más de 20€ de desequilibrio

      const amount = new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
      }).format(diff);

      // Enviar a ambos miembros
      for (const uid of Object.keys(couple.members)) {
        const tokenSnap = await db.ref(`pushTokens/${uid}/token`).once("value");
        const token = tokenSnap.val();
        if (!token) continue;

        try {
          await messaging.send({
            token,
            notification: {
              title: "⚖️ ¿Equilibramos?",
              body: `Tenéis ${amount} pendientes de equilibrar`,
            },
            data: {
              type: "balance_reminder",
              coupleId,
            },
            apns: {
              payload: {
                aps: {
                  badge: 1,
                  sound: "default",
                  "thread-id": coupleId,
                },
              },
            },
          });
        } catch {}
      }
    }
  }
);

// ─── 3. Resumen mensual disponible (1 de cada mes) ───
exports.monthlySummary = onSchedule(
  { schedule: "1 of month 09:00", timeZone: "Europe/Madrid", region: "europe-west1" },
  async () => {
    const couplesSnap = await db.ref("couples").once("value");
    const couples = couplesSnap.val();
    if (!couples) return;

    for (const [coupleId, couple] of Object.entries(couples)) {
      if (!couple.members) continue;

      // Solo premium tienen resumen viral
      if (couple.subscription?.plan !== "premium") continue;

      for (const uid of Object.keys(couple.members)) {
        const tokenSnap = await db.ref(`pushTokens/${uid}/token`).once("value");
        const token = tokenSnap.val();
        if (!token) continue;

        try {
          await messaging.send({
            token,
            notification: {
              title: "📸 Vuestro resumen mensual está listo",
              body: "Descubrid cuánto habéis gastado juntos y compartidlo",
            },
            data: {
              type: "monthly_summary",
              coupleId,
            },
            apns: {
              payload: {
                aps: {
                  badge: 1,
                  sound: "default",
                  "thread-id": coupleId,
                },
              },
            },
          });
        } catch {}
      }
    }
  }
);

// ─── 4. Notificar cuando la pareja se une ───
exports.onPartnerJoined = onValueCreated(
  { ref: "/couples/{coupleId}/members/{userId}", region: "europe-west1" },
  async (event) => {
    const newMember = event.data.val();
    const { coupleId, userId } = event.params;

    // Obtener todos los miembros
    const membersSnap = await db.ref(`couples/${coupleId}/members`).once("value");
    const members = membersSnap.val();
    if (!members || Object.keys(members).length < 2) return;

    // Notificar al miembro original
    const originalUid = Object.keys(members).find((uid) => uid !== userId);
    if (!originalUid) return;

    const tokenSnap = await db.ref(`pushTokens/${originalUid}/token`).once("value");
    const token = tokenSnap.val();
    if (!token) return;

    const partnerName = newMember.name?.split(" ")[0] || "Tu pareja";

    try {
      await messaging.send({
        token,
        notification: {
          title: "💕 ¡Ya estáis conectados!",
          body: `${partnerName} se ha unido a Luvio`,
        },
        data: {
          type: "partner_joined",
          coupleId,
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: "default",
            },
          },
        },
      });
    } catch {}
  }
);
