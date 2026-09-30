const express = require('express');

// Global error handler (mounted last in server.js).
//
// The error MESSAGE is only forwarded to the client when the error is a
// *curated application* error. This app's own error classes (AiServiceError,
// SessionError) always attach an explicit `statusCode` and carry a deliberately
// user-safe message - e.g. aiClient.js keeps the raw provider failure on
// `providerError` and comments that it is "never surfaced to end users". Any
// 4xx is likewise a deliberate, client-facing response.
//
// Everything else (Mongo/driver, Cloudinary, multer, fs, cast errors, or a bare
// `new Error(...)` that escaped a route) has NO `statusCode` and is treated as
// internal: in production the response carries a generic message, so database
// hosts and connection strings, filesystem paths, driver internals, upstream
// provider detail and credentials are never disclosed to the client.
//
// The full stack is logged server-side in EVERY environment, so diagnostics are
// never lost - only the client-facing text is sanitized. `stack` is attached to
// the body in development only, as before.
function errorHandler(err, req, res, next) {
  console.error(err.stack || err);
  const status = err.statusCode || err.status || 500;
  const isCuratedAppError = Boolean(err.statusCode) || (status >= 400 && status < 500);
  const isDev = process.env.NODE_ENV !== 'production';
  const exposeMessage = isCuratedAppError || isDev;
  res.status(status).json({
    success: false,
    message: exposeMessage ? (err.message || 'Internal Server Error') : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;