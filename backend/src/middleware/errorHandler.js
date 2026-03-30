/**
 * Global error handler middleware.
 */
module.exports = function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
