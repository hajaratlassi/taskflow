import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me");

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const checkPassword = (p: string, h: string) => bcrypt.compare(p, h);

export async function signToken(payload: { sub: string; role: string }) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret());
}

export async function readToken(token: string): Promise<{ sub: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as { sub: string; role: string };
  } catch {
    return null;
  }
}
