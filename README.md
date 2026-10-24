# BarPilot 🍸
### *Il tuo bar. Il tuo controllo. La tua crescita.*
### *Votre bar. Votre contrôle. Votre croissance.*

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployment%20Ready-black?logo=vercel)](https://vercel.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Realtime-3ECF8E?logo=supabase)](https://supabase.com)
[![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?logo=php)](https://php.net)
[![PWA](https://img.shields.io/badge/PWA-Installable%20Mobile%20App-FF7A00)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

**BarPilot** est la plateforme SaaS mobile & web tout-en-un de gestion intelligente conçue pour les bars, cafés, brasseries, pubs et lounges.

---

## 📸 Design UX/UI fidèle à la maquette
L'interface a été conçue d'après la charte officielle BarPilot (orange ambré `#FF7A00`, fond sombre profond `#0B0E13` et mode clair épuré `#F4F6F9`) :
- **Tableau de bord propriétaire** : Chiffre d'affaires (1.248 €), Commandes (186), Ticket moyen (6,71 €), Alertes stocks (4), graphique horaire des ventes (08h-22h) et répartition en donut par catégorie.
- **Prise de commandes mobile ("Nuova comanda")** : Sélecteur de table, filtres de catégories tactiles (Caffè, Bevande, Cocktail, Cibo, Snack), grille de produits avec photos et prix, pad d'addition avec boutons stepper `+ / -` et validation d'envoi.
- **Plan de salle interactif ("Plan de salle")** : Vue de salle complète avec tables `T01` à `T09`, statuts colorés (*Libre*, *Occupée*, *À payer*, *Réservée*), durées d'occupation et montants en temps réel.
- **Écran de préparation Barman (KDS Comptoir)** : Tickets de commandes en temps réel avec minuteries, articles et passage d'états (*Da preparare* ➔ *In preparazione* ➔ *Pronta* ➔ *Servita*).
- **Inventaire intelligent & Recettes** : Déduction automatique des stocks théoriques (café, lait, bières, rhums) à chaque préparation selon les recettes cocktails.
- **Fournisseurs, Personnel & Rapports** : Gestion des tiers (Caffè Vergnano, Campari, etc.), rôles des employés (Propriétaire, Manager, Serveur, Barman) et courbes de rentabilité.

---

## 🌟 Fonctionnalités Clés & Multi-Tenant
1. **Connexion par Bar (Multi-bar login)** :
   - Chaque établissement accède à son propre espace sécurisé (Bar Centrale, Milano Lounge, etc.).
   - Modale d'authentification rapide par email ou code PIN serveur.
2. **Période d'essai de 14 jours** :
   - Compte à rebours dynamique dans la barre supérieure (*"Periodo di prova: 14 giorni rimasti"*).
   - Accès complet aux fonctionnalités de l'offre Pro pendant la phase d'essai.
3. **3 Offres d'Abonnement SaaS** :
   - **Starter (29 € / mois / bar)** : Commandes, tables, catalogue et statistiques de base.
   - **Pro (59 € / mois / bar - Recommandé)** : Starter + stocks intelligents, recettes cocktail, fournisseurs, menu QR code et écran Barman (KDS).
   - **Premium (99 € / mois / bar)** : Pro + BarPilot IA conversationnelle, prévisions, gestion multi-sites et automatisations.
   - **Simulateur de revenus interactif** : calcul direct du MRR / ARR (ex: 100 bars = 5.900 € / mois = 70.800 € / an).
4. **Bilingue Italien (IT) & Français (FR)** :
   - Bascule instantanée de la langue de l'interface en 1 clic sans rechargement.
5. **Mode Sombre (Dark) & Mode Clair (Light)** :
   - Confort visuel optimal de jour comme lors du service de nuit au comptoir.

---

## 🛠️ Architecture Technique
```
barpilot/
├── index.html                   # Application PWA complète et responsive
├── manifest.json                # Manifeste PWA pour installation smartphone/tablette
├── service-worker.js            # Cache hors-ligne et fonctionnement continu
├── assets/
│   ├── css/
│   │   └── style.css            # Styles UI/UX, thèmes Dark/Light, grille responsive
│   ├── js/
│   │   ├── app.js               # Logique d'application, panier, KDS, plan de salle
│   │   ├── data.js              # Base locale et stockage persistant
│   │   ├── i18n.js              # Système bilingue IT / FR
│   │   └── supabaseClient.js    # Client Supabase PostgreSQL & Realtime
│   └── images/
│       ├── logo.png             # Logo officiel BarPilot
│       └── design_reference.jpg # Référence de la maquette originale
├── api/                         # Backend PHP prêt pour hébergement LAMP / XAMPP / Docker
│   ├── db.php                   # Connexion PDO multi-base (PostgreSQL/MySQL/SQLite)
│   ├── auth.php                 # Authentification multi-établissements
│   ├── orders.php               # Gestion et cycle de vie des commandes
│   ├── inventory.php            # Déductions de stocks
│   └── subscriptions.php        # Gestion des offres et essai de 14 jours
├── sql/
│   ├── schema.sql               # Schéma PostgreSQL complet multi-tenant avec RLS
│   └── seed.sql                 # Données de démonstration prêtes à l'emploi
├── vercel.json                  # Configuration de déploiement instantané Vercel
├── .github/workflows/deploy.yml # CI/CD automatique GitHub Actions vers Vercel
└── package.json                 # Scripts de démarrage et configuration Node.js
```

---

## 🚀 Démarrage Rapide

### 1. Aperçu local avec Node.js
```bash
# Dans le dossier barpilot
npx serve -l 3000 .
# Ouvrez votre navigateur sur http://localhost:3000
```

### 2. Déploiement en 1 clic sur Vercel
1. Installez le CLI Vercel si besoin : `npm i -g vercel`
2. Dans le dossier `barpilot`, lancez :
   ```bash
   vercel
   ```
3. L'application est instantanément accessible en ligne sous une URL HTTPS avec PWA active !

### 3. Connexion à Supabase (PostgreSQL & Realtime)
1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans l'éditeur SQL de Supabase, copiez et exécutez `sql/schema.sql`, puis `sql/seed.sql`.
3. Indiquez votre URL Supabase et clé publique anon dans `assets/js/supabaseClient.js`.

### 4. Utilisation avec PHP (Apache / XAMPP)
Placez le dossier dans `htdocs` ou votre racine web Apache/Nginx. Les endpoints de l'API sont prêts sous `/api/orders.php`, `/api/auth.php`, etc.

---

## 📄 Licence
Ce projet est développé sous licence **MIT**.
