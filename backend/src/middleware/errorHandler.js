// Central error handler.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Avoid leaking stack traces in production.
  const payload = {
    success: false,
    error: message,
  };
  if (process.env.NODE_ENV !== "production") {
    payload.debug = { stack: err.stack };
  }

  res.status(status).json(payload);
}

module.exports = { errorHandler };

