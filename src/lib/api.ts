
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { db } from "./db";
import { readToken, signToken } from "./auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (req: Request, ctx: any) => Promise<unknown>;

export function handle(fn: Handler) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: Request, ctx: any) => {
    try {
      const out = await fn(req, ctx);
      return out instanceof Response ? out : NextResponse.json(out);
    } catch (e) {
      if (e instanceof ZodError) {
        return NextResponse.json(
          { error: "Données invalides", details: e.flatten() },
          { status: 400 }
        );
      }

      if (e instanceof HttpError) {
        return NextResponse.json(
          { error: e.message },
          { status: e.status }
        );
      }

      console.error(e);
      return NextResponse.json(
        { error: "Erreur interne" },
        { status: 500 }
      );
    }
  };
}

export async function setSession(user: {
  id: string;
  role: string;
}) {
  const token = await signToken({
    sub: user.id,
    role: user.role,
  });

  (await cookies()).set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 604800,
  });
}

export async function currentUser() {
  const t = (await cookies()).get("token")?.value;
  const p = t ? await readToken(t) : null;

  if (!p) return null;

  return db.user.findUnique({
    where: { id: p.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
}

export async function requireUser() {
  const u = await currentUser();

  if (!u) {
    throw new HttpError(401, "Non authentifié");
  }

  return u;
}

/**
 * Vérifie l'appartenance au workspace.
 * write=true exige EDITOR/OWNER, owner=true exige OWNER.
 */
export async function requireMember(
  userId: string,
  workspaceId: string,
  level: "read" | "write" | "owner" = "read"
) {
  const m = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!m) {
    throw new HttpError(403, "Accès refusé à cet espace");
  }

  if (level === "write" && m.role === "VIEWER") {
    throw new HttpError(403, "Lecture seule");
  }

  if (level === "owner" && m.role !== "OWNER") {
    throw new HttpError(403, "Réservé au propriétaire");
  }

  return m;
}
