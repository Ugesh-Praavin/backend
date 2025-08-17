import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  status: string;
  message: string;
  timestamp: string;
}

@Injectable()
export class ErrorInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        data,
        status: 'success',
        message: 'Operation completed successfully',
        timestamp: new Date().toISOString(),
      })),
      catchError(error => {
        console.error('🚨 Error occurred:', error);
        
        if (error instanceof HttpException) {
          return throwError(() => error);
        }
        
        // Handle unexpected errors
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const message = 'Internal server error';
        
        return throwError(() => new HttpException({
          status,
          error: message,
          timestamp: new Date().toISOString(),
        }, status));
      }),
    );
  }
}
