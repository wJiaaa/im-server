/*
 * @Description: 响应拦截器(返回统一成功响应的格式)
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { NestInterceptor, ExecutionContext, CallHandler, Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';
import * as dayjs from 'dayjs'; // 处理时间的工具
import { instanceToPlain } from 'class-transformer';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { LoggerService } from '../logger/logger.service';
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) { }
  intercept(context: ExecutionContext, next: CallHandler<any>): import('rxjs').Observable<any> {
    // Do nothing if this is a RabbitMQ event
    if (isRabbitContext(context)) {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest();
    /**当前请求路径 */
    const url = request.url;
    /**当前请求参数 */
    const body = request.body;
    return next.handle().pipe(
      map((content) => {
        const message = {
          startTime: dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
          url,
          body,
          // data: content || content === false ? instanceToPlain(content) : null,
          code: 200,
          msg: ' 操作成功!',
        };
        this.logger.log(JSON.stringify(message));
        return {
          data: content || content === false ? instanceToPlain(content) : null,
          msg: '操作成功!',
          code: 200
        };
      })
    );
  }
}
