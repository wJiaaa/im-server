/*
 * @Description: 分页数据校验
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { IsNumber, IsString } from 'class-validator';
import { IsNumberAndInt } from './customer';

export class CreateMessageDto {
  @IsString()
  friendId: string;

  @IsString()
  content: string;

  @IsNumber()
  messageType: number;
}

export class getMessageByMsgIdDto {
  @IsString()
  readonly msgId: string

  @IsNumberAndInt({
    message: '参数异常，请检查参数！'
  })
  readonly sessionType: number = 1
}

export class listDto {
  @IsNumberAndInt({
    message: 'pageNum类型错误'
  })
  pageNum: number;

  @IsNumberAndInt({
    message: 'pageSize类型错误'
  })
  pageSize: number;

  @IsString()
  readonly sessionType: string;

  @IsString()
  readonly sessionId: string;

  @IsString()
  readonly receiverId: string
}
export class RevokeMessageDto {

  @IsString()
  readonly msgId: string
}
export interface createMsgDto {
  content: string
  senderId: string
  receiverId: string
  messageType: number
  sessionId: number
  status?: number
  extra?: string
}