import { verifyAccessToken } from "../utils/tokenUtils.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// Runs before any protected route. Checks for a valid access token in the
// Authorization header, and if it's good, attaches { id, role } to
// req.user so every controller after this can trust req.user is real.
export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Not authenticated");
  }

  const token = header.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid or expired token");
  }
};

// Like requireAuth, but never blocks the request.
// If a valid token is present → req.user is set.
// If no token or an invalid one → req.user stays undefined, request continues.
// Use this on public routes that OPTIONALLY benefit from knowing who the user is
// (e.g., recording recently viewed products, personalizing a guest response).
export const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.split(" ")[1];
    try {
      const decoded = verifyAccessToken(token);
      req.user = { id: decoded.id, role: decoded.role };
    } catch {
      // Invalid token on a public route — not an error, just ignore it
      req.user = undefined;
    }
  }
  next();
};
