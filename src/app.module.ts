/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { ValidationPipe } from './common/pipes/validation.pipe';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ApiModule } from './api/api.module';
import { ClsModule } from 'nestjs-cls';
import { nanoid } from 'nanoid';
import { CommonModule } from './common/common.module';
import { PluginModule } from './plugin/plugin.module';
import { SocketModule } from './socket/socket.module';
import { QueueModule } from './queue/queue.module';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SessionModule } from './api/session/session.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from "@nestjs/config";
import { RobotModule } from './api/robot/robot.module';
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) => req.headers['x-request-id'] || nanoid()
      }
    }),
    ServeStaticModule.forRoot({
      //静态文件目录
      rootPath: join(__dirname, '..', 'uploads')
    }),
    // 暂未实现多环境
    // ConfigModule.forRoot({
    //   // host: '127.0.0.1',
    //   // port: '2379',
    //   isGlobal: true,
    //   envFilePath: process.env.NODE_ENV === "development" ? ".env.development" : `.env.production`
    // }),
    ApiModule,
    CommonModule,
    PluginModule,
    SocketModule,
    SessionModule,
    QueueModule,
    RobotModule
  ],
  controllers: [],
  providers: [
    //全局注册拦截器(返回格式)
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor
    },
    // {
    //   provide: APP_FILTER,
    //   useFactory: ({ httpAdapter }: HttpAdapterHost) => {
    //     return new PrismaClientExceptionFilter(httpAdapter, {
    //       // Prisma Error Code: HTTP Status Response
    //       P2000: 400,
    //       P2002: 500,
    //       P2025: 500
    //     });
    //   },
    //   inject: [HttpAdapterHost]
    // },
    // 全局使用过滤器(日志打印)
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: LoggerInterceptor
    // },
    // 全局使用过滤器(请求错误过滤器)
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    },
    // 全局使用管道(数据校验)
    {
      provide: APP_PIPE,
      useClass: ValidationPipe
    },
    // 序列化
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor
    }
  ]
})
export class AppModule { }
