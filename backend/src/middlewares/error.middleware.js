export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const msg = err.message || "Internal Server Error";
  if (status >= 500) console.error("[error]", err);
  res.status(status).json({ ok: false, error: msg });
};