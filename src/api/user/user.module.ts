/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-12 23:03:27
 */
import { Module, CacheModule } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { RobotModule } from '../robot/robot.module';
import { MessageModule } from './../message/message.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    CacheModule.register(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'iM'
    }),
    RobotModule,
    MessageModule
  ],
  exports: [UserService, JwtModule]
})
export class UserModule {}
