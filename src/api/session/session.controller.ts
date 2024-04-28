/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { UserInfo } from '@/common/decorators/userInfo.decorators';
import { DateFormatInterceptor } from '@/common/interceptor/DateFormatInterceptor';
import { Controller, Get, Post, Body, Delete, UseInterceptors, Query, Put } from '@nestjs/common';
import { SessionService } from './session.service';

@UseInterceptors(new DateFormatInterceptor())
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) { }

  /**
   * @description 创建会话
   */
  @Post('create')
  create(@Body() body, @UserInfo('userId') userId) {
    return this.sessionService.create({ ...body, userId });
  }

  /**
   * @description 获取最近会话列表
   * @param
   */
  @Get('getSessionList')
  getSessionList(@UserInfo('userId') userId) {
    return this.sessionService.getSessionList(userId);
  }

  @Put('changeSessionStatus')
  changeSessionStatus(@Body() data) {
    return this.sessionService.changeSessionStatus(data);
  }

  /**
 * @description 移除会话
 * @param
 */
  @Delete('delete')
  remove(@Query() query) {
    return this.sessionService.remove(query.sessionId);
  }
}
