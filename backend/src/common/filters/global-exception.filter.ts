import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { appendFileSync, mkdirSync } from 'node:fs';
import { EOL } from 'node:os';
import { resolve } from 'node:path';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  success: false;
  timestamp: string;
  statusCode: number;
  method: string;
  path: string;
  message: string | string[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logDirectory = resolve(__dirname, '../../../logs');
  private readonly logFilePath = resolve(this.logDirectory, 'error.log');

  constructor() {
    mkdirSync(this.logDirectory, { recursive: true });
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
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
    const errorName = exception instanceof Error ? exception.name : 'UnknownError';
    const errorMessage = exception instanceof Error ? exception.message : 'Unknown exception';
    const stack = exception instanceof Error && exception.stack ? `${EOL}${exception.stack}` : '';
    const logEntry = `[${timestamp}] ${request.method} ${request.originalUrl} | Status: ${statusCode} | ${errorName}: ${errorMessage}${stack}${EOL}`;

    appendFileSync(this.logFilePath, logEntry, 'utf8');
  }
}
