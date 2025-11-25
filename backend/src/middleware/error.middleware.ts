import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

/**
 * Global error handler
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Log error
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      method: request.method,
      url: request.url,
      statusCode: error.statusCode,
    },
    'Request error'
  );

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Build error response
  const response: ApiResponse = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    meta: {
      timestamp: new Date(),
      requestId: request.id,
    },
  };

  // Send response
  reply.status(statusCode).send(response);
}

/**
 * Not found handler
 */
export function notFoundHandler(request: FastifyRequest, reply: FastifyReply): void {
  const response: ApiResponse = {
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
    meta: {
      timestamp: new Date(),
      requestId: request.id,
    },
  };

  reply.status(404).send(response);
}

/**
 * Validation error handler
 */
export function validationErrorHandler(
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Attempt to extract useful fields from the validation error
  let message = 'Validation failed';
  let details: unknown = undefined;

  if (typeof error === 'object' && error !== null) {
  const errObj = error as { message?: string; validation?: unknown; errors?: unknown };
  message = errObj.message || message;
  details = errObj.validation ?? errObj.errors ?? undefined;
  } else if (typeof error === 'string') {
    message = error;
  }

  logger.warn({ message, details, method: request.method, url: request.url }, 'Validation error');

  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code: 'VALIDATION_ERROR',
      details,
    },
    meta: {
      timestamp: new Date(),
      requestId: request.id,
    },
  };

  reply.status(400).send(response);
}
