import { describe, it, expect } from "vitest";
import { insertPlaceSchema } from "./places.zod";

describe("places schema", () => {
  it("accepts valid place data", () => {
    const input = {
      name: "Test Place",
    };
    const result = insertPlaceSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Test Place");
    }
  });

  it("rejects invalid place data", () => {
    const input = {
      name: "",
    };
    const result = insertPlaceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("handles null name", () => {
    const input = {
      name: null,
    };
    const result = insertPlaceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("parse returns typed data", () => {
    const data = insertPlaceSchema.parse({
      name: "Test Place",
    });
    expect(data.name).toBe("Test Place");
  });

  it("parse throws on invalid input", () => {
    expect(() => insertPlaceSchema.parse({ name: "A" })).toThrow();
  });
});
