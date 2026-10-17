import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { assertValidDocumentSignature, removeStoredUpload } from '../documents/document-storage';

@Injectable()
export class InspectionEvidenceCleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const files = (Array.isArray(request.files) ? request.files : []) as Express.Multer.File[];

    try {
      files.forEach(assertValidDocumentSignature);
    } catch (error) {
      this.removeFiles(files);
      throw error;
    }

    return next.handle().pipe(
      catchError((error: unknown) => {
        if (!request.inspectionEvidencePersisted) this.removeFiles(files);
        return throwError(() => error);
      }),
    );
  }

  private removeFiles(files: Express.Multer.File[]): void {
    files.forEach((file) => {
      if (!file.path) return;
      try {
        removeStoredUpload(file.path);
      } catch {
        // Preserve the original request failure and avoid exposing cleanup details.
      }
    });
  }
}
