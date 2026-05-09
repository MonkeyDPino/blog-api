// src/common/filters/typeorm-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

// Interfaz para la estructura del error de PostgreSQL
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
        message = 'Hubo un conflicto con los datos enviados.';
        error = 'Conflict';
        break;

      case '23503': // foreign_key_violation
        statusCode = HttpStatus.BAD_REQUEST;
        message = `La referencia a otra entidad no es válida. Detalles: ${driverError.detail}`;
        error = 'Bad Request';
        break;

      case '23502': // not_null_violation
        statusCode = HttpStatus.BAD_REQUEST;
        message = `Un campo requerido está vacío. Detalles: ${driverError.detail}`;
        error = 'Bad Request';
        break;

      case '22P02': // invalid_text_representation
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'El formato de uno de los valores enviados es incorrecto.';
        error = 'Bad Request';
        break;

      default:
        // Para cualquier otro error de base de datos no manejado explícitamente
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Ha ocurrido un error inesperado en la base de datos.';
        error = 'Internal Server Error';
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
    });
  }
}
