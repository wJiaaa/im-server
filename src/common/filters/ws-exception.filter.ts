/*
 * @Description: 全局ws连接异常捕获
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Catch, ArgumentsHost } from '@nestjs/common'
import { BaseWsExceptionFilter } from '@nestjs/websockets'

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host)
  }
}
