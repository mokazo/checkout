# Product Requirements Document (PRD)
## SaaS Checkout Platform (Multi-Merchant)

**Version :** 2.0 (Architecture Firebase)  
**Date :** 28 Janvier 2026  
**Statut :** MVP Ready  

---

## 1. Vue d'ensemble (Overview)

### 1.1 Vision
Une plateforme SaaS "clé en main" permettant aux marchands (influenceurs, boutiques physiques, e-commerçants) de créer instantanément un tunnel de vente (Checkout) performant, hébergé sur un sous-domaine dédié. La solution se distingue par sa légèreté, son orientation "Live Shopping" (montant libre ou produit unique) et son intégration native des points relais français.

### 1.2 Problématique
Les solutions CMS classiques (Shopify, PrestaShop) sont trop lourdes pour des ventes flash, nécessitent une configuration complexe des transporteurs et n'offrent pas toujours un flux de paiement optimisé pour le mobile en moins de 3 clics.

### 1.3 Solution
Une application Single Page (SPA) React offrant :
1.  **Côté Marchand :** Un dashboard minimaliste pour configurer Stripe, Chronopost/Mondial Relay et suivre les commandes.
2.  **Côté Acheteur :** Une interface de paiement ultra-rapide (Checkout) avec géolocalisation des points relais et paiement intégré.

---

## 2. Architecture Technique (Firebase Stack)

Le projet repose sur une architecture **Serverless** pour maximiser la scalabilité et minimiser les coûts de maintenance.

### 2.1 Stack
*   **Frontend :** React 19, TypeScript, Tailwind CSS.
*   **Authentification :** Firebase Auth (Email/Password).
*   **Base de données :** Cloud Firestore (NoSQL).
*   **Backend Logic :** Firebase Cloud Functions (Node.js).
*   **Paiement :** Stripe Elements (React) + Stripe API.
*   **Cartographie :** API Gouv (Villes) + APIs Transporteurs (Points Relais).

### 2.2 Sécurité & Flux de Données
*   **Client (React) :** Ne stocke aucune donnée sensible. Utilise les clés publiques (Stripe Public Key, Firebase Config).
*   **Serveur (Cloud Functions) :** Agit comme un proxy sécurisé pour :
    *   Stocker les clés secrètes (Stripe Secret Key, Mots de passe Chronopost/Mondial Relay).
    *   Effectuer les requêtes SOAP (XML) vers les transporteurs (contournement des problèmes CORS des navigateurs).
    *   Générer les `PaymentIntents` Stripe.

---

## 3. Modèle de Données (Firestore Schema)

L'architecture est centrée sur le document `merchant` pour faciliter le cloisonnement des données (Multi-tenancy).

### Collection `merchants`
Document racine représentant un client SaaS.
*   `id` (PK - UID Firebase Auth)
*   `email` (string)
*   `companyName` (string)
*   `subdomain` (string, indexé unique) - ex: "maboutique"
*   `logoUrl` (string)
*   `themeColorPrimary` (hex)
*   `stripePublishableKey` (string)
*   `stripeSecretKey` (string, **stocké uniquement si chiffré ou via Secret Manager**, sinon géré via Cloud Functions env vars)
*   `shippingMethods` (Array of objects: id, name, price, isActive)
*   `chronopostConfig` (Object: enabled, accountNumber, password)
*   `mondialRelayConfig` (Object: enabled, enseigne, privateKey)
*   `createdAt` (Timestamp)

### Sous-collection `merchants/{merchantId}/products`
Catalogue produits du marchand.
*   `id` (Auto-ID)
*   `name` (string)
*   `description` (string)
*   `price` (number)
*   `imageUrl` (string)
*   `stock` (number)
*   `isActive` (boolean)

### Sous-collection `merchants/{merchantId}/orders`
Historique des commandes.
*   `id` (Auto-ID)
*   `orderNumber` (string) - ex: "ORD-123456"
*   `amount` (number) - Montant produit
*   `shippingCost` (number)
*   `totalAmount` (number)
*   `customer` (Object: email, phone, firstName, lastName)
*   `shippingAddress` (Object: address, city, zip, country, relayId?)
*   `shippingMethodId` (string)
*   `paymentStatus` (enum: PENDING, PAID, FAILED)
*   `stripePaymentIntentId` (string)
*   `createdAt` (Timestamp)

