import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, requireUser } from "@/lib/api";
import { workspaceSchema } from "@/lib/validation";

export const GET = handle(async () => {
  const u = await requireUser();
  const rows = await db.workspaceMember.findMany({ where: { userId: u.id }, include: { workspace: true } });
  return rows.map((m) => ({ id: m.workspace.id, name: m.workspace.name, role: m.role }));
});

export const POST = handle(async (req) => {
  const u = await requireUser();
  const { name } = workspaceSchema.parse(await req.json());
  const ws = await db.workspace.create({ data: { name, members: { create: { userId: u.id, role: "OWNER" } } } });
  return NextResponse.json({ id: ws.id, name: ws.name, role: "OWNER" }, { status: 201 });
});
