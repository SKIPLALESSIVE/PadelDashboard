# PadelTrack 🎾

Suivi personnel de padel pour les années civiles **2026 et 2027** (extensible) : calendrier,
tournois FFT (P25 → P3000), **points FFT calculés automatiquement** d'après les barèmes officiels,
partenaires, placement droite/gauche, budget et simulation de classement.

Application **100 % statique** (React + TypeScript + Vite), **sans backend**, hébergeable gratuitement
sur **GitHub Pages**. Toutes vos données restent **sur votre appareil** (IndexedDB) et se sauvegardent
via des exports JSON / CSV / ICS.

## Prérequis

- **Node.js 22** (même version que la CI et l'image Docker) et npm.
- Rien d'autre : aucun serveur, aucune clé API, aucun compte à créer.

## Démarrage

```bash
npm ci             # ou npm install
npm run dev        # développement local (http://localhost:5173)
npm run test       # tests Vitest : moteur FFT, classement glissant, finances, exports, calendrier
npm run build      # vérification TypeScript + build statique dans dist/
npm run preview    # prévisualise le build de production
```

## Ce que l'app fait

- **Calendrier 2026–2027** : navigation mensuelle, un clic sur un jour → disponibilité / tournoi /
  événement (entraînement, cours, stage, match amical…). Les jours **indisponibles avec un tournoi
  planifié** sont signalés comme conflit.
- **Tournois** : création express (date, catégorie, club, partenaire, prix d'inscription, statut) puis
  détails optionnels (épreuve, position droite/gauche, nombre de paires, place finale, résultats).
- **Points FFT instantanés** : dès que catégorie + paires + place sont connues, les points s'affichent
  (recalcul en direct, aucun bouton « Calculer »). Le barème appliqué, sa saison et sa source sont
  affichés. Un **override manuel** (avec motif) est possible pour les cas exceptionnels, en conservant
  la valeur calculée.
- **Classement glissant** : les 12 meilleurs résultats sur les 12 derniers mois, avec suivi des
  **expirations** (< 60 jours). Le rang national officiel doit être **saisi manuellement** (ex. Ten'Up) :
  l'app compare sa somme locale calculée au rang officiel et explique les écarts, sans jamais prétendre
  déduire le rang à elle seule.
- **Partenaires** : favoris, classement connu (daté), côté habituel ; statistiques par partenaire et par
  côté avec **place normalisée** (place / nb paires) et **nombre d'observations** affiché (échantillons
  faibles explicitement signalés). Tournois annulés et places inconnues exclus des moyennes.
- **Finances** : montants en **centimes entiers** ; le prévu et le payé ne sont **jamais additionnés
  deux fois** ; un prix saisi dans un tournoi alimente directement le budget ; passage « prévu → payé »
  en un clic ; graphique mensuel ; coût moyen par tournoi et par point (avec garde-fou).
- **Exports** : sauvegarde JSON complète (tournois, partenaires, calendrier, finances, classement,
  paramètres), CSV tournois et dépenses (compatibles Excel/LibreOffice), ICS pour le calendrier.
- **Démo fictive** : Paramètres → *Données de démonstration* charge 5 tournois et 2 partenaires
  marqués `[DÉMO]`, jamais confondus avec de vrais résultats, et effaçables d'un clic.

## Barèmes FFT et sources

Points intégrés depuis **LE GUIDE DE LA COMPÉTITION PADEL, Chapitre II « Classements – Barèmes &
Assimilations »** :

- Saison sportive **2026** : édition **MAJ février 2026**, barèmes applicables à partir du
  **01/03/2026** (grilles par tranches de paires pour P25–P500 ; P1500/P2000 sur 21-24/25-28/29-32+).
- Saison sportive **2027** : publication **juillet 2026**, applicable à partir du **01/09/2026**
  (grilles par tranches P25–P250 ; grilles uniques messieurs/dames pour **P500 & P1000** ; P2000/P3000
  uniques ; le P1500 seniors est supprimé).
- Cuts (limitations de classement) codés en information, séparés des points.

Point d'entrée officiel : <https://www.fft.fr/nos-sports/padel/competitions-padel> ; les PDF relayés par
<https://padelmagazine.fr/reglementations-padel-fft/> sont utilisés comme copies de publication.

**Limites assumées (aucune valeur inventée)** :

- Grille **P1000 saison 2026** (mars → août 2026) : le tableau est présenté en *image* dans le PDF
  officiel ; transcription non fiable ⇒ l'app affiche **« règle non vérifiée »** et un override manuel
  est possible. La grille P1000 *saison 2027*, en texte, est complète.
- Barèmes antérieurs au 01/03/2026 et **épreuves par équipes** (championnats R1/N1/N2, P200/P300/P400) :
  affichés comme non pris en charge.
- Les dates limites FFT spécifiques (calculs mensuels du 1er mardi, cas particuliers) restent sous votre
  contrôle : le classement affiché est un **calcul local documenté**, pas le classement officiel.

## Données et confidentialité

- **Aucune donnée personnelle n'est versionnée** : tournois, partenaires, finances et classements vivent
  dans l'IndexedDB de votre navigateur, jamais dans le dépôt ni dans `dist/`.
- Aucune requête réseau vers un service tiers, aucun cookie, aucune analytics, aucune clé API.
- Le dépôt ne contient que du **code** et des **données de démo marquées `[DÉMO]`**, activées
  manuellement depuis Paramètres.
- Avant de rendre un fork public, vérifiez simplement qu'aucun export JSON/CSV personnel n'a été ajouté
  au dépôt (`.gitignore` couvre `node_modules/`, `dist/`, `*.local`).

> Le stockage local ne se synchronise pas entre appareils. PC ↔ téléphone : export / import JSON.

## Déploiement GitHub Pages

1. Poussez ce dépôt sur GitHub (public ou privé, l'app ne commite jamais vos données).
2. Le workflow `.github/workflows/deploy.yml` lance `npm ci`, les tests et le build, puis publie `dist/`
   via GitHub Actions à chaque push sur `main`. Activez *Settings → Pages → Source : GitHub Actions*.
3. Le `base` Vite est **relatif (`./`)** : l'app fonctionne sous
   `https://<user>.github.io/<nom-du-repo>/` quel que soit le nom du dépôt, sans reconfiguration.

## Lancer dans Docker

```bash
./docker-start.sh          # build + run sur le port 8080 (./docker-start.sh 3000 pour un autre port)
./docker-stop.sh           # arrêt du conteneur (l'image reste, relance instantanée)
./docker-stop.sh --clean   # arrêt + suppression de l'image
```

Le conteneur (nginx multi-étapes) sert le build statique avec fallback SPA ; le script reconstruit
l'image à chaque lancement (le cache Docker rend l'opération quasi gratuite si le code n'a pas changé).

## Sauvegardes et portabilité

- **Paramètres → Sauvegarder mes données** : export JSON complet horodaté.
- **Importer** : choisit un JSON valide, affiche un aperçu (doublons détectés), propose *fusionner*
  (par id) ou *remplacer*. Aucun effacement silencieux ; l'effacement complet est confirmé deux fois.
- Migration depuis localStorage/JSON existant : via le même import, avec aperçu avant validation.

## Vérifications

```bash
npm run test                    # 53 tests Vitest (7 fichiers)
npm run build                   # TypeScript strict + build Vite
```

Les scripts `scripts/browser-*.mjs` sont des **vérifications navigateur optionnelles** (Playwright) à
lancer contre une instance déjà servie par Docker :

```bash
./docker-start.sh
node scripts/browser-check.mjs            # erreurs console + structure de page
node scripts/browser-finance-test.mjs     # conflit calendrier + dépense hors tournoi
node scripts/browser-calendar-event-test.mjs  # ajout d'un événement depuis le calendrier
```

Playwright est déjà en `devDependencies` ; un premier `npx playwright install chromium` peut être
nécessaire.

## Structure

```
src/
  data/fft-rules.ts     # barèmes officiels transcrits, sources et validité
  lib/fft/              # moteur points + classement glissant (tests Vitest)
  lib/finance.ts        # budget en centimes, prévu/payé (tests)
  lib/exporters.ts      # JSON / CSV / ICS (tests)
  lib/storage.ts        # helpers de persistance et préférences
  db/db.ts              # Dexie IndexedDB versionnée + import/export
  components/           # UI partagée, formulaire tournoi, onboarding
  pages/                # Dashboard, Calendrier, Tournois, Partenaires, Classement, Finances, Stats, Paramètres
scripts/                # vérifications navigateur Playwright (optionnelles)
.github/workflows/      # déploiement GitHub Pages
```

*Pas de Ten'Up/4PADEL en synchronisation automatique* : l'app propose des liens vers les fiches et la
saisie manuelle du classement ; aucune API non officielle, aucun contournement d'authentification.
