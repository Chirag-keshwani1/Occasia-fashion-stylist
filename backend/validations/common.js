import { z } from "zod";

// Shared helper for optional filter query params across Product Search and
// AI Outfit Generation. Both APIs need the same rule: "Any", empty strings,
// null, and undefined all mean "no filter" — the frontend shouldn't have to
// omit a key just because a <select> defaulted to "Any".
//
// z.preprocess runs BEFORE the wrapped schema's own validation, so an enum
// field still gets to reject genuinely invalid values (e.g. "foo" for
// season) — we only strip out the "not really provided" sentinels here.
const NO_FILTER_VALUES = new Set(["any", "all", "", "null", "undefined"]);

export const emptyToUndefined = (val) => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "string") {
    const normalized = val.trim().toLowerCase();
    if (NO_FILTER_VALUES.has(normalized)) return undefined;
  }
  return val;
};

// Wrap any zod schema (enum, string, number, coerced number, etc.) so that
// "Any" / "" / null / undefined all resolve to `undefined` instead of
// failing validation or being treated as a real filter value.
export const optionalFilter = (schema) => z.preprocess(emptyToUndefined, schema.optional());
