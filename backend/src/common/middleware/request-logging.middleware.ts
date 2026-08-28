import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LogLevel, LogManager } from '../logging/log-manager';

export interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new LogManager();

  use(request: Request, response: Response, next: NextFunction): void {
    const requestWithId = request as RequestWithId;
    requestWithId.requestId = randomUUID();
    response.setHeader('X-Request-Id', requestWithId.requestId);
    const startTime = Date.now();

    response.once('finish', () => {
      const level: LogLevel =
        response.statusCode >= 500 ? 'ERROR' : response.statusCode >= 400 ? 'WARN' : 'INFO';
      this.logger.write('application.log', {
        level,
        event: 'request_completed',
        requestId: requestWithId.requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        responseTimeMs: Date.now() - startTime,
      });
      console.log(
        'Logging middleware executed for requestId:',
        requestWithId.requestId,
        'Method:',
        request.method,
        'Path:',
        request.originalUrl,
        'Status Code:',
        response.statusCode,
      );
    });

    next();
  }
}
