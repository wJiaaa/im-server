/*
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { MessageModule } from '../message/message.module';
import { SessionModule } from './../session/session.module';

@Module({
  controllers: [FriendController],
  providers: [FriendService],
  imports: [MessageModule, SessionModule]
})
export class FriendModule { }
