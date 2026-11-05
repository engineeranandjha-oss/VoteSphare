import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ZodError } from 'zod';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  DatabaseConnectionError,
  handleApiError,
} from '../lib/utils/error-handler.js';
import { successResponse, paginatedResponse, errorResponse } from '../lib/utils/response.js';

describe('VoteSphere Error Handler & Response Formatting Unit Tests', () => {
  describe('1. Custom Exception Hierarchy & Status Codes', () => {
    test('AppError sets default statusCode 500 and preserves error hierarchy', () => {
      const err = new AppError('Server error');
      assert.equal(err.message, 'Server error');
      assert.equal(err.statusCode, 500);
      assert.ok(err instanceof Error);
      assert.ok(err instanceof AppError);
    });

    test('ValidationError defaults to 400', () => {
      const err = new ValidationError('Bad data');
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, 'Bad data');
      assert.ok(err instanceof AppError);
    });

    test('UnauthorizedError defaults to 401', () => {
      const err = new UnauthorizedError();
      assert.equal(err.statusCode, 401);
      assert.equal(err.message, 'Authentication required');
    });

    test('ForbiddenError defaults to 403', () => {
      const err = new ForbiddenError('No permissions');
      assert.equal(err.statusCode, 403);
      assert.equal(err.message, 'No permissions');
    });

    test('NotFoundError defaults to 404', () => {
      const err = new NotFoundError('Election not found');
      assert.equal(err.statusCode, 404);
      assert.equal(err.message, 'Election not found');
    });

    test('ConflictError defaults to 409', () => {
      const err = new ConflictError('Slug already taken');
      assert.equal(err.statusCode, 409);
      assert.equal(err.message, 'Slug already taken');
    });

    test('TooManyRequestsError defaults to 429 with retryAfter field', () => {
      const err = new TooManyRequestsError('Rate limit exceeded', 120);
      assert.equal(err.statusCode, 429);
      assert.equal(err.retryAfter, 120);
    });

    test('DatabaseConnectionError defaults to 503', () => {
      const err = new DatabaseConnectionError();
      assert.equal(err.statusCode, 503);
    });
  });

  describe('2. handleApiError Exception Translation', () => {
    test('converts AppError into standardized JSON response with correct status', async () => {
      const err = new NotFoundError('Voter roster not found');
      const response = handleApiError(err);
      assert.equal(response.status, 404);

      const json = await response.json();
      assert.equal(json.success, false);
      assert.equal(json.message, 'Voter roster not found');
    });

    test('converts ZodError into 400 status with mapped field error details', async () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['title'],
          message: 'Title is required',
        },
      ]);
      const response = handleApiError(zodError);
      assert.equal(response.status, 400);

      const json = await response.json();
      assert.equal(json.success, false);
      assert.equal(json.message, 'Validation failed');
      assert.equal(json.errors[0].field, 'title');
      assert.equal(json.errors[0].message, 'Title is required');
    });

    test('handles SequelizeUniqueConstraintError as 409 Conflict', async () => {
      const seqErr = new Error('Validation error');
      seqErr.name = 'SequelizeUniqueConstraintError';
      seqErr.errors = [{ path: 'email' }];

      const response = handleApiError(seqErr);
      assert.equal(response.status, 409);

      const json = await response.json();
      assert.equal(json.success, false);
      assert.ok(json.message.includes('Duplicate entry for email'));
    });

    test('handles database connectivity errors as 503 Service Unavailable', async () => {
      const connErr = new Error('connect ECONNREFUSED 127.0.0.1:3306');
      connErr.code = 'ECONNREFUSED';

      const response = handleApiError(connErr);
      assert.equal(response.status, 503);

      const json = await response.json();
      assert.equal(json.success, false);
      assert.ok(json.message.includes('Database connection failed'));
    });
  });

  describe('3. Standard Response Format Builders', () => {
    test('successResponse constructs standardized success envelope', async () => {
      const response = successResponse({ id: '123', status: 'live' }, 'Election fetched', 200);
      assert.equal(response.status, 200);

      const json = await response.json();
      assert.equal(json.success, true);
      assert.equal(json.message, 'Election fetched');
      assert.equal(json.data.id, '123');
    });

    test('paginatedResponse calculates totalPages correctly and envelopes items', async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const response = paginatedResponse(items, { total: 25, page: 2, limit: 10 });
      assert.equal(response.status, 200);

      const json = await response.json();
      assert.equal(json.success, true);
      assert.equal(json.data.length, 3);
      assert.equal(json.pagination.total, 25);
      assert.equal(json.pagination.page, 2);
      assert.equal(json.pagination.limit, 10);
      assert.equal(json.pagination.totalPages, 3);
    });

    test('errorResponse sets status and custom error payloads', async () => {
      const response = errorResponse('Unauthorized access', 401, { code: 'TOKEN_EXPIRED' });
      assert.equal(response.status, 401);

      const json = await response.json();
      assert.equal(json.success, false);
      assert.equal(json.message, 'Unauthorized access');
      assert.equal(json.errors.code, 'TOKEN_EXPIRED');
    });
  });
});
