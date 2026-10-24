# 🍸 BarPilot — Digital Command Center per Bar & Lounge

> **BarPilot (v1.0 MVP)** è la piattaforma SaaS B2B progettata specificamente per bar, caffè, cocktail bar, birrerie e lounge bar (mercato italiano e francese).
> Funziona come centro di comando operativo digitale per il personale di sala e bancone, affiancandosi in sinergia al Registratore Telematico (RT) senza richiedere certificazioni fiscali complesse.

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-orange?style=flat)](https://github.com/pmndrs/zustand)
[![i18n](https://img.shields.io/badge/i18n-IT%20%7C%20FR-emerald?style=flat)](https://next-intl-docs.vercel.app/)

---

## 🌟 Caratteristiche Principali

- **📱 Mobile POS & Presa Comande Rapida**: Interfaccia ottimizzata per smartphone dei camerieri, con selezione rapida tavoli/ospiti, suddivisione conto (*conti separati alla romana o per quota*), note per il bancone e invio immediato con vibrazione aptica.
- **🗺️ Plan de Salle / Mappa Tavoli Interattiva**: Visualizzazione in tempo reale di tavoli interni, terrazza, bancone e area VIP. Timer di occupazione, totale da saldare e generazione di codici QR per ciascun tavolo.
- **🍸 KDS Bancone (Kitchen Display System)**: Display retroilluminato ad alto contrasto per i barman, con raggruppamento comande, indicatore urgenza (*allerta fiamma > 6 min*), spunta singoli drink e sintetizzatore audio Web Audio API per segnali sonori.
- **📦 Inventario & Scarico Automatico Ricette**: Ogni volta che viene servito un cocktail o un caffè, la distinta base deduce automaticamente i grammi di caffè, i centilitri di spirits, latte o soft drink, segnalando gli ingredienti sotto la scorta minima.
- **🍷 Catalogo Prodotti & Fiche Tecniche**: Gestione prezzi in centesimi, disponibilità immediata (*Attivo* / *Esaurito*) e composizione ingredienti.
- **🚚 Fornitori & Buoni d'Acquisto**: Anagrafica fornitori principali (*Caffè Vergnano, Coca-Cola HBC, Campari Group, Metro Italia, Surgital*), con emissione guidata di ordini d'acquisto PDF.
- **👥 Gestione Personale & RBAC con PIN**: Ruoli dedicati (*Proprietario, Manager, Cameriere, Barman*) con sblocco rapido tramite PIN a 4 cifre per i tablet condivisi.
- **📊 Rapporti, Margini & Riconciliazione RT**: Analisi del fatturato giornaliero, scontrino medio, calcolo del food cost (margine lordo ~73,5%) e modulo di riconciliazione con il Registratore Telematico esterno per la chiusura di cassa giornaliera.
- **🌐 Bilingue Nativo (IT / FR)**: Supporto completo multilingua italiano e francese gestito tramite `next-intl`.

---

## 🏗️ Architettura Tecnica

```
barpilot/
├── src/
│   ├── app/
│   │   ├── [locale]/             # Pagine bilingue (IT / FR)
│   │   │   ├── dashboard/        # Dashboard direzionale + BarPilot AI Copilot
│   │   │   ├── orders/           # Mobile POS presa comande al tavolo
│   │   │   ├── tables/           # Plan de salle interattivo + QR Code
│   │   │   ├── kitchen/          # KDS schermo bancone barman
│   │   │   ├── products/         # Catalogo listino e ricettario
│   │   │   ├── inventory/        # Giacenze magazzino e movimenti
│   │   │   ├── suppliers/        # Fornitori e ordini d'acquisto
│   │   │   ├── staff/            # Gestione personale e matrice permessi RBAC
│   │   │   ├── reports/          # Rapporti vendite e riconciliazione RT
│   │   │   ├── menu/             # Menu digitale QR code per i clienti
│   │   │   └── onboarding/       # Setup guidato in 5 step
│   │   └── api/                  # Route handlers Next.js REST
│   ├── components/               # Componenti UI, Layout e Dashboard
│   ├── i18n/                     # Traduzioni complete IT/FR
│   ├── lib/
│   │   ├── store.ts              # Zustand Store con persistenza localStorage
│   │   ├── supabase/             # Client SSR e middleware Supabase
│   │   └── utils.ts              # Formattazione valuta centesimi e helper
│   └── types/database.ts         # Tipizzazione TypeScript (21 tabelle)
└── supabase/migrations/          # Schema SQL PostgreSQL con Row Level Security
```

---

## ⚖️ Conformità Fiscale & Modello Operativo

> [!NOTE]
> **BarPilot non produce scontrini fiscali e non trasmette direttamente corrispettivi all'Agenzia delle Entrate.**  
> Il sistema opera come **gestionale operativo e POS digitale**. Al momento del pagamento al tavolo, l'operatore rilascia il pre-conto gestionale e batte l'incasso sul Registratore Telematico certificato (Epson, Custom, RCH). Il modulo [Riconciliazione RT](file:///src/app/[locale]/reports/reconciliation/page.tsx) confronta l'incasso registrato su BarPilot con la chiusura Z dell'RT evidenziando eventuali scostamenti.

---

## 🚀 Avvio Rapido in Locale

### 1. Prerequisiti
- **Node.js** v20 o superiore
- **npm** o **pnpm**

### 2. Installazione delle dipendenze
```bash
npm install
```

### 3. Avvio del server di sviluppo
```bash
npm run dev -- -p 3005
```

L'applicazione sarà accessibile all'indirizzo:
- **Italiano**: [http://localhost:3005/it/dashboard](http://localhost:3005/it/dashboard)
- **Francese**: [http://localhost:3005/fr/dashboard](http://localhost:3005/fr/dashboard)

### 4. Build di Produzione
```bash
npm run build
npm run start -- -p 3005
```

---

## 📄 Licenza

Distribuito sotto licenza proprietaria SaaS per **BarPilot**.  
Sviluppato con dedizione per i professionisti del settore Horeca & Bar.
