# projet – Pipeline cloud asynchrone avec IA, notifications et DLQ

## Objectif

Faire évoluer l’application existante de gestion de documents vers une architecture cloud événementielle complète.

Les fonctionnalités déjà réalisées en cours sont considérées comme acquises :

- création du document via FastAPI
- stockage initial dans Cosmos DB
- génération d’une URL SAS
- upload du fichier dans Blob Storage depuis React

Le projet démarre après l’upload du fichier.

---

## Architecture cible

```text
React
  ↑
  | notifications temps réel
  |
Azure SignalR Service
  ↑
  |
Azure Functions
  |
  +--> Blob Trigger Function
  |       |
  |       v
  |   Service Bus Queue
  |
  +--> Service Bus Processing Function
  |       |
  |       +--> IA Tagging
  |       +--> Cosmos DB update
  |       +--> Notification React
  |
  +--> DLQ Alert Function
          |
          +--> Notification React
          +--> Cosmos DB / logs
```

---

## Fonctionnalités obligatoires

### 1. Function Blob Trigger

La Function Blob Trigger doit :

- se déclencher lors de l’upload d’un fichier dans `input/`
- extraire `documentId`, `fileName`, `blobName` et `size`
- publier un message JSON dans Azure Service Bus
- envoyer une notification `UPLOADED` à l’application React
- mettre éventuellement le document en statut `QUEUED`

Exemple de message Service Bus :

```json
{
  "documentId": "123",
  "fileName": "cv_amine_azure.pdf",
  "blobName": "input/123_cv_amine_azure.pdf",
  "size": 248392,
  "uploadedAt": "2026-04-27T10:45:00Z"
}
```

---

### 2. Function Service Bus – Traitement IA

La Function Service Bus doit :

- lire le message depuis la queue
- mettre le document en `PROCESSING`
- envoyer une notification React
- appeler une IA pour générer les tags
- mettre à jour Cosmos DB
- passer le document en `PROCESSED`
- envoyer une notification React avec les tags générés

Résultat attendu :

```json
{
  "id": "123",
  "fileName": "cv_amine_azure.pdf",
  "status": "PROCESSED",
  "tags": ["azure", "cloud", "cv", "document", "pdf", "rh"],
  "blobName": "input/123_cv_amine_azure.pdf",
  "size": 248392,
  "processedAt": "2026-04-27T10:45:00Z"
}
```

---

### 3. Tagging IA obligatoire

Le tagging doit utiliser une IA.

Solutions acceptées :

- Azure OpenAI
- OpenAI API
- Azure AI Foundry
- Azure AI Language
- autre solution validée par l’enseignant

Exemple de prompt :

```text
Analyse le nom de fichier suivant et génère entre 3 et 8 tags courts en français.
Nom du fichier : cv_amine_azure.pdf

Retourne uniquement un tableau JSON de chaînes.
```

Sortie attendue :

```json
["cv", "rh", "azure", "cloud", "document", "pdf"]
```

Une logique de fallback par règles est autorisée si l’appel IA échoue.

---

### 4. Notifications React temps réel

L’application React doit recevoir les évolutions d’état du document.

Technologie recommandée :

- Azure SignalR Service

Exemples d’événements :

```json
{
  "documentId": "123",
  "status": "UPLOADED",
  "message": "Fichier reçu"
}
```

```json
{
  "documentId": "123",
  "status": "PROCESSING",
  "message": "Traitement IA en cours"
}
```

```json
{
  "documentId": "123",
  "status": "PROCESSED",
  "message": "Tagging terminé",
  "tags": ["cv", "rh", "azure"]
}
```

```json
{
  "documentId": "123",
  "status": "ERROR",
  "message": "Erreur de traitement"
}
```

---

### 5. Dead Letter Queue obligatoire

La Dead Letter Queue est obligatoire.

La queue Service Bus doit être configurée avec :

- un nombre maximal de tentatives
- une DLQ active
- une Function dédiée au traitement des messages en erreur

Cas devant provoquer une erreur ou un passage en DLQ :

- message mal formé
- document introuvable
- échec répété de l’appel IA
- exception non gérée dans la Function de traitement

---

### 6. Function DLQ Alert

Créer une Azure Function dédiée à la surveillance de la Dead Letter Queue.

Elle doit :

- lire les messages en DLQ
- récupérer `documentId`
- mettre à jour Cosmos DB avec `status = ERROR`
- stocker la raison de l’erreur
- envoyer une notification React

Exemple Cosmos DB :

