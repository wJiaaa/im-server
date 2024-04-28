/*
 * @Description: 检验权限
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-09 16:27:14
 */
import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { RedisService } from '@/plugin/redis/redis.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorators';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly redisService: RedisService
  ) { }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 不影响 RabbitMQ
    if (isRabbitContext(context)) {
      return true;
    }
    // 用来过滤白名单，被@Public装饰器修饰的控制器直接跳过不做验证
    const isPublic = this.reflector.get(IS_PUBLIC_KEY, context.getHandler());
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.header('Authorization');

    if (!token) {
      throw new HttpException(`登陆过期`, 401);
    }
    const tokenInfo: any = this.jwtService.decode(token.replace('Bearer ', ''));
    const res = await this.redisService.get('auth.guards.ts', 'login_user_key:' + tokenInfo?.login_user_key);
    // 将用户信息放到请求中在后续使用
    if (!res) {
      throw new HttpException(`登陆过期`, 401);
    } else {
      delete res.password;
      console.log('登陆人', res.userId, res.username);
      request.user = res;
      return true;
    }
  }
}
