import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  path: string;
  timestamp: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => ({
        statusCode,
        path: request.url,
        timestamp: new Date().toISOString(),
        // إذا كانت البيانات تحتوي بالفعل على حقول النجاح، ندمجها، وإلا نضعها في حقل data
        ...(typeof data === 'object' && data !== null ? data : { data }),
      })),
    );
  }
}
