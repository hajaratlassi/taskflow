import { db } from "@/lib/db";
import { handle, HttpError, requireMember, requireUser } from "@/lib/api";
import { taskUpdateSchema } from "@/lib/validation";

async function load(id: string, userId: string) {
  const t = await db.task.findUnique({ where: { id }, include: { project: { select: { workspaceId: true } } } });
  if (!t) throw new HttpError(404, "Tâche introuvable");
  await requireMember(userId, t.project.workspaceId, "write");
  return t;
}

export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  const u = await requireUser();
  await load(params.id, u.id);
  const data = taskUpdateSchema.parse(await req.json());
  return db.task.update({ where: { id: params.id }, data });
});

export const DELETE = handle(async (_req, { params }: { params: { id: string } }) => {
  const u = await requireUser();
  await load(params.id, u.id);
  await db.task.delete({ where: { id: params.id } });
  return { ok: true };
});
