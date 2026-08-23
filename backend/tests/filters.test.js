/**
 * Unit tests: flexible/optional filter validation (Task 1).
 *
 * Pure zod schema tests — no database needed. Confirms "Any", empty
 * strings, null, and undefined are all treated as "no filter" for both
 * the Product Search API and the AI Outfit Generation API, while genuinely
 * invalid values are still rejected.
 */
import { describe, it, expect } from "@jest/globals";
import { productQuerySchema } from "../validations/productValidation.js";
import { outfitContextSchema } from "../validations/outfitValidation.js";

describe("Product Search filters: optional / 'no filter' handling", () => {
  it("accepts an empty query and defaults sort/page/limit", () => {
    const result = productQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ sort: "newest", page: 1, limit: 12 });
  });

  it("treats 'Any', '', null, and undefined as no filter for every optional field", () => {
    const result = productQuerySchema.safeParse({
      season: "Any",
      occasion: "",
      category: null,
      gender: undefined,
      style: "any",
      color: "",
      brand: "",
      formality: "",
      destination: "ANY",
      minPrice: "",
      maxPrice: "",
      search: "",
    });
    expect(result.success).toBe(true);
    // None of the "no filter" sentinels should survive into the parsed output
    expect(result.data).toEqual({ sort: "newest", page: 1, limit: 12 });
  });

  it("still applies real filter values and coerces numeric query params", () => {
    const result = productQuerySchema.safeParse({
      season: "summer",
      gender: "women",
      brand: "Zara",
      formality: "3",
      minPrice: "500",
      maxPrice: "3000",
    });
    expect(result.success).toBe(true);
    expect(result.data.season).toBe("summer");
    expect(result.data.gender).toBe("women");
    expect(result.data.formality).toBe(3);
    expect(result.data.minPrice).toBe(500);
    expect(result.data.maxPrice).toBe(3000);
  });

  it("still rejects genuinely invalid enum values", () => {
    const result = productQuerySchema.safeParse({ season: "monsoon" });
    expect(result.success).toBe(false);
  });

  it("any combination of filters can be sent without validation errors", () => {
    const combos = [
      { category: "top" },
      { gender: "men", style: "streetwear" },
      { color: "black", brand: "H&M", formality: "4" },
      { destination: "Goa" },
      { minPrice: "0", maxPrice: "10000" },
      { season: "winter", occasion: "work", category: "outerwear", gender: "unisex" },
    ];
    for (const query of combos) {
      expect(productQuerySchema.safeParse(query).success).toBe(true);
    }
  });
});

describe("AI Outfit Generation filters: all optional", () => {
  it("accepts an entirely empty context (season/occasion no longer required)", () => {
    const result = outfitContextSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({});
  });

  it("treats 'Any' the same way as Product Search", () => {
    const result = outfitContextSchema.safeParse({ season: "Any", occasion: "Any", style: "" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({});
  });

  it("accepts the new gender/style/color/brand/formality/category filters together", () => {
    const result = outfitContextSchema.safeParse({
      season: "winter",
      occasion: "work",
      gender: "men",
      style: "minimal",
      color: "navy",
      brand: "Zara",
      formality: "4",
      category: "top",
    });
    expect(result.success).toBe(true);
    expect(result.data.gender).toBe("men");
    expect(result.data.style).toBe("minimal");
    expect(result.data.formality).toBe(4);
  });
});
