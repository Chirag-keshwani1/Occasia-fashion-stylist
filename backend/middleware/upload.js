import multer from "multer";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// Use memory storage — buffers stay in RAM and get piped directly to
// Cloudinary's upload stream. No temp files are ever written to disk,
// which keeps the server clean and works correctly in containerized
// and serverless environments.
const storage = multer.memoryStorage();

// Whitelist of MIME types we'll accept. Anything outside this list —
// PDFs, executables, zip files — is rejected immediately with a clear
// error before the bytes even reach our upload logic.
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_MB = 5;

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // convert MB → bytes
    files: 5, // max 5 images per product upload request
  },
});
