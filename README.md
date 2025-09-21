# Cost Tracker

Gestione delle spese e delle entrate con Vue 3, Vite e Firebase.

## Funzionalità

- Aggiunta, visualizzazione e cancellazione di transazioni (spese/entrate)
- Salvataggio dati su Firebase Firestore
- Categorie dinamiche lette da Firestore
- Interfaccia responsive e moderna
- Sicurezza: configurazione Firebase tramite file `.env` (non pubblicato su GitHub)

## Requisiti

- Node.js >= 16
- npm >= 8

## Installazione

```bash
git clone https://github.com/valentinomettifogo/cost-tracker.git
cd cost-tracker
npm install
```

## Configurazione Firebase

1. Crea un file `.env` nella root del progetto:
    ```
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    VITE_FIREBASE_STORAGE_BUCKET=...
    VITE_FIREBASE_MESSAGING_SENDER_ID=...
    VITE_FIREBASE_APP_ID=...
    ```
2. Inserisci le tue chiavi Firebase (le trovi nella console Firebase).

## Avvio in locale

```bash
npm run dev
```

## Build produzione

```bash
npm run build
```

## Struttura principale

- `src/components/TransactionForm.vue` — Form per aggiungere transazioni
- `src/components/DataTable.vue` — Tabella delle transazioni
- `src/firebase.js` — Configurazione Firebase
- `.env` — Variabili ambiente (non pubblicato)

## Note

- Il file `.env` è escluso dal repository tramite `.gitignore`.
- Per modificare le categorie, aggiorna il documento `category` nella collection `config` su Firestore.
