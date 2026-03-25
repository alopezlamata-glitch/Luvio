# 💕 Luvio — Gastos en pareja (iOS)

> Alternativa a Tricount/Splitwise enfocada 100% en parejas, con insights emocionales y resumen viral.

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS + Framer Motion
- **Native iOS**: Capacitor 6 (haptics, share sheet, push, deep links)
- **Auth**: Firebase Auth (Google + Sign in with Apple)
- **Database**: Firebase Realtime Database (serverless)
- **Pagos**: StoreKit 2 (obligatorio para App Store)
- **Push**: APNs via Firebase Cloud Messaging

## Quick Start

```bash
npm install
cp .env.example .env       # Rellena credenciales Firebase
npm run dev                 # Dev web (iterar rápido)

npx cap add ios             # Solo la primera vez
npm run build && npx cap sync ios
npx cap open ios            # Abre Xcode → Run
```

## Estructura (39 archivos)

```
src/
├── config/firebase.js             # Firebase init
├── context/AuthContext.jsx         # Google + Apple Sign In + gestión pareja
├── hooks/
│   ├── useExpenses.js             # CRUD gastos real-time + límite free
│   ├── useGoals.js                # Metas compartidas
│   ├── usePushNotifications.js    # APNs + handlers
│   └── useSubscription.js         # StoreKit 2 in-app purchase
├── utils/
│   ├── native.js                  # Haptics, share sheet, status bar, deep links
│   └── insights.js                # Generador de insights
├── components/
│   ├── auth/ (Login, JoinCouple)
│   ├── dashboard/ (Dashboard, BalanceCard)
│   ├── expenses/ (AddExpense, ExpenseList)
│   ├── goals/ (GoalsScreen, GoalsPreview)
│   ├── viral/ (ViralCard + iOS share sheet)
│   ├── settings/ (Settings)
│   └── shared/ (InsightTicker, Paywall, NotificationPrompt)
functions/
├── index.js                       # Stripe (web fallback)
└── notifications.js               # Push: gastos, balance, resumen mensual
```

## iOS Setup completo → `IOS_SETUP.md`

Guía paso a paso: Xcode, Apple Sign In, APNs, StoreKit, iconos, TestFlight, App Store submission.
