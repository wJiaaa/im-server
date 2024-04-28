/*
 * @Description: 返回时间拦截器用来将返回值当中的时间换成传入的format格式
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as dayjs from 'dayjs';

@Injectable()
export class DateFormatInterceptor implements NestInterceptor {
  constructor(private readonly format: string = 'YYYY-MM-DD') {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (Array.isArray(data)) {
          return data.map((item) => this.transform(item));
        }
        return this.transform(data);
      })
    );
  }

  private transform(data: any) {
    if (typeof data === 'object' && data !== null) {
      Object.keys(data).forEach((key) => {
        if (data[key] instanceof Date) {
          // data[key] = dayjs(data[key]).format(this.format).valueOf();
          data[key] = dayjs(data[key]).valueOf();
        } else if (typeof data[key] === 'object' && data[key] !== null) {
          this.transform(data[key]);
        }
      });
    }
    return data;
  }
}
