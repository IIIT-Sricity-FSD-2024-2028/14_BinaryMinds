import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LogManager } from '../logging/log-manager';
import { RequestWithId } from './request-logging.middleware';

export interface RouteAccessContext {
  area: 'applications';
  method: string;
  path: string;
  receivedAt: string;
}

export interface RequestWithRouteAccessContext extends RequestWithId {
  routeAccessContext?: RouteAccessContext;
}

@Injectable()
export class RouteAccessMiddleware implements NestMiddleware {
  private readonly logger = new LogManager();

  use(req: Request, res: Response, next: NextFunction): void {
    const request = req as RequestWithRouteAccessContext;
    const routeAccessContext: RouteAccessContext = {
      area: 'applications',
      method: request.method,
      path: request.originalUrl,
      receivedAt: new Date().toISOString(),
    };

    request.routeAccessContext = routeAccessContext;
    res.setHeader('X-Route-Middleware', 'applications');
    this.logger.write('application.log', {
      level: 'INFO',
      event: 'route_accessed',
      requestId: request.requestId,
      ...routeAccessContext,
    });
    console.log(
      `Route-level middleware executed for ${routeAccessContext.method} ${routeAccessContext.path}`,
    );
    next();
  }
}
