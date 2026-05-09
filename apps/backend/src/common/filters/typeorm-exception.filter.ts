// src/common/filters/typeorm-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

// Interface for PostgreSQL error structure
interface PostgresError {
  code: string;
  detail: string;
}

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const driverError = exception.driverError as unknown as PostgresError;

    let statusCode: HttpStatus;
    let message: string;
    let error: string;

    switch (driverError.code) {
      case '23505': // unique_violation
        statusCode = HttpStatus.CONFLICT;
        message = 'A record with this value already exists.';
        error = 'Conflict';
        break;

      case '23503': // foreign_key_violation
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference — related entity does not exist.';
        error = 'Bad Request';
        break;

      case '23502': // not_null_violation
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'A required field is missing.';
        error = 'Bad Request';
        break;

      case '22P02': // invalid_text_representation
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'The format of one of the submitted values is incorrect.';
        error = 'Bad Request';
        break;

      default:
        // Any other unhandled database error
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'An unexpected database error occurred.';
        error = 'Internal Server Error';
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
    });
  }
}