```json
{
  "id": "123",
  "status": "ERROR",
  "errorMessage": "Message envoyé en DLQ après plusieurs échecs",
  "errorAt": "2026-04-27T11:00:00Z"
}
```
---
### 7. Endpoint de relance

Ajouter côté FastAPI :
```json
POST /documents/{id}/retry
```
Cet endpoint republie un message dans Service Bus.

---

### 8. Observabilité

Demander explicitement :

- logs structurés
- correlationId
- documentId dans tous les logs
- capture Application Insights

Exemple :
```json
{
  "correlationId": "abc-123",
  "documentId": "123",
  "step": "AI_TAGGING",
  "status": "SUCCESS"
}
```
---

## Déploiement obligatoire avec GitLab CI/CD

Le projet doit être déployé automatiquement avec GitLab CI/CD.

Le pipeline doit contenir au minimum :

- installation des dépendances
- vérification du code
- build du frontend React
- déploiement du frontend
- déploiement des Azure Functions
- utilisation de variables GitLab CI/CD pour les secrets Azure

---

## Variables GitLab CI/CD attendues

À configurer dans GitLab :

`Settings > CI/CD > Variables`

Variables minimales :

```text
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
AZURE_FUNCTION_APP_NAME
AZURE_RESOURCE_GROUP
AZURE_STATIC_WEB_APP_TOKEN
```

Selon l’architecture, ajouter aussi :

```text
COSMOS_ENDPOINT
COSMOS_KEY
SERVICE_BUS_CONNECTION_STRING
SIGNALR_CONNECTION_STRING
OPENAI_API_KEY
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_DEPLOYMENT
```

Les secrets ne doivent jamais être commités dans le dépôt.

## États métier

```
CREATED → UPLOADED → QUEUED → PROCESSING → PROCESSED
                             ↘ ERROR
```

---

## Tests

- fichier valide → PROCESSED
- fichier vide → ERROR
- document introuvable → ERROR
- message invalide → DLQ
- échec répété → DLQ

---

## Livrables

- code Functions
- code React
- config Service Bus + DLQ
- config SignalR
- README
- schéma architecture

---

## Présentation

- architecture
- démo complète
- tagging IA
- gestion erreurs + DLQ
- notifications temps réel

---

## Barème

| Critère | Points |
|--------|-------|
| Service Bus | 3 |
| Function traitement | 4 |
| Tagging IA | 3 |
| Notifications | 4 |
| DLQ | 2 |
| CI/CD | 2 |
| Code / README | 1 |
| Présentation | 1 |
| Total | 20 |

## Groupes et fonctionnement

Le projet est a développé en individuel.


Les étudiants sont encouragés à mettre en place un système de contrôle des sources de type Git ou équivalent, afin d'affecter et partager efficacement les fichiers de codes et autres composants numériques du projet (fichiers sources, descripteurs de déploiement, documents de recherche, cas d'utilisation, suites de tests, etc.).

## Soutenance et rendu

La soutenance aura lieux le lundi 22 juin 2026.
Les horaires de passage sont définis pour chaque personne.
Toute absence à la soutenance entrainera un 0 (ZERO).

Le rendu s'effectu via un SVN. L'adresse du rendu est envoyé par mail.
Le mail de rendu est vincent.leclerc@ynov.com
Les fichiers rendus doivent contenir
  - L'arborescence du projet, immédiatement exploitable.
  - Un AUTHORS.TXT listant les membres du groupe (prénom, nom), à raison d'un par ligne.  Il liste ensuite les responsabilités effectives de chacun dans le groupe.
Le sujet du mail doit contenir votre section ainsi que le nom du projet.
Les fichiers rendus peuvent aussi comprendre: 
  - Des documents de recherche créés pour le projet et fournissant plus de détails pour l'enseignant.
Pour tout autre type de fichier, veuillez demander à l'enseignant si son inclusion est appropriée.
La soutenance dure 10 minutes durant lesquelles les membres présentent leur travail. Un échange de questions peut se faire entre le professeur et les membres du groupe.

Les groupes sont les suivants:
- 

Les horaires de passage des groupes sont les suivants:

| Horaire | Groupe                                    |
| ------- | ----------------------------------------- |
| 11h45   |  |
| 12h00   |    |
| 12h15   |       |
| 12h30   |       |
| 12h45   |         |
| 13h00   |    |
| 14h15   |             |
| 14h30   |         |
| 15h45   |           |
| 16h00   |      |
| 16h15   |            |
