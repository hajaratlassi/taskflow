# TaskFlow

Gestion de projets multi-espaces avec tableau Kanban.
Stack : Next.js 14 (App Router), React, TypeScript, Tailwind, Prisma, PostgreSQL, Vitest, Docker, GitHub Actions.

## Démarrage rapide (Docker)
    docker compose up --build
Application : http://localhost:3000 — documentation API : http://localhost:3000/docs

## Développement local
    cp .env.example .env
    docker compose up -d db
    npm install
    npx prisma db push
    npm run dev

## Scripts
`npm test` · `npm run typecheck` · `npm run build` · `npm run db:studio`

## Rôles
- Global : `ADMIN` (le premier inscrit) ou `MEMBER`. Les admins accèdent à `GET /api/admin/users`.
- Par espace : `OWNER` (gère les membres), `EDITOR` (crée/modifie), `VIEWER` (lecture seule).

## Déploiement
La CI (`.github/workflows/ci.yml`) lance typecheck, tests et build, puis publie l'image Docker sur GHCR
(branche `main`). Déployez cette image sur Render, Railway, Fly.io ou un VPS avec `DATABASE_URL` et `JWT_SECRET`.
Pour la production, générez des migrations (`npx prisma migrate dev`) et remplacez `db push` par `migrate deploy`.
