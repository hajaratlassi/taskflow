import { db } from "@/lib/db";
import { handle, HttpError, requireUser } from "@/lib/api";

export const GET = handle(async () => {
  const me = await requireUser();
  if (me.role !== "ADMIN") throw new HttpError(403, "Réservé aux administrateurs");
  return db.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true }, orderBy: { createdAt: "desc" } });
});
