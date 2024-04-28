/*
 * @Description: 插件
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { ToolsService } from './tools/tools.service';
import { EventHandlerDiscovery } from '@/plugin/event-handler.discovery';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { GrpcService } from './grpc.service';
import { EventManager } from './EventManager';
import { PrismaModule } from 'nestjs-prisma';
import { loggingMiddleware } from './logging-middleware';
import { CosService } from './cos/cos.service';
// Global表示全局 不需要再module中继续引入
@Global()
@Module({
  providers: [RedisService, ToolsService, EventManager, EventHandlerDiscovery, GrpcService, CosService],
  exports: [RedisService, ToolsService, EventManager, GrpcService, CosService],
  imports: [
    DiscoveryModule,
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [loggingMiddleware()]
      }
    })
  ]
})
export class PluginModule {}
// import { ClsService } from 'nestjs-cls'; cls.getId traceId
