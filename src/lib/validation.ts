import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
});
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
export const workspaceSchema = z.object({ name: z.string().trim().min(2).max(60) });
export const memberSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]).default("EDITOR"),
});
export const projectSchema = z.object({ name: z.string().trim().min(2).max(80), workspaceId: z.string().min(1) });
export const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  projectId: z.string().min(1),
});
export const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(140),
    description: z.string().max(2000).nullable(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Aucun champ à modifier");
export const taskQuerySchema = z.object({
  projectId: z.string().min(1),
  q: z.string().trim().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});
