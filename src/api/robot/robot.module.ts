/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Module } from '@nestjs/common';
import { RobotService } from './robot.service';
import { RobotController } from './robot.controller';

@Module({
  controllers: [RobotController],
  providers: [RobotService],
  exports: [RobotService]
})
export class RobotModule { }
