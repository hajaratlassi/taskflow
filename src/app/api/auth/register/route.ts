import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { handle, HttpError, setSession } from "@/lib/api";
import { registerSchema } from "@/lib/validation";

export const POST = handle(async (req) => {
  const data = registerSchema.parse(await req.json());
  if (await db.user.findUnique({ where: { email: data.email } })) throw new HttpError(409, "Cet email est déjà utilisé");
  const isFirst = (await db.user.count()) === 0; // le premier inscrit devient ADMIN
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hashPassword(data.password),
      role: isFirst ? "ADMIN" : "MEMBER",
      memberships: { create: { role: "OWNER", workspace: { create: { name: "Mon espace" } } } },
    },
    select: { id: true, email: true, name: true, role: true },
  });
  await setSession(user);
  return NextResponse.json(user, { status: 201 });
});
