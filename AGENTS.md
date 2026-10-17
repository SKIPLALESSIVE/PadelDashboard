AGENTS.md — PadelTrack
Mission
Construire PadelTrack, une application web personnelle de suivi du padel pour les années civiles 2026 et 2027, extensible aux années suivantes. Elle doit remplacer un simple fichier HTML par un dashboard sportif beau, rapide, mobile-first, très simple à renseigner, exécutable dans un repository GitHub personnel et déployable gratuitement sur GitHub Pages sans backend obligatoire.
Priorité absolue : réduire au maximum le nombre de clics et la saisie répétitive. L'application est destinée à un joueur français participant à des tournois FFT, notamment des P25, et jouant parfois à droite, parfois à gauche, en simple paire masculine ou en mixte.
Principes non négociables
1. Interface en français, très soignée et moderne : thème sombre par défaut, contrastes lisibles, accents vert citron / menthe, graphiques et animations discrètes, excellente expérience mobile et desktop.
2. Toutes les données sont éditables et sauvegardées automatiquement. Aucune perte de données lors d'un rafraîchissement, d'un changement d'onglet ou d'une mise à jour de l'application.
3. Aucune authentification imposée, aucun serveur payant, aucune clé API secrète exposée côté client. L'application doit fonctionner sur GitHub Pages et, autant que possible, hors ligne.
4. Aucune donnée inventée (classement, places, résultats, points, tarifs, disponibilité, API). Distinguer clairement réel, prévisionnel, estimé et officiel.
5. Données personnelles privées par défaut : ne pas committer les véritables tournois, données financières ou partenaires dans un repo public. Ne livrer que des démos fictives activables explicitement.
6. Calculs FFT fiables, versionnés par règlement/date/format d'épreuve, couverts par tests. Ne pas faire une formule approximative catégorie - rang.
7. Le calendrier, la saisie des tournois, des partenaires et les statistiques doivent se synchroniser au sein de l'application automatiquement.
Stack / structure recommandées
- React + TypeScript + Vite, application statique pouvant être hébergée sur GitHub Pages ; pas de Next.js server-side ni backend requis.
- Tailwind CSS pour le design system ; composants accessibles et cohérents ; Recharts pour les graphiques ; date-fns avec locale fr pour les dates.
- Dexie + IndexedDB pour stockage local versionné, migration de schéma et volumes supérieurs à localStorage ; si choix plus simple, documenter pourquoi. Toujours assurer la sauvegarde hors ligne.
- Vitest pour les calculs FFT, sélections temporelles et statistiques ; React Testing Library pour les formulaires critiques ; Playwright facultatif pour scénarios E2E.
- PWA facultative (utile sur smartphone), sans complication ni synchronisation cloud implicite.
- Architecture modulaire suggérée : src/components, src/pages, src/features/calendar, src/features/tournaments, src/features/partners, src/features/ranking, src/features/finance, src/features/stats, src/lib/fft, src/db, src/types, src/data/fft-rules, tests.
- Ajouter README.md (installation, usage, sauvegardes, GitHub Pages), .gitignore, scripts dev, build, test, preview, workflow GitHub Actions de déploiement optionnel. Gérer correctement le base Vite pour un dépôt GitHub Pages sous /nom-du-repo/.
Parcours utilisateur / UX : le moins de clics possible
- Landing page Tableau de bord : cartes KPI, prochains tournois, évolution du classement, budget, disponibilités, partenaires et actions immédiates.
- Une action principale « + Ajouter un tournoi » toujours accessible sur desktop et mobile ; formulaire court en panneau latéral ou modal, prérempli avec la date sélectionnée, dernières valeurs utilisées, catégories fréquentes, club fréquent et partenaire favori.
- Formulaire en deux temps : création express (date, catégorie, club, partenaire, prix, statut), puis détails optionnels. Permettre de renseigner les résultats après un tournoi sans ressaisie des informations déjà connues.
- Un clic sur une date du calendrier permet de basculer disponibilité / indisponibilité / événement, avec action rapide et sans devoir traverser 3 écrans. Privilégier menu contextuel discret et raccourcis clairs.
- Mémoriser dernier onglet / préférences d'affichage / filtres / valeur récurrente. Ne jamais déclencher une sauvegarde manuelle obligatoire.
- Recherche, filtres, tri ; possibilité de modifier et dupliquer un tournoi ; suppression confirmée + annulation si raisonnable.
- États vides pédagogiques sans surcharge ; navigation clavier, contraste, labels, focus visibles ; affichage responsive de 320 px au desktop.
- Première ouverture : onboarding facultatif en moins d'une minute (classement initial, budget mensuel facultatif, partenaire habituel). Ne pas bloquer l'accès.
Calendrier 2026–2027 et planification
- Navigation mensuelle et éventuellement hebdomadaire ; accès direct à « aujourd'hui », vue couvrant tous les mois de janvier 2026 à décembre 2027 et extension future.
- Jour marqué comme disponible, indisponible, à confirmer ou non renseigné, avec note optionnelle et plages horaires facultatives.
- Gestion de tournois projetés, listes d'envies, intentions d'inscription, attente, inscrit, confirmé, joué, annulé ou désistement.
- Afficher simultanément tournois + disponibilités ; signaler conflits de dates et plages horaires.
- Ajouter des événements non-tournoi : entraînement, cours, match amical, repos, stage, déplacement.
- Filtrer par catégorie, statut, partenaire, club, coût, placement (gauche/droite), année ; code couleur stable et légende.
- Export ICS des événements et tournois choisis, avec dates et fuseau Europe/Paris ; proposer import ICS seulement si robuste et sans doublons.
- Option : budget prévisionnel par mois, tournois ciblés et points attendus, distincts des résultats acquis.
Tournois : modèle métier complet
Pour chaque tournoi :
- ID unique ; nom ; date / plage et horaire facultatif ; catégorie (P25, P50, P100, P250, P500, P1000, P2000, P3000, catégories historiques si nécessaire) ; saison sportive FFT / version de règlement applicable selon la date.
- Type d'épreuve : messieurs, dames, mixte, autre format homologué ; données liées au règlement/éligibilité quand applicables.
- Club/organisateur (y compris 4PADEL), ville, adresse facultative, lien de la fiche tournoi, note libre.
- Partenaire (référence vers table Partners), position personnelle droite / gauche / alternée / inconnue (éventuellement position du partenaire déduite seulement si renseignement fiable).
- Statut : envisagé, à confirmer, en liste d'attente, inscrit, joué, annulé.
- Format/réalité du tableau : nombre effectif de paires selon règle FFT, place finale (ou plage de places si applicable), issue « victoire / finale / demi / etc. » uniquement si cohérente avec classement final.
- Nombre de matchs joués, victoires, défaites ; détails facultatifs par match (adversaires, tours, score, issue) ; ne pas forcer la saisie match par match.
- Ressenti, notes techniques, performance perçue, fatigue ; photos ou liens facultatifs sans bloquer le MVP.
- Points FFT calculés automatiquement lorsque toutes les données nécessaires sont connues ; pas de saisie manuelle exigée. Autoriser un override manuel explicite pour corriger un cas exceptionnel avec motif, en conservant valeur calculée et valeur officielle si disponible.
- Tarifs : inscription par joueur, transport, location de piste, balles, repas, hébergement, autres ; prévu / payé séparés ; date de paiement optionnelle ; remboursements ; devise EUR par défaut.
Moteur FFT — tâche critique
- Source de vérité : Guide de la compétition FFT, Chapitre II (« Classements, barèmes et assimilations »), saison et éventuels correctifs officiels. Point d'entrée : https://www.fft.fr/nos-sports/padel/competitions-padel ; pour le principe du classement : https://www.fft.fr/nos-sports/padel/les-regles-padel.
- Saison sportive 2027 applicable à partir du 1er septembre 2026 ; prévoir réglementation 2026 pour les tournois antérieurs et versions futures. Ne pas appliquer rétrospectivement le nouveau barème aux anciennes épreuves.
- Tables officielles de points codées explicitement et documentées, pas d'approximation ; indexation par saison, catégorie, type/tableau messieurs/dames/mixte suivant le règlement, tranche de taille de tableau lorsque nécessaire, place finale, cas de places ex æquo et formats spéciaux.
- Les tournois P25/P50/P100/P250 peuvent dépendre de la taille du tableau, et les P500/P1000 2027 ont des grilles spécifiques ; ne pas généraliser une seule formule. Lors d'une épreuve mixte, vérifier dans le règlement le barème effectivement applicable plutôt que choisir arbitrairement celui des messieurs ou dames.
- Si paramètres incomplets ou combinaison non prise en charge : afficher « calcul impossible : manque [champ] » ou « règle non vérifiée », jamais une valeur fictive. Afficher le barème appliqué, sa version et la source.
- Après renseignement de la catégorie, du nombre de paires et de la place finale, afficher immédiatement les points individuels acquis, sans bouton « Calculer ». Recalculer en cas de changement d'un de ces champs.
- Le nombre de points du joueur au classement est la somme de ses 12 meilleurs résultats retenus sur les 12 derniers mois selon les règles FFT et la date de référence, avec suivi des résultats qui expirent. Bien documenter les particularités des dates limites FFT et ne pas inventer une date de calcul officielle si elle diffère d'une période glissante journalière.
- Séparer 3 grandeurs : (1) points FFT obtenus au tournoi, (2) total personnel calculé pour le classement, (3) rang national FFT officiel. Le rang national ne peut pas être inféré des seuls tournois personnels ; il provient d'une saisie ou d'une source légitime autorisée.
- Dashboard : points à gagner/perdre prochainement, meilleurs 12 résultats, points sortants, simulations « si je finis Nᵉ en P100 à X paires » ; simulations clairement identifiées comme prévisionnel.
- Historiser classements officiels mensuels (date, rang, points, provenance), avec comparaison à la somme locale calculée ; afficher écarts à expliquer plutôt que cacher les incohérences.
- Écrire des tests sur : 1er et dernier rang de plusieurs catégories, seuils de taille de tableau, changement 2026→2027, mixte, ex æquo, nombre de paires non renseigné, mise à jour des 12 meilleurs résultats, expiration glissante, régularité et doublons.
Partenaires récurrents et placement
- CRUD partenaires : nom/pseudo, classement connu (date), main forte facultative, placement habituel (droite/gauche/flexible), coordonnées facultatives et locales, notes, statut favori, historique de participation.
- Sélecteur intelligent avec favoris, derniers partenaires, saisie au clavier/autocomplétion et possibilité de créer le partenaire à la volée.
- Le placement personnel est historisé par tournoi et peut différer du placement habituel : droite / gauche / alternée / inconnu.
- Statistiques par partenaire : nombre de tournois, top catégories, place finale moyenne, médiane, meilleure et pire place, taux de victoire en matchs quand données suffisantes, finales/demis/podiums, points FFT moyens par tournoi, total de points, budget moyen, performance sur les X derniers tournois.
- Comparaisons partenaire × placement : performance à droite vs gauche, moyenne/ médiane par catégorie, volume d'échantillon explicite, évolution dans le temps. Ne pas mélanger aveuglément une 4e place sur 8 paires et une 4e sur 32 : fournir aussi percentile relatif de placement ou performance normalisée selon le nombre de paires, en complément du rang brut.
- Permettre de filtrer les statistiques par catégorie, format mixte/masculin, période, taille du tableau, pour comparer des conditions semblables.
- Toujours afficher N tournois ; si N est petit, afficher l'indicateur mais prévenir de sa faible représentativité. Ignorer les résultats futurs, annulés, non joués et places inconnues dans les moyennes réalisées.
- Tableau / graphiques « meilleurs partenaires », « mon côté le plus performant », « sorties moyennes », sans jugement simpliste sur la qualité d'un partenaire.
Finances et budget
- Dashboard de dépense réelle (payée), prévisionnel (à payer), coût total engagé selon règle définie, et budget restant sur période.
- Dépenses par tournoi, type (inscription, transport, repas, etc.), mois/année, catégorie, club, partenaire ; dépenses hors tournoi (coaching, équipement, balles, pressuriseur, abonnements) facultatives.
- Saisie d'un montant dans un tournoi = inscription intégrée directement au budget, pas besoin de double saisie.
- Budget mensuel et annuel paramétrable ; graphique d'évolution, dépenses cumulées, coût moyen par tournoi, coût par point FFT avec mise en garde sur l'interprétation et gestion du zéro.
- Paiement partiel / remboursement ; ne pas additionner deux fois prévisionnel et payé ; calculs monétaires en centimes entiers.
- Export CSV compatible tableur.
Classement, performances et analytique
- KPI : rang officiel le plus récent, évolution mensuelle du rang, total de points glissants calculé, top 12, nombre de tournois joués et prévus, taux de victoire lorsqu'il est mesurable, places moyennes, répartition droite/gauche, budget réel et prévisionnel.
- Graphiques : classement officiel dans le temps (une baisse de rang numérique est une amélioration), points glissants, places/pourcentage du tableau, performance par partenaire et côté, répartition P25/P100..., dépenses mensuelles.
- Dates/plages « depuis le début », 2026, 2027, 3/6/12 derniers mois ; filtres persistants et comparaisons pertinentes.
- Statistiques descriptives traçables au niveau des données ; pas de score opaque ou de « win rate » estimé sans résultats de matchs.
Intégrations FFT / Ten'Up / 4PADEL
- Ajouter des liens directs Ten'Up et 4PADEL (recherche de compétitions, fiches tournoi et réservations si URL valide).
- Étudier si API officielle/documentée et accessible à un particulier existe chez chaque fournisseur. Pour l'instant, ne pas supposer qu'une API publique utilisable existe, et ne pas promettre une synchronisation automatique.
- Ne pas demander ni stocker les identifiants Ten'Up/4PADEL dans le navigateur pour les transmettre à un service non officiel ; ne pas utiliser scraping agressif, endpoints privés non documentés ou contournement d'authentification.
- Architecture d'import adaptateur : import manuel JSON/CSV, éventuel import de données exportées légalement par l'utilisateur ; adapter ultérieurement un fournisseur seulement si API et conditions d'utilisation permettent cet usage.
- Un bouton « ouvrir Ten'Up » et un bouton « ouvrir 4PADEL » suffisent pour le MVP. Tout affichage « classement synchronisé » doit refléter une vraie synchronisation vérifiée et datée.
Persistance, portabilité et GitHub
- IndexedDB, autosave et schéma versionné ; migration depuis une éventuelle version HTML à localStorage uniquement si format identifié, avec import compatible si réalisable.
- Export JSON complet incluant version du format, tournois, partenaires, disponibilités, finances, classement, paramètres et horodatage ; import avec validation, aperçu, choix fusionner/remplacer, détection des doublons et confirmation.
- Export CSV des tournois et dépenses ; export ICS du calendrier.
- Ne jamais effacer silencieusement les données. Bouton « Sauvegarder mes données » / « Importer » très visible dans Paramètres.
- README avec procédure locale npm install && npm run dev, build, tests, déploiement GitHub Pages, et rappel : le stockage local n'est pas synchronisé entre appareils. Pas de promesse de synchronisation multi-device sans vraie solution explicitement mise en place.
- GitHub Pages : app statique, build versionné, chemins relatifs / base géré ; aucune donnée privée dans les fichiers déployés.
- Piste V2 : synchronisation explicite entre PC et téléphone via backend/stockage choisi par l'utilisateur, authentification sécurisée et chiffrement si nécessaire ; hors périmètre MVP.
Ordre de réalisation
1. Socle prêt pour GitHub : Vite + React TS, design system, navigation, stockage, import/export et tests.
2. Calendrier 2026–2027 + disponibilités + création express de tournoi.
3. CRUD partenaires + position droite/gauche + saisie des résultats et dépenses.
4. Moteur FFT exact versionné par saison, jeux de tests sérieux, classement glissant top 12.
5. Statistiques filtrables et comparaisons partenaire / position / catégorie + budget.
6. Polish UX : raccourcis, favoris, onboarding facultatif, mobile, accessibilité, exports ICS/CSV, documentation et déploiement.
Definition of Done / critères d'acceptation
- Je peux sélectionner le 16 octobre 2026 sur le calendrier, créer un P25 « joué », choisir un partenaire existant, indiquer ma position, le nombre de paires et ma 4e place : les points FFT correspondants s'affichent instantanément, selon le barème 2027 réellement applicable.
- Si j'ajoute un second tournoi avec le même partenaire mais joue à gauche au lieu de droite, les statistiques par partenaire et par côté se mettent à jour sans ressaisie.
- Si j'entre un prix d'inscription prévisionnel puis le marque « payé », le dashboard passe le montant de prévu à réel sans le compter deux fois.
- Si je marque un jour « indisponible », puis prévois un tournoi à la même date, le calendrier signale le conflit.
- Si je saisis 15 tournois sur 12 mois, le total de points retenus ne compte que les 12 meilleurs ; à expiration d'un tournoi, le total et les prévisions se recalculent.
- Je peux renseigner manuellement mon classement officiel Ten'Up sans que l'app ne prétende l'avoir calculé à partir de mes seuls tournois.
- Les stats ne comptent jamais un tournoi annulé comme un résultat joué, les moyennes n'incluent pas les places inconnues, et chaque comparaison indique son nombre d'observations.
- Une sauvegarde JSON, un effacement volontaire de données de test puis une réimportation restaurent intégralement mes tournois, partenaires, dates et budget.
- npm run build et npm run test passent ; l'app se charge sous un sous-chemin GitHub Pages ; une navigation mobile ne nécessite pas de zoom ni défilement horizontal.
- Aucune intégration externe non vérifiée n'est présentée comme fonctionnelle.
Notes pour les agents qui implémentent
- Commencer par vérifier les PDF officiels FFT pour obtenir les tables exhaustives (pas les inventer à partir d'exemples de sites tiers). Stocker les références et dates de validité de chaque grille.
- Si les barèmes officiels complets ne sont pas disponibles, livrer les fonctionnalités fiables et marquer explicitement le calcul FFT incomplet ; ne jamais déclarer la fonctionnalité terminée en s'appuyant sur des hypothèses.
- Ne pas confondre classement final dans un tournoi et classement national FFT.
- Favoriser la simplicité opérationnelle : une seule commande locale pour lancer, pas de backend pour le MVP, architecture compréhensible et maintenable par une personne.
- Écrire le code et les tests, pas seulement des maquettes. N'utiliser des données de démonstration que si elles sont nettement marquées fictives.
