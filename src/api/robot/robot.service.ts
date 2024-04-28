import { Injectable } from '@nestjs/common';
import { UpdateRobotDto } from './dto/update-robot.dto';
import { PrismaService } from 'nestjs-prisma';
import { SocketGateway } from '@/socket/socket.gateway';
import { RedisService } from '@/plugin/redis/redis.service';
import * as request from 'request';
import { ToolsService } from '@/plugin/tools/tools.service';
const mess = [];
@Injectable()
export class RobotService {
  constructor(
    private readonly db: PrismaService,
    private readonly socket: SocketGateway,
    private readonly redisService: RedisService,
    private readonly toolsService: ToolsService
  ) { }
  /**
   * @description 给机器人发送消息
   */
  async sendMessageToRobot(createMessageDto) {
    console.log('createRobotDto', createMessageDto);
    // 只需要推送消息给用户的ws 不需要推送给机器人
    // 1.找到与该机器人的会话
    const session = await this.db.session.findUnique({
      where: {
        senderId_receiverId_sessionType: {
          senderId: createMessageDto.senderId,
          receiverId: createMessageDto.receiverId,
          sessionType: 1
        }
      }
    });
    // 2.创建消息
    const msg = await this.db.contactMessage.create({
      data: {
        content: createMessageDto.content,
        receiverId: createMessageDto.receiverId,
        messageType: createMessageDto.messageType,
        sessionId: session.sessionId,
        senderId: createMessageDto.senderId,
        msgId: createMessageDto.msgId,
        status: 2,
        read: false,
        extra: createMessageDto.extra ? JSON.stringify(createMessageDto.extra) : undefined
      }
    });
    // 3.推送给用户
    // 推送的消息
    const wsMsgData = {
      status: 2,
      time: msg.createdAt,
      read: false,
      ...createMessageDto
    };
    // 4.更新会话列表库 的数据
    await this.db.session.update({
      where: {
        sessionId: session.sessionId
      },
      data: {
        lastMsgId: msg.msgId,
        isDelete: false
      }
    });
    this.socket.wsServer
      .to(createMessageDto.userId)
      .emit('receiveMessage', { ...wsMsgData, sessionId: session.sessionId });
    setTimeout(async () => {
      // 1.从GPT获取机器人回复的消息
      let content;
      try {
        const gptReply: any = await this.completions(createMessageDto.content);
        console.log('gptReply', gptReply);
        const { choices } = gptReply;
        content = choices[0].message.content;
      } catch (error) {
        content = '哎呀，出错了';
      }

      // 2.创建机器人回复的消息
      const robotMsg = await this.db.contactMessage.create({
        data: {
          content: content,
          receiverId: createMessageDto.userId,
          messageType: 1,
          sessionId: session.sessionId,
          senderId: createMessageDto.receiverId,
          msgId: this.toolsService.generateMsgUniqueId(),
          status: 2,
          read: false,
          extra: createMessageDto.extra ? JSON.stringify(createMessageDto.extra) : undefined
        }
      });
      const random = Math.round(Math.random() * 1000);
      const msgToken = new Date().getTime().toString() + random.toString();
      await this.db.session.update({
        where: {
          sessionId: session.sessionId
        },
        data: {
          lastMsgId: robotMsg.msgId,
          isDelete: false
        }
      });
      this.socket.wsServer.to(createMessageDto.userId).emit('receiveMessage', {
        ...createMessageDto,
        status: 2,
        time: robotMsg.createdAt,
        read: false,
        userId: createMessageDto.receiverId,
        receiverId: createMessageDto.userId,
        msgId: robotMsg.msgId,
        msgToken,
        content: robotMsg.content,
        sessionId: session.sessionId
      });
    }, 2000);
  }
  /**
   * @description 调用chatGpt接口返回数据
   */
  completions(content) {
    mess.push({ role: 'user', content: content });
    return new Promise((resolve, reject) => {
      request.post(
        {
          url: 'https://api.chatanywhere.com.cn/v1/chat/completions',
          json: {
            model: 'gpt-3.5-turbo-0125',
            messages: mess
          },
          headers: {
            Authorization: 'Bearer ' + process.env.CHAT_GPT_KEY
          }
        },
        async function (error, response, body) {
          if (!error) {
            resolve(body);
          } else {
            reject(JSON.parse(error));
          }
        }
      );
    });
  }
  /**
   *  机器人发送消息给用户
   */
  async robotSendMessageToUser(content, session, createMessageDto) {
    // 2.创建机器人回复的消息
    const robotMsg = await this.db.contactMessage.create({
      data: {
        content: content,
        receiverId: createMessageDto.userId,
        messageType: 1,
        sessionId: session.sessionId,
        senderId: createMessageDto.receiverId,
        msgId: this.toolsService.generateMsgUniqueId(),
        status: 2,
        read: false,
        extra: createMessageDto.extra ? JSON.stringify(createMessageDto.extra) : undefined
      }
    });
    const random = Math.round(Math.random() * 1000);
    const msgToken = new Date().getTime().toString() + random.toString();
    await this.db.session.update({
      where: {
        sessionId: session.sessionId
      },
      data: {
        lastMsgId: robotMsg.msgId,
        isDelete: false
      }
    });
    this.socket.wsServer.to(createMessageDto.userId).emit('receiveMessage', {
      ...createMessageDto,
      status: 2,
      time: robotMsg.createdAt,
      read: false,
      userId: createMessageDto.receiverId,
      receiverId: createMessageDto.userId,
      msgId: robotMsg.msgId,
      msgToken,
      content: robotMsg.content,
      sessionId: session.sessionId
    });
  }
}
