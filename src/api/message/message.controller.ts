/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Controller, Get, Post, Body, Query, UseInterceptors, Put } from '@nestjs/common';
import { MessageService } from './message.service';
import { listDto, getMessageByMsgIdDto, RevokeMessageDto } from './dto/create-message.dto';
import { UserInfo } from '@/common/decorators/userInfo.decorators';
import { DateFormatInterceptor } from '@/common/interceptor/DateFormatInterceptor';
import { ToolsService } from '@/plugin/tools/tools.service';

@UseInterceptors(new DateFormatInterceptor())
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService, private readonly toolsService: ToolsService) { }

  /**
   * @description 根据消息ID查询消息内容
   * @param
   */
  @Get('getMessageByMsgId')
  getMessageDetail(@Query() params: getMessageByMsgIdDto) {
    return this.messageService.getMessageByMsgId(params);
  }

  /**
   * @description: 发送私聊消息
   * @param ContactMessageDto
   */
  @Post()
  publish(@Body() body, @UserInfo() userInfo) {
    const msgId = this.toolsService.generateMsgUniqueId();
    const { msgToken } = body;
    this.messageService.publish({ ...body, ...{ senderId: userInfo.userId, msgId } }, userInfo);
    return { msgId, msgToken };
  }

  /**
   * @description 获取消息列表
   */
  @Get()
  getAllMessage(@Query() params: listDto, @UserInfo('userId') userId) {
    return this.messageService.getAllMessage({
      ...params,
      userId
    });
  }
  /**
   * @description 撤回消息
   * @param
   */
  @Put('revokeMessage')
  revokeMessage(@Body() body: RevokeMessageDto) {
    return this.messageService.revokeMessage(body.msgId);
  }

  /**
   * @description 删除消息
   * @param
   */
  @Put('deleteMessage')
  deleteMessage(@Body() body, @UserInfo('userId') userId) {
    return this.messageService.deleteMessage(body, userId);
  }
  /**
   * @description 消息置顶/取消置顶
   * @param
   */
  @Put('topMessage')
  topMessage(@Body() body, @UserInfo('userId') userId) {
    return this.messageService.topMessageOperate({
      topFlag: body.topFlag,
      msgId: body.msgId,
      senderId: userId,
      receiverId: body.receiverId
    });
  }
}
