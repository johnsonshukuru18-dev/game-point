import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "@/lib/auth";

describe("password hashing", () => {
  it("hashes a password and verifies the correct password against it", async () => {
    const hash = await hashPassword("Demo1234!");
    expect(await verifyPassword("Demo1234!", hash)).toBe(true);
  });

  it("rejects an incorrect password against a real hash", async () => {
    const hash = await hashPassword("Demo1234!");
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("never stores the plain-text password in the hash", async () => {
    const hash = await hashPassword("Demo1234!");
    expect(hash).not.toContain("Demo1234!");
  });
});

describe("session tokens", () => {
  it("round-trips a valid session payload", () => {
    const token = createSessionToken({ userId: "u1", username: "kelvin" });
    const payload = verifySessionToken(token);
    expect(payload?.userId).toBe("u1");
    expect(payload?.username).toBe("kelvin");
  });

  it("rejects a tampered/invalid token", () => {
    const payload = verifySessionToken("not.a.real.token");
    expect(payload).toBeNull();
  });
});
