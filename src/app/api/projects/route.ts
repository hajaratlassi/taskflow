import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError, requireMember, requireUser } from "@/lib/api";
import { projectSchema } from "@/lib/validation";

export const GET = handle(async (req) => {
  const u = await requireUser();
  const workspaceId = new URL(req.url).searchParams.get("workspaceId");

  if (!workspaceId) {
    throw new HttpError(400, "workspaceId requis");
  }

  await requireMember(u.id, workspaceId);

  return db.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
});

export const POST = handle(async (req) => {
  const u = await requireUser();
  const { name, workspaceId } = projectSchema.parse(await req.json());

  await requireMember(u.id, workspaceId, "write");

  return NextResponse.json(
    await db.project.create({ data: { name, workspaceId } }),
    { status: 201 }
  );
});