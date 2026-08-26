"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const log_manager_1 = require("../logging/log-manager");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    logger = new log_manager_1.LogManager();
    catch(exception, host) {
        const context = host.switchToHttp();
        const response = context.getResponse();
        const request = context.getRequest();
        const timestamp = new Date().toISOString();
        const statusCode = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
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
        });
    }
    getClientMessage(exception) {
        if (!(exception instanceof common_1.HttpException)) {
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
    hasMessage(value) {
        return (typeof value === 'object' &&
            value !== null &&
            'message' in value &&
            (typeof value.message === 'string' || Array.isArray(value.message)));
    }
    writeErrorLog(exception, request, statusCode, timestamp) {
        const category = this.getCategory(statusCode);
        const isServerError = statusCode >= common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        this.logger.write('error.log', {
            level: (isServerError ? 'ERROR' : 'WARN'),
            event: 'request_error',
            timestamp,
            requestId: request.requestId,
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
    getCategory(statusCode) {
        if (statusCode === common_1.HttpStatus.UNAUTHORIZED)
            return 'authentication';
        if (statusCode === common_1.HttpStatus.FORBIDDEN)
            return 'authorization';
        if (statusCode === common_1.HttpStatus.NOT_FOUND)
            return 'not_found';
        if (statusCode >= 400 && statusCode < 500)
            return 'client_error';
        return 'server_error';
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map