---

## 4. Spécifications Fonctionnelles Détaillées

### 4.1 Module Authentification & Onboarding
*   **Inscription :** Création compte Firebase Auth.
*   **Configuration Initiale :**
    *   Le marchand doit choisir un nom de boutique.
    *   Le système génère et valide l'unicité du sous-domaine (ex: `client.app.com`).
    *   Création du document Firestore initial.

### 4.2 Module Dashboard (Marchand)
*   **Vue Commandes :** Tableau triable, KPI (Chiffre d'affaires, Panier moyen).
*   **Vue Produits :** CRUD complet. Upload d'image (via URL pour le MVP, via Firebase Storage en V2).
*   **Vue Paramètres :**
    *   **Branding :** Upload logo, choix couleur (Color Picker).
    *   **Transport :** Activation/Désactivation des modes. Saisie des identifiants API Chronopost/MR.
    *   **Test Connexion :** Bouton pour vérifier les identifiants SOAP via Cloud Function.

### 4.3 Module Checkout (Acheteur)
Le cœur du produit. Accessible via `sous-domaine.app.com`.

**Étape 1 : Le Panier / Montant**
*   Affichage du Logo et Branding marchand.
*   **Mode Produit :** Affichage photo, description, prix fixe.
*   **Mode Live (Montant Libre) :** Champ input numérique pour que l'acheteur saisisse le montant annoncé en live.

**Étape 2 : Livraison & Coordonnées**
*   **Formulaire Client :** Email, Tel, Nom.
*   **Adresse Intelligente :**
    *   Saisie Code Postal -> Appel API `geo.api.gouv.fr` -> Dropdown Villes.
*   **Choix Transporteur :**
    *   Si "Domicile" : Affichage champ Adresse.
    *   Si "Point Relais" (Chronopost/Mondial Relay) :
        1.  Appel Cloud Function `searchRelayPoints(zipCode)`.
        2.  La Cloud Function interroge le SOAP du transporteur.
        3.  Affichage de la liste des points (Nom + Adresse).
        4.  Sélection obligatoire d'un point pour continuer.

**Étape 3 : Paiement**
*   Récapitulatif total (Produit + Frais de port).
*   **Stripe Elements :** Affichage sécurisé du formulaire CB.
*   **Validation :**
    1.  Appel Backend pour créer `PaymentIntent`.
    2.  Confirmation côté client.
    3.  Redirection vers page de succès.

---

## 5. Détails des Intégrations API

### 5.1 Chronopost (SOAP)
*   **Service :** `PointRelaisServiceWS`.
*   **Méthode :** `recherchePointChronopostInter`.
*   **Paramètres clés :** `accountNumber`, `password` (ne doivent pas transiter en clair côté front), `codePostal`.
*   **Données retournées :** ID Point, Nom, Adresse, Ville, Horaires.

### 5.2 Mondial Relay (SOAP)
*   **Service :** Web Service Dual.
*   **Méthode :** `WSI4_PointRelais_Recherche`.
*   **Sécurité :** Signature MD5 requise (`Enseigne` + `Pays` + `CP` + `CléPrivée`).
*   **Implémentation :** La génération du MD5 **doit** se faire dans la Cloud Function pour ne jamais exposer la Clé Privée.

### 5.3 Stripe
*   **Mode :** PaymentIntents API.
*   **Flux :**
    1.  Front: Collecte info carte -> `stripe.createPaymentMethod`.
    2.  Back (Cloud Function): `stripe.paymentIntents.create({ amount, currency, payment_method, confirm: true })`.
    3.  Webhook (Optionnel V1): Écoute `payment_intent.succeeded` pour mettre à jour le statut `PAID` dans Firestore.

---

## 6. Roadmap & Améliorations Futures

1.  **Génération d'étiquettes (Q2 2026) :**
    *   Générer le PDF de l'étiquette d'expédition (Chronopost/MR) dès le paiement validé.
2.  **Emails Transactionnels :**
    *   Envoi email confirmation commande via SendGrid ou Firebase Trigger Email.
3.  **Panier Multi-produits :**
    *   Permettre d'ajouter plusieurs items au panier (actuellement Mono-produit).
4.  **Apple Pay / Google Pay :**
    *   Activation via Stripe Request Payment Button.
