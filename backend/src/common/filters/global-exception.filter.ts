import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LogLevel, LogManager } from '../logging/log-manager';
import { RequestWithId } from '../middleware/request-logging.middleware';

interface ErrorResponseBody {
  success: false;
  timestamp: string;
  requestId?: string;
  statusCode: number;
  method: string;
  path: string;
  message: string | string[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new LogManager();

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithId>();
    const timestamp = new Date().toISOString();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.getClientMessage(exception);

    this.writeErrorLog(exception, request, statusCode, timestamp);

    response.status(statusCode).json({
      success: false,
      timestamp,
      statusCode,
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      message,
    } satisfies ErrorResponseBody);
  }

  private getClientMessage(exception: unknown): string | string[] {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (this.hasMessage(exceptionResponse)) {
      return exceptionResponse.message;
    }

    return exception.message;
  }

  private hasMessage(value: unknown): value is { message: string | string[] } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      (typeof value.message === 'string' || Array.isArray(value.message))
    );
  }

  private writeErrorLog(
    exception: unknown,
    request: Request,
    statusCode: number,
    timestamp: string,
  ): void {
    const category = this.getCategory(statusCode);
    const isServerError = statusCode >= HttpStatus.INTERNAL_SERVER_ERROR;
    this.logger.write('error.log', {
      level: (isServerError ? 'ERROR' : 'WARN') as LogLevel,
      event: 'request_error',
      timestamp,
      requestId: (request as RequestWithId).requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode,
      category,
      message: isServerError ? 'Internal server error' : this.getClientMessage(exception),
      ...(isServerError && exception instanceof Error && exception.stack
        ? { stack: exception.stack }
        : {}),
    });
  }

  private getCategory(statusCode: number): string {
    if (statusCode === HttpStatus.UNAUTHORIZED) return 'authentication';
    if (statusCode === HttpStatus.FORBIDDEN) return 'authorization';
    if (statusCode === HttpStatus.NOT_FOUND) return 'not_found';
    if (statusCode >= 400 && statusCode < 500) return 'client_error';
    return 'server_error';
  }
}
