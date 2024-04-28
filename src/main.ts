/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { HttpException, HttpStatus, Logger, ValidationPipe } from '@nestjs/common';
const PORT = process.env.PORT || 9092;
const PREFIX = process.env.PREFIX || '/api';
async function bootstrap() {
  const logger: Logger = new Logger('main.ts');
  const app = await NestFactory.create(AppModule, {});
  //允许跨域请求
  app.enableCors();
  // 给请求添加prefix
  app.setGlobalPrefix(PREFIX);
  app.useWebSocketAdapter(new IoAdapter(app));
  app.useGlobalPipes(
    new ValidationPipe({
      // 可以将DTO转换成实例 也可以为boolean和布尔值转换成数字
      transform: true,
      // 可以自动过滤我们不需要的属性
      whitelist: false,
      // 开启此功能可以在我们收到不需要的属性时抛出错误
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true // 在这里写 可以不用使用@Type修饰符显式指定类型
      },
      exceptionFactory: (errors) => {
        console.log('errors', errors);

        const propertyNotExist = [];
        for (let i = 0; i < errors.length; i++) {
          const errorMessage = "属性" + errors[i].property + "非法";
          propertyNotExist.push(errorMessage);
        }
        return new HttpException({ message: propertyNotExist + '' }, HttpStatus.BAD_REQUEST);
      }
    })
  );
  // const prismaService: PrismaService = app.get(PrismaService);
  // await prismaService.enableShutdownHooks(app);

  await app.listen(PORT, () => {
    logger.verbose(`服务已经启动,接口请访问:http://localhost:${PORT}${PREFIX}`);
  });
}
bootstrap();
