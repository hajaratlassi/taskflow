import { describe, expect, it } from "vitest";
import { checkPassword, hashPassword, readToken, signToken } from "../src/lib/auth";

describe("auth", () => {
  it("hache et vérifie un mot de passe", async () => {
    const h = await hashPassword("secret123");
    expect(h).not.toBe("secret123");
    expect(await checkPassword("secret123", h)).toBe(true);
    expect(await checkPassword("autre", h)).toBe(false);
  });
  it("signe et relit un token JWT", async () => {
    const t = await signToken({ sub: "u1", role: "ADMIN" });
    expect(await readToken(t)).toMatchObject({ sub: "u1", role: "ADMIN" });
  });
  it("rejette un token invalide", async () => {
    expect(await readToken("abc.def.ghi")).toBeNull();
  });
});
