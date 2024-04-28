/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { GroupModule } from '../group/group.module';
import { RobotModule } from '../robot/robot.module';
import { SessionModule } from '../session/session.module';
@Module({
  imports: [GroupModule, RobotModule, SessionModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService]
})
export class MessageModule { }
