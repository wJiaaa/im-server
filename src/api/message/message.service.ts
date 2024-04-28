import { SessionService } from './../session/session.service';
/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { SocketGateway } from '@/socket/socket.gateway';
import { FriendEnum } from '@/enums';
import { RedisService } from '@/plugin/redis/redis.service';
import { GroupService } from '../group/group.service';
import { ToolsService } from '@/plugin/tools/tools.service';
import { RobotService } from '../robot/robot.service';
import { createMsgDto, getMessageByMsgIdDto } from './dto/create-message.dto';
// import { ProducerService } from '@/queue/message/producer.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly db: PrismaService,
    private readonly socket: SocketGateway,
    private readonly redisService: RedisService,
    private readonly groupService: GroupService,
    private readonly toolsService: ToolsService,
    private readonly robotService: RobotService,
    private readonly sessionService: SessionService,
    // private readonly producer: ProducerService
  ) { }
  /**
   * @description 根据消息ID查询消息内容
   * @param
   */
  async getMessageByMsgId(params: getMessageByMsgIdDto) {
    const { msgId, sessionType } = params;
    if (sessionType === 1) {
      return await this.db.contactMessage.findUnique({
        where: {
          msgId
        }
      });
    } else {
      return await this.db.groupMessage.findUnique({
        where: {
          msgId
        }
      });
    }
  }
  /**
   * @description 撤回消息
   */
  async revokeMessage(msgId) {
    const updateMsgItem = await this.db.contactMessage.update({
      where: {
        msgId
      },
      data: {
        isRevoke: true,
        updatedAt: new Date()
      }
    });
    const sessionInfo = await this.sessionService.findManySessionInfo(1, updateMsgItem.senderId, updateMsgItem.receiverId)
    this.socket.sendMessageToClient(updateMsgItem.receiverId, 'receiveRevokeMessage', {
      msgId, sessionId: sessionInfo.receiverSessionId
    })
    this.socket.sendMessageToClient(updateMsgItem.senderId, 'receiveRevokeMessage', {
      msgId, sessionId: sessionInfo.senderSessionId
    })
    return;
  }
  /**
   * 删除消息
   */
  async deleteMessage(body, userId) {
    const { msgId, sessionId, previousMsgId } = body;
    // 1.找到该条消息
    const message = await this.db.contactMessage.findUnique({
      where: {
        msgId
      },
      select: {
        senderId: true,
        receiverId: true,
        isDelete: true
      }
    });
    // TODO 没有找到对应消息
    if (!message) {
      return; // 抛出错误
    }
    let isDeleteValue;
    if (message.isDelete === 1) {
      // 当 isDelete 为 1 时，根据 userId 判断 userId 和 receiverId 是否匹配
      if (message.senderId === userId) {
        isDeleteValue = 2; // 消息的发送者删除
      } else if (message.receiverId === userId) {
        isDeleteValue = 3; // 消息的接收者删除
      } else {
        // 如果给定的 userId 既不是 userId 也不是 toUserId，可能是非法操作或其他情况
        // 这里可以抛出错误或按照其他逻辑处理，根据实际需求来定
        return;
      }
    } else if (message.isDelete === 2 || message.isDelete === 3) {
      // 当 isDelete 为 2 或 3 时，直接设置为 4
      isDeleteValue = 4;
    } else {
      // 该条消息已被删除但是显示到了列表 bug 可以打个日志 抛出异常
      return;
    }
    // 更新消息
    await this.db.contactMessage.update({
      where: {
        msgId
      },
      data: {
        isDelete: isDeleteValue
      }
    });
    // 默认上一条消息等于该条消息
    if (previousMsgId) {
      await this.db.session.update({
        where: {
          sessionId
        },
        data: {
          lastMsgId: previousMsgId
        }
      });
    }
    this.socket.sendMessageToClient(userId, 'receiveDeleteMessage', {
      msgId, sessionId, previousMsgId
    })
    return;
  }
  /**
   * @description 操作置顶消息
   * @param payload 置顶消息信息
   */
  async topMessageOperate(
    payload: {
      msgId: string;
      senderId: string;
      receiverId: string;
      topFlag: boolean
    }
  ) {
    const { msgId, senderId, receiverId, topFlag = true } = payload
    const content = topFlag ? '[' + senderId + ']' + '置顶了内容' : '[' + senderId + ']' + '移除了置顶内容'
    const sessionInfo = await this.sessionService.findManySessionInfo(1, senderId, receiverId)
    const updateSessionData = {
      topMsgId: topFlag ? msgId : null,
      topMsgUserId: topFlag ? senderId : null,
    }
    //  发送系统消息操作人
    // TODO 优化content 在extra中存储置顶人的信息
    await this.sendSystemMessage({
      msgInfo: {
        content,
        receiverId: senderId,
        messageType: 101,
        sessionId: sessionInfo.senderSessionId,
        senderId: '0',
      },
      receiverSessionId: sessionInfo.senderSessionId,
      sessionInfo: updateSessionData,
      sessionType: 1
    }, () => {
      this.socket.wsServer.to(senderId).emit('receiveTopMessage', { topMsgId: msgId, sessionId: sessionInfo.senderSessionId, topMsgUserId: senderId });
    })
    //  发送系统消息给通知人
    await this.sendSystemMessage({
      msgInfo: {
        content,
        receiverId: receiverId,
        messageType: 101,
        sessionId: sessionInfo.receiverSessionId,
        senderId: '0',
      },
      receiverSessionId: sessionInfo.receiverSessionId,
      sessionInfo: updateSessionData,
      sessionType: 1
    }, () => {
      this.socket.wsServer.to(receiverId).emit('receiveTopMessage', { topMsgId: msgId, sessionId: sessionInfo.receiverSessionId, topMsgUserId: senderId });
    })
  }
  /**
   * @description 发送消息给好友
   */
  async publish(createMessageDto, userInfo) {
    console.log('createMessageDto', createMessageDto);
    //给机器人发送消息
    if (createMessageDto.isRobot) {
      return this.robotService.sendMessageToRobot({
        userInfo,
        ...createMessageDto
      });
    }
    // 群聊发送消息
    if (createMessageDto.sessionType === 2) {
      return this.groupService.sendGroupMsg({
        userInfo,
        msgInfo: {
          content: createMessageDto.content,
          messageType: createMessageDto.messageType,
          groupId: +createMessageDto.receiverId,
          msgId: createMessageDto.msgId,
          extra: createMessageDto.extra,
          msgToken: createMessageDto.msgToken,
          atUserIdList: createMessageDto.atUserIdList
        }
      });
    }
    /**
     *  1.判断是否是好友 是否拉黑
     *  2.判断是否在线
     *  3.判断是否有会话ID
     *  4.有会话ID 更新私聊数据库  更新会话列表库userId friendId 的数据
     *  3.没有会话ID 根据用户userId和friendId创建会话 再执行4
     *  4.推送给
     */
    const sessionInfo = await this.sessionService.findManySessionInfo(1, createMessageDto.senderId, createMessageDto.receiverId)
    const isFriendFlag = await this.db.contact.findUnique({
      where: {
        userId_friendId: {
          userId: createMessageDto.receiverId,
          friendId: createMessageDto.senderId
        }
      }
    });
    //  拉黑、被删除 
    if (isFriendFlag.isDelete) {
      await this.sendMessage({
        sessionInfo,
        msgInfo: {
          content: createMessageDto.content,
          receiverId: createMessageDto.receiverId,
          messageType: createMessageDto.messageType,
          sessionId: sessionInfo.senderSessionId,
          senderId: createMessageDto.senderId,
          status: 3
        },
        sessionType: 1,
        msgToken: createMessageDto.msgToken,
        pushToReceiver: false
      })
      // 创建系统消息
      const systemMsg = await this.createMsg({
        content: '对方开启了朋友验证，你还不是他（她）朋友。请先发送朋友验证，对方验证通过后，才能聊天。',
        receiverId: createMessageDto.senderId,
        messageType: 99,
        sessionId: sessionInfo.senderSessionId,
        senderId: '0',
      })
      // 推送系统消息
      setTimeout(() => {
        this.socket.wsServer.to(createMessageDto.senderId).emit('receiveMessage', {
          ...systemMsg,
          type: FriendEnum.NOT_FRIEND,
          sessionType: 1,
        });
      });
      return FriendEnum.NOT_FRIEND;
    } else {
      // 判断是否有引用消息id 如果有找到并存入extra中
      if (createMessageDto.extra?.quoteId) {
        const quoteMsgItem = await this.db.contactMessage.findUnique({
          where: {
            msgId: createMessageDto.extra.quoteId
          }
        });
        // 引用消息存储
        createMessageDto.extra.quote = {
          messageType: quoteMsgItem.messageType,
          content: quoteMsgItem.content,
          msgId: quoteMsgItem.msgId,
          senderId: quoteMsgItem.senderId
        };
      }
      this.sendMessage({
        sessionInfo,
        msgInfo: {
          status: 2,
          content: createMessageDto.content,
          receiverId: createMessageDto.receiverId,
          messageType: createMessageDto.messageType,
          sessionId: sessionInfo.senderSessionId,
          senderId: createMessageDto.senderId,
          extra: createMessageDto.extra ? JSON.stringify(createMessageDto.extra) : undefined
        },
        sessionType: 1,
        msgToken: createMessageDto.msgToken
      })
    }
  }
  /**
   * @Description 获取会话消息
   */
  async getAllMessage(params: {
    sessionId?: string;
    userId?: string;
    receiverId?: string;
    sessionType?: string;
    pageNum?: number;
    pageSize?: number;
  }) {
    const { pageNum = 1, pageSize = 50 } = params;
    console.log('params', params);

    // TODO 修改
    if (params.sessionType === '1') {
      const sessionInfo = await this.db.session.findMany({
        where: {
          OR: [
            {
              senderId: params.userId,
              receiverId: params.receiverId,
              sessionType: 1
            },
            {
              senderId: params.receiverId,
              receiverId: params.userId,
              sessionType: 1
            }
          ]
        },
        select: {
          sessionId: true,
          senderId: true,
          receiverId: true
        }
      });
      const friendInfo = await this.db.contact.findUnique({
        where: {
          userId_friendId: {
            userId: params.userId,
            friendId: params.receiverId
          }
        }
      });
      const total = await this.db.contactMessage.count({
        where: {
          sessionId: {
            in: sessionInfo.map((item) => item.sessionId)
          },
          OR: [
            {
              senderId: params.userId,
              isDelete: { not: 2 } // 接收者未删除
            },
            {
              AND: [
                {
                  senderId: params.receiverId,
                  status: 2,
                  isDelete: { not: 3 } // 发送者未删除
                }
              ]
            },
            {
              AND: [
                {
                  senderId: '0',
                  receiverId: params.userId,
                  isDelete: { not: 3 }
                }
              ]
            }
          ],
          AND: [
            {
              isDelete: { not: 4 }
            }
          ],
          ...(friendInfo.deletedAt && { createdAt: { gt: new Date(friendInfo.deletedAt) } })
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      let msgList: any = await this.db.contactMessage.findMany({
        where: {
          sessionId: {
            in: sessionInfo.map((item) => item.sessionId)
          },
          OR: [
            {
              senderId: params.userId,
              isDelete: { not: 2 } // 接收者未删除
            },
            {
              AND: [
                {
                  senderId: params.receiverId,
                  status: 2,
                  isDelete: { not: 3 } // 发送者未删除
                }
              ]
            },
            {
              AND: [
                {
                  senderId: '0',
                  receiverId: params.userId,
                  isDelete: { not: 3 }
                }
              ]
            }
          ],
          AND: [
            {
              isDelete: { not: 4 }
            }
          ],
          ...(friendInfo.deletedAt && { createdAt: { gt: new Date(friendInfo.deletedAt) } })
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (pageNum - 1) * pageSize,
        take: pageSize
      });
      msgList = msgList.map((item) => {
        if (item.extra) {
          return { ...item, extra: JSON.parse(item.extra) };
        }
        return item;
      });
      return { messageList: msgList.reverse(), total };
    } else {
      const { messageList, total } = await this.groupService.getGroupMsg({ groupId: +params.receiverId, ...params });
      return { messageList, total };
    }
  }
  /**
   * @description 创建新消息
   * @param 
   */
  async createMsg(params: createMsgDto) {
    return await this.db.contactMessage.create({
      data: {
        ...params,
        msgId: this.toolsService.generateMsgUniqueId()
      }
    })
  }
  /**
   * @description 发送消息(好友消息)
   * @param {} 消息内容等
   * @param callback 回调
   */
  async sendMessage(payload: {
    /** 发送的消息内容 */
    msgInfo: createMsgDto
    /** 会话类型 */
    sessionType: number,
    /** 消息token，客户端用来判断是否是发送的消息 */
    msgToken?: string,
    /** 更新的会话信息 */
    sessionInfo: {
      senderSessionId: number;
      receiverSessionId: number;
      data?: {
        isTop?: boolean
        isDisturb?: boolean
        topMsgId?: string | null
        topMsgUserId?: string | null
        deletedAt?: Date | string | null
      }
    },
    /** 是否需要推送给接收人 默认为 true */
    pushToReceiver?: boolean
  }) {
    /** 
     * 1.创建消息
     * 2.组装推送的消息内容
     * 3.推送消息
     */
    const { msgInfo, sessionType, msgToken, sessionInfo, pushToReceiver = true } = payload
    const msg = await this.createMsg(msgInfo)
    // 更新的会话信息
    const updateSessionData = {
      lastMsgId: msg.msgId,
      isDelete: false,
      ...sessionInfo.data
    }
    // 更新会话列表库 的数据
    await this.sessionService.updateManySession(sessionInfo, updateSessionData)
    // 判断消息接收方是否在线
    const receiverActive = await this.redisService.get('sendMessage', 'login_user_key:' + msgInfo.receiverId);
    // 更新redis中该会话列表的未读数
    await this.redisService.increaseSessionUnreadNum(msgInfo.receiverId, sessionInfo.receiverSessionId.toString());
    const toClientMsg = {
      ...msg,
      sessionType,
      msgToken,
      extra: JSON.parse(msg.extra)
    }
    // 需要增加消息处理失败的情况
    this.socket.wsServer
      .to(msgInfo.senderId)
      .emit('receiveMessage', { ...toClientMsg, sessionId: sessionInfo.senderSessionId });
    // 当接收消息用户在线时才进行推送 
    if (receiverActive && pushToReceiver) {
      this.socket.wsServer
        .to(msgInfo.receiverId)
        .emit('receiveMessage', { ...toClientMsg, sessionId: sessionInfo.receiverSessionId });
    }
  }
  /**
   * @description 发送系统消息给用户 
   * @param {} 消息内容等
   * @param callback 回调
   */
  async sendSystemMessage(payload: {
    /** 发送的消息内容 */
    msgInfo: createMsgDto
    /** 会话类型 */
    sessionType: number,
    receiverSessionId: number,
    /** 更新的会话信息 */
    sessionInfo: {
      isTop?: boolean
      isDisturb?: boolean
      topMsgId?: string | null
      topMsgUserId?: string | null
      deletedAt?: Date | string | null
    },
  }, callback: () => void) {
    /** 
    * 1.创建消息
    * 2.组装推送的消息内容
    * 3.推送消息
    */
    const { msgInfo, sessionType, receiverSessionId, sessionInfo } = payload
    const systemMsg = await this.createMsg(msgInfo)
    // 更新的会话信息
    const updateSessionData = {
      lastMsgId: systemMsg.msgId,
      isDelete: false,
      ...sessionInfo
    }
    // 更新会话列表库 的数据
    await this.sessionService.updateSessionById(receiverSessionId, updateSessionData)
    // 判断消息接收方是否在线
    const receiverActive = await this.redisService.get('sendMessage', 'login_user_key:' + msgInfo.receiverId);
    // 更新redis中该会话列表的未读数
    await this.redisService.increaseSessionUnreadNum(msgInfo.receiverId, receiverSessionId.toString());
    const toClientMsg = {
      ...systemMsg,
      sessionType,
      extra: JSON.parse(systemMsg.extra)
    }
    // 当接收消息用户在线时才进行推送 
    if (receiverActive) {
      this.socket.wsServer
        .to(msgInfo.receiverId)
        .emit('receiveMessage', { ...toClientMsg, sessionId: receiverSessionId });
    }
    callback && callback()
  }
}
