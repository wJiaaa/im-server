/*
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-28 16:55:07
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { SocketGateway } from '@/socket/socket.gateway';
import { ToolsService } from '@/plugin/tools/tools.service';
import { RedisService } from '@/plugin/redis/redis.service';
import { SessionService } from './../session/session.service';
@Injectable()
export class FriendService {
  constructor(
    private readonly db: PrismaService,
    private readonly socket: SocketGateway,
    private readonly redisService: RedisService,
    private readonly sessionService: SessionService,
    private readonly toolsService: ToolsService,
  ) { }

  /**
   * @description 请求添加好友
   */
  async requestAddFriend(createFriendDto) {
    // 1.判断要添加的好友是否在线 在线则推送请求添加好友的ws
    const { friendId, userInfo } = createFriendDto;
    const friendIsActive = await this.redisService.exit('requestAddFriend', 'login_user_key:' + friendId);
    const applyMessageInfo = await this.db.contactApply.create({
      data: {
        applicantId: userInfo.userId,
        friendId: friendId
      }
    });
    // 获取添加人信息
    const friendInfo = await this.db.user.findUnique({
      where: {
        userId: friendId
      },
      select: {
        avatar: true,
        username: true
      }
    })

    const sendData = {
      applicantAvatar: userInfo.avatar,
      applicantUsername: userInfo.username,
      friendUsername: friendInfo.username,
      friendAvatar: friendInfo.avatar,
      ...applyMessageInfo
    }
    this.socket.sendMessageToClient(userInfo.userId, 'addFriend', sendData)
    if (friendIsActive) {
      this.socket.sendMessageToClient(friendId, 'addFriend', sendData)
    }
    return null;
  }

  /**
   * @description 获取好友列表
   */
  async getMyFriendList(userId) {
    return await this.db.$queryRaw`SELECT
        im_contact.remark,im_contact.created_at As createdAt,
        user.tel,user.username,user.avatar,user.user_id As userId,user.signature,user.gender,
        s.session_id AS sessionId,s.session_type As sessionType
      FROM im_contact
      LEFT JOIN im_session s
      ON s.sender_id = im_contact.user_id AND s.receiver_id = im_contact.friend_id
      LEFT JOIN im_user user
      ON im_contact.friend_id = user.user_id
      where im_contact.user_id = ${userId} AND im_contact.is_delete = false;`;
  }

  /**
   * @description 根据手机号搜索好友
   */
  searchFriend({ tel }) {
    return this.db.user.findUnique({
      where: {
        tel
      }
    });
  }

  /**
   * @description 用户同意添加好友请求
   */
  // TODO 重新实现
  async agreeFriend(params: { requestUserId: string; userId: string; id: number }) {
    // TODO 目前暂不实现未验证即添加好友 要么单向好友(一方删除了另一方) 要么不是好友 要么是好友
    /**
     * 同意添加好友步骤
     * 1.更新好友关系映射表
     * 2.删除redis中请求添加好友的userId
     * 3.创建与好友的会话列表  并将Id存到 friend 表中
     * 4.创建添加成功的默认消息
     * 5.更新好友会话列表消息Id
     */
    console.log('params', params);
    // 判断是否需要创建新会话（之间是否有添加过好友）
    const isExitSession = await this.db.session.findMany({
      where: {
        OR: [
          { senderId: params.userId, receiverId: params.requestUserId, sessionType: 1 },
          { senderId: params.requestUserId, receiverId: params.userId, sessionType: 1 }
        ]
      }
    });
    if (!isExitSession.length) {
      // 会话会一直保存 有会话即有 有好友关系
      // 创建好友关系映射
      await this.db.contact.createMany({
        data: [
          { userId: params.requestUserId, friendId: params.userId },
          { userId: params.userId, friendId: params.requestUserId }
        ]
      });
    } else {
      await this.db.contact.updateMany({
        where: {
          OR: [
            { userId: params.requestUserId, friendId: params.userId },
            { userId: params.userId, friendId: params.requestUserId }
          ]
        },
        data: {
          isDelete: false
        }
      });
      await this.db.session.updateMany({
        where: {
          OR: [
            { senderId: params.userId, receiverId: params.requestUserId, sessionType: 1 },
            { senderId: params.requestUserId, receiverId: params.userId, sessionType: 1 }
          ]
        },
        data: {
          isDelete: false
        }
      });
    }
    // 创建添加成功的系统消息
    const addSuccessSysMsg = await this.db.contactMessage.create({
      data: {
        senderId: '0',
        receiverId: params.userId,
        content: '你已添加对方为好友，现在可以开始聊天了。',
        messageType: 99,
        msgId: this.toolsService.generateMsgUniqueId()
      }
    });
    const requestUseraddSuccessSysMsg = await this.db.contactMessage.create({
      data: {
        senderId: '0',
        receiverId: params.requestUserId,
        content: '你已添加对方为好友，现在可以开始聊天了。',
        messageType: 99,
        msgId: this.toolsService.generateMsgUniqueId()
      }
    });
    // TODO 可优化
    const userSession = await this.db.session.upsert({
      where: {
        senderId_receiverId_sessionType: {
          senderId: params.userId,
          receiverId: params.requestUserId,
          sessionType: 1
        }
      },
      create: {
        senderId: params.userId,
        receiverId: params.requestUserId,
        sessionType: 1,
        lastMsgId: addSuccessSysMsg.msgId
      },
      update: {
        lastMsgId: addSuccessSysMsg.msgId
      }
    });
    const requestUserSession = await this.db.session.upsert({
      where: {
        senderId_receiverId_sessionType: {
          senderId: params.requestUserId,
          receiverId: params.userId,
          sessionType: 1
        }
      },
      create: {
        senderId: params.requestUserId,
        receiverId: params.userId,
        sessionType: 1,
        lastMsgId: requestUseraddSuccessSysMsg.msgId
      },
      update: {
        lastMsgId: requestUseraddSuccessSysMsg.msgId
      }
    });

    await this.db.contactMessage.update({
      where: {
        msgId: addSuccessSysMsg.msgId
      },
      data: {
        sessionId: userSession.sessionId
      }
    });
    await this.db.contactMessage.update({
      where: {
        msgId: requestUseraddSuccessSysMsg.msgId
      },
      data: {
        sessionId: requestUserSession.sessionId
      }
    }),
      // 更新redis中会话列表的未读数
      this.redisService.client.hset('userSessionUnRead:' + params.userId, userSession.sessionId, 1);
    this.redisService.client.hset('userSessionUnRead:' + params.requestUserId, requestUserSession.sessionId, 1);
    const requestUserInfo = await this.getFriendInfo(params.userId, params.requestUserId);
    // 判断发起请求的人是否在线
    const requestUserIsActive = await this.redisService.get('agreeFriend', 'login_user_key:' + params.requestUserId);
    if (requestUserIsActive) {
      const friendInfo = await this.getFriendInfo(params.requestUserId, params.userId);
      this.socket.wsServer.to(params.requestUserId).emit('agreeFriend', {
        friendInfo: { ...friendInfo[0], sessionId: requestUserSession.sessionId },
        recentMsgInfo: {
          avatar: friendInfo[0].avatar,
          createdAt: requestUseraddSuccessSysMsg.createdAt,
          // 设置为1是因为添加好友成功会给用户发送添加成功的消息
          unReadNum: 1,
          username: friendInfo[0].username,
          senderId: requestUserSession.senderId,
          receiverId: requestUserSession.receiverId,
          content: '你已添加对方为好友，现在可以开始聊天了。',
          messageType: 99,
          sessionType: 1,
          sessionId: requestUserSession.sessionId
        }
      });
    }
    // TODO agreeFriend可以不添加这么多 只返回一个id 再提供一个接口供客户端查询最新的信息即可
    this.socket.wsServer.to(params.userId).emit('agreeFriend', {
      friendInfo: { ...requestUserInfo[0], sessionId: userSession.sessionId },
      recentMsgInfo: {
        avatar: requestUserInfo[0].avatar,
        createdAt: addSuccessSysMsg.createdAt,
        unReadNum: 1,
        username: requestUserInfo[0].username,
        senderId: userSession.senderId,
        receiverId: userSession.receiverId,
        content: '你已添加对方为好友，现在可以开始聊天了。',
        messageType: 99,
        sessionType: 1,
        sessionId: userSession.sessionId
      }
    });
    // 更新数据库中请求添加好友的userId
    this.updateFriendApplyStatus(params.id, 1);
    return;
  }

  /**
   * @description 获取好友请求列表
   */
  async getAllFriendAddReq(userId) {
    return await this.db.$queryRaw`SELECT
      A.id,
      A.status,
      A.applicant_id AS applicantId,
      A.friend_id AS friendId,
      A.remark,
      A.updated_at AS updatedAt,
      B.username AS applicantUsername,
      B.avatar AS applicantAvatar,
      C.username AS friendUsername,
      C.avatar AS friendAvatar
     FROM im_contact_apply A
     INNER JOIN im_user B ON A.applicant_id = B.user_id
     INNER JOIN im_user C ON A.friend_id = C.user_id
     WHERE
      A.applicant_id = ${userId} OR A.friend_id = ${userId}
      ORDER BY
    A.updated_at DESC`;
  }

  /**
   * @description 获取联系人信息
   */
  async getFriendInfo(userId, friendId): Promise<any> {
    return await this.db.$queryRaw`SELECT
        friend.remark,friend.created_at As createdAt,
        user.tel,user.username,user.avatar,user.user_id As userId,user.signature,user.gender
      FROM im_contact friend
      LEFT JOIN im_user user
      ON friend.friend_id = user.user_id
      where friend.friend_id = ${friendId} AND friend.user_id = ${userId}`;
  }

  /**
   *  拒绝好友请求
   */
  // TODO 可以与同意好友请求同一个路径 根据type分开处理
  async refuseFriend(params) {
    this.updateFriendApplyStatus(params.id, 2);
  }
  /** 更新好友申请表信息 */
  async updateFriendApplyStatus(id, status) {
    const updateRes = await this.db.contactApply.update({
      where: {
        id
      },
      data: {
        status
      }
    });
    this.socket.wsServer.to(updateRes.applicantId).emit('addFriendResult', {
      id,
      status
    });
  }
  /**
   * @description 删除好友
   */
  async deleteFriend(params) {
    console.log('params', params);
    const { userId, friendId, sessionId } = params
    /**
     * 删除好友
     */
    await this.db.contact.update({
      where: {
        userId_friendId: {
          userId,
          friendId
        }
      },
      data: {
        isDelete: true,
        deletedAt: new Date()
      }
    });
    await this.sessionService.remove(sessionId)
    return '';
  }
  /**
   * @description 修改好友信息
   */
  updateFriendInfo(userId, friendInfo) {
    const { friendId, remark } = friendInfo;
    return this.db.contact.update({
      where: {
        userId_friendId: {
          userId,
          friendId
        }
      },
      data: {
        remark
      }
    });
  }
}
