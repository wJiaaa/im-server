/*
 * @Description: 获取角色Id装饰器
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-09 16:28:51
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * @Description 用户信息
 * @param data 需要获取到的字段
 */
export const UserInfo = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  if (data && request.user) {
    return request.user[data];
  } else {
    return request.user;
  }
});
