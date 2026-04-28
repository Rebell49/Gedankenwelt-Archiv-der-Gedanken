import { ZodError } from 'zod';
import { randomUUID } from 'crypto';

export const success = (res, payload, status = 200) => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return res.status(status).json({ success: true, ...payload });
  }
  return res.status(status).json({ success: true, data: payload });
};

export const error = (res, message, code = 400) => {
  return res.status(code).json({ success: false, error: message });
};

export const errorHandler = (err, req, res, next) => {
  const traceId = req.traceId || randomUUID();
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      traceId,
      error: 'Validation Error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      traceId,
      error: 'Invalid Token',
      message: 'Token is invalid or expired',
    });
  }

  // Custom API errors
  if (err.isOperational) {
    return res.status(status).json({
      success: false,
      traceId,
      error: err.name || 'Error',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Unexpected errors
  console.error('[ERROR]', {
    traceId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    status,
    message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    traceId,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development'
      ? message
      : 'An unexpected error occurred',
  });
};

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.status = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
