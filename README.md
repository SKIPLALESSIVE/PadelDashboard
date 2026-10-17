# PadelTrack 🎾

Suivi personnel de padel pour les années civiles **2026 et 2027** (extensible) : calendrier, tournois FFT
(P25 → P3000), **points FFT calculés automatiquement** d'après les barèmes officiels, partenaires,
placement droite/gauche, budget effectif, statistiques et simulation de classement.

Application **100 % statique** (React + TypeScript + Vite), **sans backend**, hébergeable gratuitement sur
**GitHub Pages**. Toutes les données restent **sur votre appareil** (IndexedDB) et se sauvegardent via des
exports JSON/CSV/ICS.

## Démarrage

```bash
npm install
npm run dev        # développement local
npm run test       # tests (Vitest) : moteur FFT, classement glissant, finances, exports
npm run build      # vérif TypeScript + build statique dans dist/
npm run preview    # prévisualise le build
```

## Ce que l'app fait

- **Calendrier 2026–2027** : navigation mensuelle, un clic sur un jour → disponibilité / tournoi /
  événement (entraînement, stage, match amical…). Les jours **indisponibles avec un tournoi planifié**
  sont signalés comme conflit.
- **Tournois** : création express (date, catégorie, club, partenaire, prix d'inscription, statut) puis
  détails optionnels (épreuve, position droite/gauche, nombre de paires, place finale, résultats).
- **Points FFT instantanés** : dès que catégorie + paires + place sont connues, les points s'affichent
  (recalcul en direct, aucun bouton « Calculer »). Le barème appliqué, sa saison et sa source sont
  affichés. Un **override manuel** (avec motif) est possible pour les cas exceptionnels, en conservant la
  valeur calculée.
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
  paramètres), CSV tournois et dépenses (supportés par Excel/LibreOffice), ICS pour le calendrier.

## Barèmes FFT et sources

Points intégrés depuis **LE GUIDE DE LA COMPÉTITION PADEL, Chapitre II « Classements – Barèmes &
Assimilations »** :

- Saison sportive **2026** : edition **MAJ février 2026**, barèmes applicables à partir du
  **01/03/2026** (grilles par tranches de paires pour P25–P500 ; P1500/P2000 sur 21-24/25-28/29-32+).
- Saison sportive **2027** : publication **juillet 2026**, applicable à partir du **01/09/2026**
  (grilles par tranches P25–P250 ; grilles uniques messieurs/dames pour **P500 & P1000** ; P2000/P3000
  uniques ; le P1500 seniors est supprimé).
- Cuts (limitations de classement) codés en information, séparés des points.

Point d'entrée officiel : <https://www.fft.fr/nos-sports/padel/competitions-padel> ; les PDF relayés par
<https://padelmagazine.fr/reglementations-padel-fft/> sont utilisés comme copies de publication.

**Limites assumées (aucune valeur inventée)** :

- Grille **P1000 saison 2026** (mars → août 2026) : le tableau est présenté en *image* dans le PDF
  officiel ; transcription non fiable ⇒ l'app affiche **« règle non vérifiée »** et un override manuel est
  possible. La grille P1000 *saison 2027*, en texte, est complète.
- Barèmes antérieurs au 01/03/2026 et **épreuves par équipes** (championnats R1/N1/N2, P200/P300/P400) :
  affichés comme non pris en charge.
- Les dates limites FFT spécifiques (calculs mensuels du 1er mardi, cas particuliers) restent sous votre
  contrôle : le classement affiché est un **calcul local documenté**, pas le classement officiel.

## Déploiement GitHub Pages

1. Poussez ce dépôt sur GitHub (public recommandé — ne commettez jamais vos vraies données : l'app ne
   stocke rien dans le dépôt).
2. Le workflow `.github/workflows/deploy.yml` génère et publie automatiquement `dist/` sur la branche
   `gh-pages` à chaque push sur `main` (via GitHub Actions). Activez ensuite
   *Settings → Pages → Source : GitHub Actions* (ou branche `gh-pages`).
3. Le `base` Vite est **relatif (`./`)** : l'app fonctionne sous `https://<user>.github.io/<nom-du-repo>/`
   quel que soit le nom du dépôt, sans reconfiguration.

## Sauvegardes et portabilité

- **Paramètres → Sauvegarder mes données** : export JSON complet horodaté.
- **Importer** : choisit un JSON valide, affiche un aperçu (doublons détectés), propose
  *fusionner* (par id) ou *remplacer*. Aucun effacement silencieux ; l'effacement complet est confirmé
  deux fois.
- Stockage **local uniquement** : pas de synchronisation multi-appareils dans ce MVP (piste V2 :
  backend choisi et chiffré par l'utilisateur). Entre PC et téléphone, passez par export/import JSON.

## Structure

```
src/
  data/fft-rules.ts     # barèmes officiels transcrits, sources et validité
  lib/fft/              # moteur points + classement glissant (tests Vitest)
  lib/finance.ts        # budget centimes, prévu/payé (tests)
  lib/exporters.ts      # JSON / CSV / ICS (tests)
  db/db.ts              # Dexie IndexedDB versionnée
  components/           # UI partagée, formulaire tournoi, onboarding
  pages/                # Dashboard, Calendrier, Tournois, Partenaires, Classement, Finances, Stats, Paramètres
```

*Pas de Ten'Up/4PADEL en synchronisation automatique* : l'app propose des liens vers les fiches et la
saisie manuelle du classement ; aucune API non officielle, aucun contournement.

## Lancer dans Docker

```bash
./docker-start.sh          # build + run sur le port 8080 (./docker-start.sh 3000 pour un autre port)
./docker-stop.sh           # arrêt du conteneur (l'image reste, relance instantanée)
./docker-stop.sh --clean   # arrêt + suppression de l'image
```

Le conteneur (nginx) sert le build statique avec fallback SPA ; les scripts recréent l'image
automatiquement si le code a changé depuis le dernier build.
