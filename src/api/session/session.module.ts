/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';

@Module({
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService]
})
export class SessionModule { }
