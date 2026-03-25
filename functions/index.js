/**
 * Cloud Function: Crear Stripe Checkout Session
 *
 * Deploy: cd functions && npm install && firebase deploy --only functions
 *
 * Requiere:
 *   firebase functions:secrets:set STRIPE_SECRET_KEY
 *   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();

const stripeSecret = defineSecret("STRIPE_SECRET_KEY");
const webhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// ─── Crear Checkout Session ───
exports.createCheckoutSession = onRequest(
  { secrets: [stripeSecret], cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");

    const stripe = require("stripe")(stripeSecret.value());
    const { coupleId, priceId, userId } = req.body;

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${req.headers.origin}/?premium=success`,
        cancel_url: `${req.headers.origin}/?premium=cancel`,
        metadata: { coupleId, userId },
        allow_promotion_codes: true,
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
      console.error("Stripe error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── Webhook: Stripe → Firebase ───
exports.stripeWebhook = onRequest(
  { secrets: [stripeSecret, webhookSecret] },
  async (req, res) => {
    const stripe = require("stripe")(stripeSecret.value());

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers["stripe-signature"],
        webhookSecret.value()
      );
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const db = admin.database();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { coupleId } = session.metadata;
        if (coupleId) {
          await db.ref(`couples/${coupleId}/subscription`).update({
            plan: "premium",
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            activatedAt: Date.now(),
            limit: Infinity,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        // Find couple by subscription ID and downgrade
        const snapshot = await db.ref("couples").orderByChild("subscription/stripeSubscriptionId")
          .equalTo(subscription.id).once("value");
        if (snapshot.exists()) {
          const coupleId = Object.keys(snapshot.val())[0];
          await db.ref(`couples/${coupleId}/subscription`).update({
            plan: "free",
            limit: 20,
            cancelledAt: Date.now(),
          });
        }
        break;
      }
    }

    res.json({ received: true });
  }
);
