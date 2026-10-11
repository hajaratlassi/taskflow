import { db } from "@/lib/db";
import { handle, HttpError, requireMember, requireUser } from "@/lib/api";

export const GET = handle(async (req) => {
  const u = await requireUser();
  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (!workspaceId) throw new HttpError(400, "workspaceId requis");
  await requireMember(u.id, workspaceId);
  const where = { project: { workspaceId } };
  const [byStatus, byPriority, projects, members] = await Promise.all([
    db.task.groupBy({ by: ["status"], where, _count: true }),
    db.task.groupBy({ by: ["priority"], where, _count: true }),
    db.project.count({ where: { workspaceId } }),
    db.workspaceMember.count({ where: { workspaceId } }),
  ]);
  const status = { TODO: 0, IN_PROGRESS: 0, DONE: 0 } as Record<string, number>;
  byStatus.forEach((r) => (status[r.status] = r._count));
  const total = Object.values(status).reduce((a, b) => a + b, 0);
  return {
    projects, members, total, status,
    priority: Object.fromEntries(byPriority.map((r) => [r.priority, r._count])),
    completion: total ? Math.round((status.DONE / total) * 100) : 0,
  };
});
