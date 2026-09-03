import { errorResponse } from './response.js';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = null) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

/**
 * Catches and standardizes API Route errors
 * @param {Error} error
 * @returns {import('next/server').NextResponse}
 */
export function handleApiError(error) {
  // Handle Custom App Errors
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.errors);
  }

  // Handle Zod Validation Errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return errorResponse('Validation failed', 400, formattedErrors);
  }

  // Handle Sequelize Unique Constraint Error
  if (error.name === 'SequelizeUniqueConstraintError') {
    const fields = error.errors?.map((e) => e.path) || [];
    return errorResponse(`Duplicate entry for ${fields.join(', ')}`, 409);
  }

  // Handle Sequelize Foreign Key Error
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return errorResponse('Referenced record does not exist', 400);
  }

  // Handle Sequelize General Validation Error
  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors?.map((e) => e.message) || [error.message];
    return errorResponse('Database validation failed', 400, messages);
  }

  // Fallback for Unexpected Internal Server Errors
  // eslint-disable-next-line no-console
  console.error('[Unhandled API Error]:', error);

  return errorResponse(
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message || 'Internal server error',
    500
  );
}
