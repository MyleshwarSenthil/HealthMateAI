import { describe, expect, it } from "vitest";
import { cleanHealthText, needsUrgentHelp, urgentHelpReply } from "./healthSafety";

describe("health safety contract", () => {
  it("routes emergency-style language to urgent-care guidance", () => {
    expect(needsUrgentHelp("I have severe chest pain and trouble breathing")).toBe(true);
    expect(urgentHelpReply()).toContain("emergency");
  });

  it("does not flag a general educational question as urgent", () => {
    expect(needsUrgentHelp("How can I prepare questions for a routine check-up?")).toBe(false);
  });

  it("normalizes and limits health text before sending it onward", () => {
    expect(cleanHealthText("  hello\n\nhealth  ")).toBe("hello health");
    expect(cleanHealthText("a".repeat(1600))).toHaveLength(1400);
  });
});
