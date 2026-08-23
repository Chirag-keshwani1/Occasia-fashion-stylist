import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// Used after requireAuth, e.g. requireRole("admin"). Checks req.user.role
// — which came from the verified JWT, not anything the client can fake —
// so this is a real server-side permission check, not just a UI hint.
export const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, "You don't have permission to do this");
    }
    next();
  };
