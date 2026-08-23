// One reusable middleware for every route — pass it a schema, it checks
// req.body against that schema. If it fails, it responds with exactly
// which fields were wrong. If it passes, req.body gets replaced with the
// cleaned/typed version (e.g. trimmed strings, lowercased email).
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;
  next();
};

// Same idea, but for query string parameters (e.g. GET /products?season=summer).
// Kept separate from `validate` because req.query and req.body need
// different handling — query values always arrive as strings, so schemas
// used here rely on z.coerce to convert them.
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: result.error.flatten().fieldErrors,
    });
  }

  Object.assign(req.query, result.data);
  next();
};
