import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { assertValidDocumentSignature, removeStoredUpload } from './document-storage';

@Injectable()
export class DocumentUploadCleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const file = request.file as Express.Multer.File | undefined;

    try {
      if (file) assertValidDocumentSignature(file);
    } catch (error) {
      this.removeFile(file);
      throw error;
    }

    return next.handle().pipe(
      catchError((error: unknown) => {
        this.removeFile(file);
        return throwError(() => error);
      }),
    );
  }

  private removeFile(file?: Express.Multer.File): void {
    if (!file?.path) return;
    try {
      removeStoredUpload(file.path);
    } catch {
      // Preserve the original request failure and never expose cleanup details.
    }
  }
}
