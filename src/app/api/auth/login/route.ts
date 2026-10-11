import { db } from "@/lib/db";
import { checkPassword } from "@/lib/auth";
import { handle, HttpError, setSession } from "@/lib/api";
import { loginSchema } from "@/lib/validation";

export const POST = handle(async (req) => {
  const { email, password } = loginSchema.parse(await req.json());
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await checkPassword(password, user.password))) throw new HttpError(401, "Email ou mot de passe incorrect");
  await setSession(user);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
});
