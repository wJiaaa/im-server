/*
 * @Description: 公共
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RoleGuard } from './guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { toIntMiddleware } from './middleware/toIntMiddleware';
import { LoggerService } from './logger/logger.service';

@Global()
@Module({
  providers: [
    LoggerService,
    {
      provide: APP_GUARD,
      useClass: RoleGuard
    }
  ],
  imports: [
    JwtModule.register({
      secret: process.env.API_KEY
    })
  ],
  exports: [LoggerService]
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(toIntMiddleware).forRoutes('message');
  }
}
