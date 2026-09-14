import { NextResponse } from 'next/server.js';

/**
 * Creates a standardized successful JSON response
 * @param {any} data
 * @param {string} message
 * @param {number} statusCode
 * @returns {NextResponse}
 */
export function successResponse(data = null, message = 'Success', statusCode = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status: statusCode }
  );
}

/**
 * Creates a standardized paginated JSON response
 * @param {Array<any>} items
 * @param {{ total: number, page: number, limit: number, totalPages: number }} pagination
 * @param {string} message
 * @returns {NextResponse}
 */
export function paginatedResponse(items = [], pagination = {}, message = 'Success') {
  return NextResponse.json(
    {
      success: true,
      message,
      data: items,
      pagination: {
        total: pagination.total || 0,
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        totalPages: pagination.totalPages || Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      },
    },
    { status: 200 }
  );
}

/**
 * Creates a standardized error JSON response
 * @param {string} message
 * @param {number} statusCode
 * @param {any} errors
 * @returns {NextResponse}
 */
export function errorResponse(message = 'An error occurred', statusCode = 500, errors = null) {
  const body = {
    success: false,
    message,
  };

  if (errors) {
    body.errors = errors;
  }

  return NextResponse.json(body, { status: statusCode });
}
