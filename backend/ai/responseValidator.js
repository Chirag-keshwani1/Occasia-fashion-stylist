// This file's entire job is distrust: the AI's raw output is treated as
// untrusted input, exactly like a user's form submission would be. Even
// though the prompt SAYS "only use these ids," models occasionally don't
// follow instructions perfectly — this is the hard backstop that makes
// hallucinated/invented products structurally impossible to slip through,
// regardless of what the model actually returns.

export const parseAiResponse = (rawContent) => {
  try {
    return JSON.parse(rawContent);
  } catch {
    return null; // caller treats this as "AI response was not valid JSON"
  }
};

// Every candidate id the AI was actually given, flattened into one set —
// this is the single source of truth for "is this a real option."
const buildValidIdSet = (byCategory) => {
  const ids = new Set();
  for (const items of Object.values(byCategory)) {
    for (const item of items) {
      ids.add(item._id.toString());
    }
  }
  return ids;
};

// Filters the AI's selections down to ONLY ones that were genuinely in
// the candidate list. Anything else — an invented id, a typo, a
// completely different product — is silently dropped rather than trusted.
export const validateSelections = (selections, byCategory) => {
  if (!Array.isArray(selections)) return [];

  const validIds = buildValidIdSet(byCategory);

  return selections.filter(
    (s) =>
      s &&
      typeof s.productId === "string" &&
      typeof s.category === "string" &&
      validIds.has(s.productId)
  );
};

/**
 * Validate the multi-outfit AI response.
 * Each outfit in the array is validated against its own candidate pool.
 * Returns an array of validated outfit objects (invalid ones filtered out).
 *
 * @param {object} parsed - The parsed JSON from the AI (must have .outfits array)
 * @param {Array}  stylesCandidates - Array of { styleName, byCategory } objects
 * @returns {Array} Array of validated outfit objects with their style metadata
 */
export const validateMultiOutfitResponse = (parsed, stylesCandidates) => {
  if (!parsed || !Array.isArray(parsed.outfits)) return [];

  // Build a lookup map from styleName (lowercased) → byCategory for fast validation
  const styleMap = new Map(stylesCandidates.map((s) => [s.styleName.toLowerCase(), s.byCategory]));

  const validated = [];

  for (const outfit of parsed.outfits) {
    const queryStyle = outfit.styleName.toLowerCase().replace(" style", "").trim();
    // Find a matching style key
    let matchedKey = null;
    for (const key of styleMap.keys()) {
      if (key.includes(queryStyle) || queryStyle.includes(key)) {
        matchedKey = key;
        break;
      }
    }
    const byCategory = matchedKey ? styleMap.get(matchedKey) : null;
    if (!byCategory) continue; // AI returned a style name we didn't send

    const validSelections = validateSelections(outfit.selections, byCategory);
    if (validSelections.length === 0) continue; // outfit had zero valid products

    validated.push({
      styleName: outfit.styleName,
      selections: validSelections,
      rationale: typeof outfit.rationale === "string" ? outfit.rationale.slice(0, 500) : "",
      stylingTip: typeof outfit.stylingTip === "string" ? outfit.stylingTip.slice(0, 300) : "",
    });
  }

  return validated;
};
