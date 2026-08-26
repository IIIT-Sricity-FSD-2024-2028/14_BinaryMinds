import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
    private getClientMessage;
    private hasMessage;
    private writeErrorLog;
    private getCategory;
}
