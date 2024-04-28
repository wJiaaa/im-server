/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2023-07-01 00:51:39
 */
import { HttpException, Logger } from '@nestjs/common';

export function loggingMiddleware() {
  return async (params, next) => {
    try {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      Logger.debug(`[Prisma Query] ${params.model}.${params.action} - ${after - before}ms`, 'PrismaMiddleware');
      return result;
    } catch (error) {
      // TODO 记录primsa错误日志
      console.log('错了', error);
      throw new HttpException('服务端错误,请联系管理员', 500);
    }
  };
}
