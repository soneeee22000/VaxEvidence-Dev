import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("smoke test", () => {
  it("vitest runs with @/ path aliases", () => {
    expect(true).toBe(true);
  });

  it("cn() merges class names correctly", () => {
    const result = cn("px-4", "py-2", "px-6");
    expect(result).toBe("py-2 px-6");
  });
});
