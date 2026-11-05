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

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests. Please try again later.', retryAfter = 60) {
    super(message, 429);
    this.retryAfter = retryAfter;
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'Payment or active subscription required to perform this action', details = null) {
    super(message, 402, details);
    this.details = details;
  }
}

export class PaymentGatewayError extends AppError {
  constructor(message = 'Payment gateway communication failed', statusCode = 502, details = null) {
    super(message, statusCode, details);
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message = 'Database connection failed. Please verify your database host and credentials.') {
    super(message, 503);
  }
}

/**
 * Catches and standardizes API Route errors
 * @param {Error} error
 * @returns {import('next/server').NextResponse}
 */
export function handleApiError(error) {
  // Rethrow Next.js dynamic bail-out errors (e.g. cookies/headers accessed during build)
  if (error?.digest === 'DYNAMIC_SERVER_USAGE') {
    throw error;
  }

  // Handle Custom App Errors
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.errors);
  }

  // Handle Zod Validation Errors
  if (error instanceof ZodError) {
    const issues = error.issues || error.errors || [];
    const formattedErrors = issues.map((err) => ({
      field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || ''),
      message: err.message,
    }));
    return errorResponse('Validation failed', 400, formattedErrors);
  }

  // Handle Database Connection Errors (ENOTFOUND, ECONNREFUSED, HostNotFound)
  const isConnectionError =
    error.name === 'SequelizeConnectionError' ||
    error.name === 'SequelizeHostNotFoundError' ||
    error.name === 'SequelizeConnectionRefusedError' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.original?.code === 'ENOTFOUND' ||
    error.parent?.code === 'ENOTFOUND';

  if (isConnectionError) {
    const host = process.env.MYSQL_HOST || 'configured host';
    const isInfinityFree = host.includes('infinityfree.com');
    const tip = isInfinityFree
      ? ' Note: InfinityFree free MySQL blocks external remote connections. Use a local MySQL server (localhost:3306), Supabase, TiDB Cloud, or Aiven MySQL for local development.'
      : ' Please verify MYSQL_HOST, MYSQL_PORT, and network connectivity.';

    return errorResponse(
      `Database connection failed (${error.code || error.name || 'ENOTFOUND'} on ${host}).${tip}`,
      503
    );
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

  // Handle Raw Payment Gateway / Third-Party SDK Errors (e.g. Razorpay SDK raw objects: { statusCode: 401, error: 'Unauthorized' })
  if (
    error &&
    typeof error === 'object' &&
    !(error instanceof Error) &&
    ('statusCode' in error || 'error' in error || error.code === 'BAD_REQUEST_ERROR')
  ) {
    const rawStatus = typeof error.statusCode === 'number' ? error.statusCode : null;
    const rawError = error.error;
    let detailMessage = '';

    if (typeof rawError === 'string') {
      detailMessage = rawError;
    } else if (rawError && typeof rawError === 'object') {
      detailMessage = rawError.description || rawError.message || rawError.code || '';
    } else if (error.message) {
      detailMessage = error.message;
    }

    const isAuthError =
      rawStatus === 401 ||
      detailMessage.toLowerCase().includes('unauthorized') ||
      detailMessage.toLowerCase().includes('authentication failed');

    // eslint-disable-next-line no-console
    console.warn(`[Payment Gateway ${isAuthError ? 'Auth Warning' : 'Error'}]:`, error);

    const clientMsg = isAuthError
      ? 'Payment gateway authorization failed: The configured Razorpay credentials lack permissions for Subscriptions API (Subscriptions feature is not activated on this account). Please activate Subscriptions in your Razorpay Dashboard or contact support.'
      : detailMessage
      ? `Payment gateway error: ${detailMessage}`
      : 'Payment gateway communication failed';

    const httpStatus = isAuthError ? 502 : (rawStatus && rawStatus >= 400 && rawStatus < 600 ? rawStatus : 502);

    return errorResponse(clientMsg, httpStatus, rawError || null);
  }

  // Fallback for Unexpected Internal Server Errors
  // eslint-disable-next-line no-console
  console.error('[Unhandled API Error]:', error);

  const fallbackMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : (error && (error.message || error.error || error.description)) || 'Internal server error';

  return errorResponse(
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : fallbackMessage,
    500
  );
}
