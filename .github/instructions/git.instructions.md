---
description: Conventions de Git et workflow de développement
applyTo: "**"
---

# Git & Workflow Instructions

## 🌿 Branches

### Structure des branches

```
main                    # Production - toujours stable
├── deve                # Développement - intégration
├── feature/xxx         # Nouvelles fonctionnalités
├── bugfix/xxx          # Corrections de bugs
└── hotfix/xxx          # Corrections urgentes en prod
```

### Nommage des branches

```
feature/auth-jwt
feature/product-crud
feature/cart-checkout
bugfix/login-validation
hotfix/security-patch
```

---

## 📝 Commits

### Format des messages (Français)

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

### Types de commits

| Type       | Description                           |
| ---------- | ------------------------------------- |
| `feat`     | Nouvelle fonctionnalité               |
| `fix`      | Correction de bug                     |
| `docs`     | Documentation                         |
| `style`    | Formatage (pas de changement de code) |
| `refactor` | Refactoring                           |
| `test`     | Ajout de tests                        |
| `chore`    | Maintenance, dépendances              |

### Exemples

```
feat(auth): ajouter l'authentification JWT

- Créer le middleware d'authentification
- Implémenter login/register
- Ajouter la validation des tokens

Closes #12

---

fix(cart): corriger le calcul du total

Le total ne prenait pas en compte les quantités multiples.

---

docs(readme): mettre à jour les instructions d'installation
```

---

## 🔄 Pull Requests

### Avant de créer une PR

1. Rebaser sur `develop` (ou `main`)
2. Résoudre les conflits
3. Tester localement
4. S'assurer que le build passe

### Template de PR

```markdown
## Description

Brève description des changements

## Type de changement

- [ ] Nouvelle fonctionnalité
- [ ] Correction de bug
- [ ] Refactoring
- [ ] Documentation

## Checklist

- [ ] Mon code suit les conventions du projet
- [ ] J'ai testé mes changements localement
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Mes commits suivent le format conventionnel

## Screenshots (si applicable)

[Ajouter des captures d'écran]

## Notes pour les reviewers

[Instructions ou points d'attention]
```

---

## 📋 Issues

### Template d'issue - Bug

```markdown
## Description du bug

Description claire et concise

## Étapes pour reproduire

1. Aller sur '...'
2. Cliquer sur '....'
3. Voir l'erreur

## Comportement attendu

Ce qui devrait se passer

## Comportement actuel

Ce qui se passe réellement

## Screenshots

[Si applicable]

## Environnement

- OS: [ex: Windows 11]
- Navigateur: [ex: Chrome 120]
- Version: [ex: 1.0.0]
```

### Template d'issue - Feature

```markdown
## Description de la fonctionnalité

Description claire et concise

## Motivation

Pourquoi cette fonctionnalité est nécessaire

## Solution proposée

Comment implémenter cette fonctionnalité

## Alternatives considérées

Autres approches envisagées

## Critères d'acceptation

- [ ] Critère 1
- [ ] Critère 2
```

---

## 🏷️ Labels recommandés

| Label              | Description                     | Couleur |
| ------------------ | ------------------------------- | ------- |
| `bug`              | Quelque chose ne fonctionne pas | #d73a4a |
| `feature`          | Nouvelle fonctionnalité         | #0075ca |
| `enhancement`      | Amélioration                    | #a2eeef |
| `documentation`    | Documentation                   | #0075ca |
| `good first issue` | Bon pour débuter                | #7057ff |
| `priority:high`    | Priorité haute                  | #b60205 |
| `priority:medium`  | Priorité moyenne                | #fbca04 |
| `priority:low`     | Priorité basse                  | #0e8a16 |
| `backend`          | Concerne le backend             | #1d76db |
| `frontend`         | Concerne le frontend            | #5319e7 |

---

## 🚀 Workflow de développement

### 1. Créer une branche

```bash
git checkout develop
git pull origin develop
git checkout -b feature/ma-fonctionnalite
```

### 2. Développer et commiter

```bash
# Travailler...
git add .
git commit -m "feat(scope): description"
```

### 3. Pusher et créer une PR

```bash
git push origin feature/ma-fonctionnalite
# Créer la PR sur GitHub
```

### 4. Review et merge

- Demander une review
- Adresser les commentaires
- Merge une fois approuvé

### 5. Nettoyer

```bash
git checkout develop
git pull origin develop
git branch -d feature/ma-fonctionnalite
```

---

## ⚠️ Règles Importantes

1. **Ne JAMAIS pusher directement sur `main`**
2. **Toujours créer une PR pour les changements**
3. **Commits atomiques** (un changement = un commit)
4. **Messages en français**, clairs et descriptifs
5. **Rebaser régulièrement** pour éviter les gros conflits
6. **Ne pas commiter** les fichiers générés (node_modules, dist, .env)

---

## 📁 .gitignore recommandé

```gitignore
# Dependencies
node_modules/

# Build
dist/
build/
.angular/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test
coverage/

# Temp
*.tmp
*.temp
```

---
## Backend - Règles spécifiques (Express.js)

- **Langage & modules**: Le dossier `back-end/` doit rester en **JavaScript** pur et utiliser **ES Modules** (`import` / `export`). **Ne jamais** ajouter TypeScript dans `back-end/`.
- **package.json**: Assurez-vous que `"type": "module"` est présent pour le backend.
- **Structure**: Respecter l'architecture `controllers/`, `services/`, `models/`, `routes/`, `middlewares/` et `config/`.
- **Validation & sécurité**: Toujours valider les entrées (Joi ou équivalent), sanitize pour éviter les injections NoSQL, utiliser `helmet`, rate limiting et sanitize les payloads.
- **Transactions**: Pour les opérations critiques (paiements, commandes), utiliser les transactions MongoDB (sessions) et vérifier l'intégrité avant commit.
- **Secrets**: Ne **jamais** committer `.env` ou secrets. Fournir un fichier `.env.example` et stocker les secrets dans le CI/infra.
- **Tests & build**: Avant d'ouvrir une PR, exécuter `npm install` puis `npm run build` (ou `npm test` si présent) dans `back-end/` et corriger les erreurs.
- **Commit messages**: Utiliser le scope `backend`, p.ex. `fix(backend/auth): corriger validation token` ou `feat(backend/orders): ajouter transaction`.
- **PR checklist (backend)**:
	- [ ] Le code est en JavaScript ES Modules
	- [ ] Les entrées sont validées (Joi/validation)
	- [ ] Les opérations critiques sont en transaction
	- [ ] `.env` n'est pas commité et `.env.example` est mis à jour
	- [ ] Les logs et erreurs sont gérés (error.middleware)
	- [ ] Build/tests locaux réalisés

Ces règles complètent les conventions générales de Git et le workflow présentés ci-dessus.
