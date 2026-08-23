// Wraps an async controller so any rejected promise (thrown error, failed
// await) is forwarded to next(err) automatically — no try/catch needed in
// any controller, anywhere in the app.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
