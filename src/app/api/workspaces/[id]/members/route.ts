import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError, requireMember, requireUser } from "@/lib/api";
import { memberSchema } from "@/lib/validation";

export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const u = await requireUser();
  await requireMember(u.id, params.id, "owner");
  const { email, role } = memberSchema.parse(await req.json());
  const target = await db.user.findUnique({ where: { email } });
  if (!target) throw new HttpError(404, "Aucun utilisateur avec cet email");
  const m = await db.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: target.id, workspaceId: params.id } },
    update: { role },
    create: { userId: target.id, workspaceId: params.id, role },
  });
  return NextResponse.json(m, { status: 201 });
});
