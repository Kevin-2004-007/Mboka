BRIEF DESIGN — À COLLER DANS FIGMA / FIGMA AI
OS Entreprise Modulaire — Alternative à SAP & Odoo
1. Vision produit
Un seul OS qui remplace les logiciels d'entreprise séparés (RH, Finance, CRM, Compta, Production). Alternative
flexible à SAP et Odoo : déploiement rapide, personnalisable module par module.
Positionnement design : pas un ERP daté et surchargé. L'ambition est un produit qui a l'air aussi moderne que Linear,
Notion ou Attio — pas comme SAP, Odoo ou Sage.
2. Utilisateurs & contexte d'usage
• Dirigeant / décideur — consulte surtout le Dashboard global et les KPIs, session courte, besoin de vue d'ensemble
immédiate.
• Responsable RH / Finance / CRM — utilisation intensive quotidienne d'un seul module, besoin de densité d'info et
de rapidité (raccourcis clavier, actions en masse).
• Employé standard — usage ponctuel (congés, fiche de paie, notes de frais), doit être quasi auto-explicatif, zéro
formation nécessaire.
• Administrateur — gère les rôles, permissions, intégrations et la facturation du compte (multi-tenant).
3. Modules et écrans à concevoir
Pour chaque module ci-dessous, générer : un écran de liste, un écran de détail/fiche, un écran de création/édition, et
les états vides/erreur.
3.1 Auth & Onboarding
• Écran de connexion / inscription (via Clerk)
• Sélecteur d'organisation (multi-tenant) après connexion
• Onboarding en 3 étapes : créer l'organisation, inviter l'équipe, choisir les modules actifs
3.2 Dashboard global
• Vue d'ensemble avec KPIs par module (widgets configurables)
• Graphiques temps réel (alimentés par ClickHouse) : CA, effectifs, factures en attente
• Fil d'activité récente inter-modules
3.3 Module RH
• Liste des employés (table filtrable : poste, contrat, statut)
• Fiche employé (infos, contrat, historique, documents)
• Création de contrat / avenant
• Gestion des congés et absences (vue calendrier + validation)
3.4 Module Finance
• Liste des factures (statut : payée / en attente / en retard)
• Création de facture (avec conformité Factur-X)
• Suivi des paiements et rapprochement (Stripe Billing)
3.5 Module CRM
• Pipeline de deals en vue kanban (drag & drop)
• Fiche client / contact (historique interactions, documents)
• Création d'opportunité
3.6 Module Compta
• Vue de synchronisation avec Pennylane
• Écran de rapprochement bancaire
3.7 Paramètres & Administration
• Gestion des utilisateurs et des rôles/permissions
• Marketplace de modules (activer/désactiver un module métier)
• Intégrations tierces (Stripe, Resend, Pennylane, Slack)
• Facturation du compte (plan, usage, moyens de paiement)
3.8 Transverse
• Recherche globale (cmd+K) inter-modules
• Centre de notifications
• Mode clair / mode sombre
3.9 Module Achats / Procurement
• Liste des bons de commande (statut : brouillon / envoyé / reçu)
• Fiche fournisseur (coordonnées, historique commandes)
• Création de bon de commande (lignes produits, quantités, prix)
• Validation / réception de marchandises
3.10 Module Stock / Inventaire
• Vue d'ensemble des stocks (par entrepôt, alertes de rupture)
• Fiche produit (quantité, emplacement, historique de mouvements)
• Mouvement de stock (entrée / sortie / transfert entre entrepôts)
3.11 Module Notes de frais
• Liste des notes de frais (statut : soumise / validée / remboursée)
• Soumission d'une note de frais (upload de reçu, catégorie, montant)
• Vue de validation hiérarchique (pour les managers)
3.12 Module Projets / Time tracking
• Liste des projets (avancement, budget consommé)
• Fiche projet (tâches, membres, temps facturable)
• Saisie de feuille de temps (timer ou saisie manuelle par jour/semaine)
3.13 Module Support client / Helpdesk
• Liste des tickets (statut, priorité, SLA restant)
• Fiche ticket (conversation, client lié, historique)
• Base de connaissance (articles, recherche)
3.14 Signature électronique
• Liste des documents en attente de signature
• Écran de signature (aperçu du document, zone de signature, statut des signataires)
3.15 Gestion documentaire (GED)
• Explorateur de documents (dossiers par module, recherche full-text)
• Fiche document (aperçu, versions, droits d'accès par rôle)
3.16 Business Intelligence avancée
• Constructeur de rapports personnalisés (glisser-déposer des métriques)
• Bibliothèque de rapports sauvegardés, export PDF/Excel
3.17 Marketplace d'automatisations inter-modules
• Liste des automatisations actives (déclencheur → actions)
• Créateur d'automatisation sans code (ex : embauche → compte Finance → notification Compta)
3.18 Module Qualité / Conformité
• Liste des audits et non-conformités (statut, échéance)
• Fiche d'audit (checklist, preuves documentaires, plan d'action)
4. Direction artistique
Références concurrentes à s'inspirer
Linear (clarté, densité maîtrisée, rapidité perçue) · Notion (simplicité, hiérarchie visuelle) · Attio (CRM moderne, cartes
et pipelines) · Stripe Dashboard (données financières lisibles) · Ramp (finance, sérieux mais moderne).
Palette de couleurs
Usage Couleur Code
Accent principal (CTA, liens, focus) Indigo #4F46E5
Fond clair (mode light) Blanc cassé #FFFFFF / #F9FAFB
Fond sombre (mode dark) Gris anthracite #0B0F19
Texte principal Gris très foncé #111827
Texte secondaire Gris moyen #6B7280
Succès Vert #16A34A
Attention Ambre #D97706
Erreur Rouge #DC2626
Typographie
• Police recommandée : Inter, Geist ou Söhne (éviter les polices système par défaut).
• Échelle typographique claire : titres 24-32px, corps 14-16px, labels 12-13px.
• Poids : bold réservé aux titres et chiffres clés (KPIs), regular partout ailleurs.
Densité & style
• Interfaces de gestion (RH, Finance, CRM) : densité élevée façon Linear — tables compactes, actions rapides, peu
de scroll.
• Dashboard et pages de synthèse : plus aérées, cartes avec respiration, hiérarchie visuelle forte.
• Coins arrondis modérés (8-12px), ombres légères, pas d'effets datés (dégradés criards, skeuomorphisme).
Système de composants
La stack de code utilise shadcn/ui + Tailwind. Demander à Figma d'aligner les composants (boutons, tables,
formulaires, modales, badges de statut) sur ce design system pour que le passage maquette → code via v0.dev soit
direct, sans réinterprétation.
5. États & micro-interactions à prévoir
• États vides (aucune donnée) avec illustration légère + CTA clair
• États de chargement (skeletons plutôt que spinners)
• États d'erreur (messages actionnables, pas juste "Une erreur est survenue")
• Confirmations d'actions destructives (suppression, désactivation)
• Notifications toast pour les actions réussies
6. Prompts prêts à copier dans Figma AI
Copier un bloc à la fois dans Figma AI (Cmd/Ctrl+K ou le générateur de layout) pour obtenir chaque écran.
Dashboard global
Crée un dashboard SaaS B2B moderne pour un OS d'entreprise (style Linear / Stripe
Dashboard). Sidebar de navigation à gauche avec icônes pour les modules RH,
Finance, CRM, Compta, Paramètres. En haut : barre de recherche globale et
sélecteur d'organisation. Corps : 4 cartes KPI en haut (CA du mois, factures en
attente, effectifs, nouveaux deals), puis un graphique d'évolution du CA sur 12
mois, puis un fil d'activité récente. Palette indigo (#4F46E5) sur fond clair
(#F9FAFB), typographie Inter, coins arrondis 8-12px, mode clair et sombre.
Module RH — Liste des employés
Crée une page de liste d'employés façon Linear/Notion. Table avec colonnes : nom,
poste, département, statut du contrat (badge coloré), date d'entrée, actions.
Filtres en haut (par département, statut, type de contrat) et barre de recherche.
Bouton "Nouvel employé" en haut à droite en indigo. Ligne de table cliquable
menant vers la fiche employé. Style dense, sobre, fond blanc, texte gris foncé.
Module CRM — Pipeline de deals
Crée une vue pipeline CRM en colonnes kanban (façon Attio/Pipedrive) :
Prospection, Qualification, Proposition, Négociation, Gagné. Chaque deal est une
carte avec nom du client, montant, avatar du contact, date de clôture prévue.
Colonnes glissables horizontalement, cartes draggables. Bouton "Nouveau deal" en
haut. Palette indigo, fond gris très clair, cartes blanches avec ombre légère.
Module Finance — Facture
Crée un écran de création de facture pour un module Finance B2B. Formulaire à
gauche (client, lignes de facturation avec quantité/prix, TVA, total calculé
automatiquement, conformité Factur-X mentionnée), aperçu de la facture en temps
réel à droite façon document PDF. Boutons "Enregistrer en brouillon" et "Envoyer"
en bas. Style épuré, sérieux, palette indigo et gris, chiffres alignés à droite.
Paramètres — Gestion des rôles
Crée un écran de gestion des utilisateurs et permissions pour une plateforme SaaS
multi-tenant. Table des membres de l'organisation avec colonnes : nom, email,
rôle (Admin/Manager/Employé), modules accessibles (badges), statut, actions.
Bouton "Inviter un membre" en haut à droite ouvrant un modal avec champ email et
sélecteur de rôle. Style sobre et administratif, cohérent avec le reste du
produit.
Module Achats — Bons de commande
Crée une page de liste de bons de commande façon Linear. Table avec colonnes :
fournisseur, numéro de commande, montant, statut (badge : brouillon/envoyé/reçu),
date. Filtres par statut et fournisseur. Bouton "Nouveau bon de commande" en
indigo en haut à droite. Style dense et sobre, cohérent avec le module Finance.
Module Stock — Vue d'ensemble
Crée un dashboard de gestion de stock. Cartes en haut : nombre total de
références, alertes de rupture, valeur totale du stock. En dessous, table des
produits avec colonnes : nom, quantité disponible, emplacement/entrepôt, statut
(badge : en stock/stock faible/rupture). Palette indigo, badges colorés pour les
statuts, style clair et lisible.
Notes de frais — Soumission
Crée un écran de soumission de note de frais façon app mobile-first mais
responsive desktop. Zone d'upload de reçu (glisser-déposer ou photo) à gauche,
formulaire à droite (catégorie, montant, date, description). Bouton "Soumettre"
en indigo. Style épuré, convivial, peu de champs visibles à la fois.
Support client — Liste des tickets
Crée une page de liste de tickets support façon Linear/Zendesk simplifié. Table
avec colonnes : sujet, client, priorité (badge coloré), statut, SLA restant
(compte à rebours discret), assigné à. Filtres par statut et priorité. Style
dense, indicateurs de priorité visuellement clairs (rouge/ambre/vert).
Gestion documentaire — Explorateur
Crée un explorateur de documents façon Google Drive épuré. Sidebar gauche avec
dossiers par module (RH, Finance, Contrats). Vue principale en grille ou liste
des documents avec icône de type de fichier, nom, date de modification, taille.
Barre de recherche full-text en haut. Style neutre, indigo en accent uniquement
sur les actions.
7. Ce qu'il ne faut pas faire
• Éviter tout ce qui rappelle visuellement SAP, Odoo ou Sage : interfaces surchargées, icônes datées, dégradés bleus
criards, densité excessive sans hiérarchie.
• Éviter les illustrations génériques de banque d'images — préférer des icônes simples (Lucide, style shadcn) ou pas
d'illustration du tout.
• Éviter d'inventer une DA différente par module : un seul design system pour tout le produit.
8. Étapes suivantes suggérées
• 1. Générer le Dashboard global en premier dans Figma AI (c'est l'écran qui fixe la DA de tout le reste).
• 2. Valider palette + typographie + composants avant de générer les autres écrans.
• 3. Générer les écrans module par module en réutilisant les mêmes composants (table, badge, carte, modal).
• 4. Exporter/documenter les composants validés dans Storybook une fois le code repris via v0.dev + Cursor.