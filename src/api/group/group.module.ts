/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-12 15:40:54
 */
import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';

@Module({
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService]
})
export class GroupModule { }
