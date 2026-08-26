import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
export interface RequestWithId extends Request {
    requestId?: string;
}
export declare class RequestLoggingMiddleware implements NestMiddleware {
    private readonly logger;
    use(request: Request, response: Response, next: NextFunction): void;
}
