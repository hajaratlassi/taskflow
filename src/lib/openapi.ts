const json = (schema: object) => ({
  content: {
    "application/json": { schema },
  },
});

const ok = {
  200: { description: "OK" },
  400: { description: "Données invalides" },
  401: { description: "Non authentifié" },
};

const projectBody = json({
  type: "object",
  required: ["name", "workspaceId"],
  properties: {
    name: { type: "string", minLength: 2, maxLength: 80 },
    workspaceId: { type: "string" },
  },
});

const taskBody = json({
  type: "object",
  required: ["title", "projectId"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 140 },
    description: { type: "string", maxLength: 2000 },
    priority: {
      type: "string",
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    projectId: { type: "string" },
  },
});

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "TaskFlow API",
    version: "1.0.0",
    description: "Authentification par cookie httpOnly `token`.",
  },
  paths: {
    "/api/auth/register": {
      post: {
        summary: "Inscription",
        requestBody: json({
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
          },
        }),
        responses: {
          201: { description: "Créé" },
          409: { description: "Email déjà utilisé" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Connexion",
        requestBody: json({
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        }),
        responses: ok,
      },
    },
    "/api/auth/logout": {
      post: { summary: "Déconnexion", responses: ok },
    },
    "/api/me": {
      get: { summary: "Utilisateur courant", responses: ok },
    },
    "/api/workspaces": {
      get: { summary: "Mes espaces", responses: ok },
      post: {
        summary: "Créer un espace",
        requestBody: json({
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 60 },
          },
        }),
        responses: { ...ok, 201: { description: "Créé" } },
      },
    },
    "/api/workspaces/{id}/members": {
      post: {
        summary: "Ajouter un membre (OWNER)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: json({
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
            role: {
              type: "string",
              enum: ["OWNER", "EDITOR", "VIEWER"],
              default: "EDITOR",
            },
          },
        }),
        responses: ok,
      },
    },
    "/api/projects": {
      get: {
        summary: "Projets d'un espace",
        parameters: [
          {
            name: "workspaceId",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: ok,
      },
      post: {
        summary: "Créer un projet",
        requestBody: projectBody,
        responses: { ...ok, 201: { description: "Créé" } },
      },
    },
    "/api/tasks": {
      get: {
        summary: "Tâches (recherche, filtres, pagination)",
        parameters: [
          { name: "projectId", in: "query", required: true, schema: { type: "string" } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] } },
          { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
        ],
        responses: ok,
      },
      post: {
        summary: "Créer une tâche",
        requestBody: taskBody,
        responses: { ...ok, 201: { description: "Créé" } },
      },
    },
    "/api/tasks/{id}": {
      patch: {
        summary: "Modifier / changer le statut",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: json({
          type: "object",
          properties: {
            title: { type: "string", minLength: 1, maxLength: 140 },
            description: { type: ["string", "null"], maxLength: 2000 },
            status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
          },
          minProperties: 1,
        }),
        responses: ok,
      },
      delete: {
        summary: "Supprimer",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: ok,
      },
    },
    "/api/dashboard": {
      get: {
        summary: "Statistiques d'un espace",
        parameters: [
          {
            name: "workspaceId",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: ok,
      },
    },
    "/api/admin/users": {
      get: { summary: "Liste des utilisateurs (ADMIN)", responses: ok },
    },
  },
};
