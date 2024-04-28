/*
 * @Description: 异常过滤器
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-23 10:16:59
 */
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
// import { formatDate } from '@src/utils';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) { }
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    if ((host.getType() as any) === 'rmq') {
      return;
    }
    const response = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const resultMessage = exception.message;
    this.logger.error(resultMessage);
    // 设置返回的状态码、请求头、发送错误信息
    response.status(200);
    response.header('Content-Type', 'application/json; charset=utf-8');
    response.send({
      data: null,
      msg: resultMessage || '服务端错误',
      code: status
    });
  }
}
