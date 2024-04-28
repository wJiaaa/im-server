/*
 * @Description: api接口
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { MessageModule } from './message/message.module';
import { FriendModule } from './friend/friend.module';
import { SessionModule } from './session/session.module';
import { GroupModule } from './group/group.module';
import { UploadModule } from './upload/upload.module';
@Module({
  imports: [UserModule, MessageModule, FriendModule, SessionModule, GroupModule, UploadModule]
})
export class ApiModule {}
