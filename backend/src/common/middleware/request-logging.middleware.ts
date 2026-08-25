import { appendFileSync, mkdirSync } from 'node:fs';
import { EOL } from 'node:os';
import { resolve } from 'node:path';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logDirectory = resolve(__dirname, '../../../logs');
  private readonly logFilePath = resolve(this.logDirectory, 'application.log');

  constructor() {
    mkdirSync(this.logDirectory, { recursive: true });
  }

  use(request: Request, response: Response, next: NextFunction): void {
    const startTime = Date.now();

    response.once('finish', () => {
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const responseTime = Date.now() - startTime;
      const logEntry = `[${timestamp}] ${request.method} ${request.originalUrl} | Status: ${response.statusCode} | Response Time: ${responseTime}ms${EOL}`;

      appendFileSync(this.logFilePath, logEntry, 'utf8');
    });

    next();
  }
}
