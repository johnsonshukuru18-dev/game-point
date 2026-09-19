import { describe, it, expect } from "vitest";
import { generateBattleCodeString } from "@/lib/utils";

describe("generateBattleCodeString", () => {
  it("generates a code with the expected game prefix", () => {
    const code = generateBattleCodeString("efootball");
    expect(code.startsWith("EF-")).toBe(true);
  });

  it("generates a 6-character suffix using only unambiguous characters", () => {
    const code = generateBattleCodeString("call-of-duty");
    const suffix = code.split("-")[1];
    expect(suffix).toHaveLength(6);
    expect(suffix).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it("falls back to a derived prefix for unknown game slugs", () => {
    const code = generateBattleCodeString("some-new-game");
    expect(code.startsWith("SOM-")).toBe(true);
  });

  it("generates different codes across calls (extremely unlikely to collide)", () => {
    const a = generateBattleCodeString("gta-v");
    const b = generateBattleCodeString("gta-v");
    expect(a).not.toBe(b);
  });
});
