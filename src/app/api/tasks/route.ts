import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { handle, HttpError, requireMember, requireUser } from "@/lib/api";
import { taskCreateSchema, taskQuerySchema } from "@/lib/validation";

async function workspaceOfProject(projectId: string) {
  const p = await db.project.findUnique({ where: { id: projectId }, select: { workspaceId: true } });
  if (!p) throw new HttpError(404, "Projet introuvable");
  return p.workspaceId;
}

export const GET = handle(async (req) => {
  const u = await requireUser();
  const { projectId, q, status, priority, page, pageSize } = taskQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  await requireMember(u.id, await workspaceOfProject(projectId));
  const where: Prisma.TaskWhereInput = {
    projectId,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }),
  };
  const [items, total] = await db.$transaction([
    db.task.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.task.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
});

export const POST = handle(async (req) => {
  const u = await requireUser();
  const data = taskCreateSchema.parse(await req.json());
  await requireMember(u.id, await workspaceOfProject(data.projectId), "write");
  return NextResponse.json(await db.task.create({ data }), { status: 201 });
});
