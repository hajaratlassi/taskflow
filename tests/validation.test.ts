import { describe, expect, it } from "vitest";
import { registerSchema, taskQuerySchema, taskUpdateSchema } from "../src/lib/validation";

describe("validation", () => {
  it("normalise l'email à l'inscription", () => {
    const r = registerSchema.parse({ name: "Sara", email: "  SARA@Mail.com ", password: "motdepasse" });
    expect(r.email).toBe("sara@mail.com");
  });
  it("refuse un mot de passe trop court", () => {
    expect(registerSchema.safeParse({ name: "Sara", email: "a@b.co", password: "123" }).success).toBe(false);
  });
  it("applique les valeurs de pagination par défaut", () => {
    expect(taskQuerySchema.parse({ projectId: "p1" })).toMatchObject({ page: 1, pageSize: 12 });
  });
  it("limite pageSize à 100", () => {
    expect(taskQuerySchema.safeParse({ projectId: "p1", pageSize: 500 }).success).toBe(false);
  });
  it("refuse une mise à jour vide ou un statut inconnu", () => {
    expect(taskUpdateSchema.safeParse({}).success).toBe(false);
    expect(taskUpdateSchema.safeParse({ status: "NOPE" }).success).toBe(false);
    expect(taskUpdateSchema.safeParse({ status: "DONE" }).success).toBe(true);
  });
});
