/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { RedisService } from '@/plugin/redis/redis.service';
import { SocketGateway } from '@/socket/socket.gateway';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { find } from 'lodash';
import { LoggerService } from '@/common/logger/logger.service';
@Injectable()
export class SessionService {
  constructor(
    private readonly db: PrismaService,
    private readonly socket: SocketGateway,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService
  ) { }
  async create(params) {
    const sessionInfo = await this.db.session.update({
      where: {
        sessionId: params.sessionId
      },
      data: {
        isDelete: false
      }
    });
    if (sessionInfo.sessionType === 1) {
      return this.getSessionById(params.sessionId);
    } else {
      const groupSessionList: any = await this.db.$queryRaw`
        SELECT
          s.session_id AS sessionId,
          s.sender_id AS senderId,
          s.receiver_id As receiverId,
          s.session_type As sessionType,
          s.is_top AS isTop,
          s.last_msg_id AS lastMsgId,
          s.updated_at AS updatedAt,
          s.is_disturb AS isDisturb,
          gm.content,
          gm.message_type AS messageType,
          gm.sender_id AS lastMsgSendUserId,
          g.group_name As groupName,
          g.avatar
        FROM
        im_session s
        LEFT JOIN im_group_message gm ON s.last_msg_id = gm.msg_id
        LEFT JOIN im_group g ON s.receiver_id = g.group_id
        WHERE s.session_id = ${params.sessionId}
        `;
      const sessionUnreadNums = +(await this.redisService.client.hget(
        'userSessionUnRead:' + sessionInfo.senderId,
        sessionInfo.sessionId.toString()
      ));
      return {
        ...groupSessionList[0],
        unReadNum: sessionUnreadNums
      };
    }
  }

  /**
   * @description 修改会话状态
   * @param sessionId
   */
  async changeSessionStatus({ sessionId, flag, type }) {
    // type :1 修改置顶状态 2.修改免打扰状态
    const EDIT_FIELD = {
      1: 'isTop',
      2: 'isDisturb'
    };
    // throw new HttpException('服务端错误,请联系管理员', 500);
    return await this.db.session.update({
      data: {
        [EDIT_FIELD[type]]: flag
      },
      where: {
        sessionId: sessionId
      }
    });
  }

  /**
   * @description 获取用户最近会话列表
   */
  async getSessionList(userId) {
    const sessionList: any[] = await this.db.$queryRaw`
      SELECT
        s.session_id AS sessionId,
        s.sender_id AS senderId,
        s.receiver_id As receiverId,
        s.session_type As sessionType,
        s.is_robot As isRobot,
        s.is_top AS isTop,
        s.is_disturb AS isDisturb,
        s.last_msg_id AS lastMsgId,
        s.top_msg_id As topMsgId,
        s.top_msg_user_id As topMsgUserId,
        s.updated_at AS updatedAt,
        u.username As username,
        u.avatar,
        fm.content,
        fm.message_type As messageType,
        fm.is_revoke As isRevoke,
        fm.sender_id As lastMsgSendUserId,
        firend.remark AS remark
      FROM
      im_session s
      LEFT JOIN im_contact_message fm ON s.last_msg_id = fm.msg_id
      LEFT JOIN im_contact firend ON s.sender_id = firend.user_id AND firend.friend_id = s.receiver_id
      LEFT JOIN im_user u ON IF(s.sender_id = ${userId}, s.receiver_id, s.sender_id) = u.user_id
      WHERE  (s.sender_id = ${userId} AND s.is_delete = false AND s.session_type = 1)`;

    const groupSessionList: any = await this.db.$queryRaw`
      SELECT
        s.session_id AS sessionId,
        s.sender_id AS senderId,
        s.receiver_id As receiverId,
        s.session_type As sessionType,
        s.is_top AS isTop,
        s.last_msg_id AS lastMsgId,
        s.is_disturb AS isDisturb,
        s.updated_at AS updatedAt,
        s.top_msg_id As topMsgId,
        s.top_msg_user_id As topMsgUserId,
        gm.content,
        gm.message_type AS messageType,
        gm.sender_id AS lastMsgSendUserId,
        gm.is_revoke As isRevoke,
        g.group_name As groupName,
        g.avatar,
        igm.nick_name As lastMsgSendUserName
      FROM
      im_session s
      LEFT JOIN im_group_message gm ON s.last_msg_id = gm.msg_id
      LEFT JOIN im_group g ON s.receiver_id = g.group_id
      LEFT JOIN im_group_member igm ON gm.sender_id = igm.user_id AND igm.group_id = g.group_id
      WHERE  (s.sender_id = ${userId} AND s.is_delete = false AND s.session_type = 2)`;

    // 查询redis中存储的会话列表未读数
    const sessionUnread = await this.redisService.client.hgetall('userSessionUnRead:' + userId);
    return [
      ...sessionList.map((friItem) => {
        return {
          ...friItem,
          unReadNum: +sessionUnread[friItem.sessionId]
        };
      }),
      ...groupSessionList.map((groupItem) => {
        return {
          ...groupItem,
          unReadNum: +sessionUnread[groupItem.sessionId],
          content: groupItem.content
        };
      })
    ];
  }

  /**
   * @description 移除会话
   */
  async remove(sessionId) {
    await this.db.session.update({
      where: {
        sessionId: +sessionId
      },
      data: {
        isDelete: true
      }
    });
    return;
  }
  /**
   * @description 根据sessionId获取会话信息
   * @param sessionId
   * @param userId
   */
  async getSessionById(sessionId) {
    const session = await this.db.$queryRaw`SELECT
      s.session_id AS sessionId,
      s.session_type As sessionType,
      s.sender_id As senderId,
      s.receiver_id As receiverId,
      s.is_robot As isRobot,
      s.is_top AS isTop,
      s.is_disturb AS isDisturb,
      s.is_delete AS isDelete,
      s.updated_at AS updatedAt,
      u.username AS username,
      u.avatar,
      fm.content,
      fm.message_type AS messageType,
      firend.remark AS remark
      FROM
      im_session s
      LEFT JOIN im_contact_message fm ON s.last_msg_id = fm.msg_id
      LEFT JOIN im_user u ON s.receiver_id = u.user_id
      LEFT JOIN im_contact firend ON s.sender_id = firend.user_id AND firend.friend_id = s.receiver_id
      WHERE s.session_id = ${sessionId}
      `;
    const sessionInfo = session[0];
    // INFO redis中存储未读数 使用hash存储 redis的key是用户userSessionUnRead:用户id，里面的key是会话Id
    const sessionUnreadNums = +(await this.redisService.client.hget(
      'userSessionUnRead:' + sessionInfo.senderId,
      sessionInfo.sessionId.toString()
    ));
    return {
      ...sessionInfo,
      unReadNum: sessionUnreadNums
    };
  }
  /**
   * @descriptiond 根据 belongUserId receiverId 获取单个会话信息
   * @param
   */
  async findUniqueSessionInfo(sessionType, belongUserId, receiverId) {
    const sessionInfo = await this.db.session.findUnique({
      where: {
        senderId_receiverId_sessionType: {
          senderId: belongUserId,
          receiverId: receiverId,
          sessionType: sessionType
        }
      }
    });
    return sessionInfo;
  }
  /**
   * @description 根据 belongUserId receiverId 获取双方会话信息
   * @param
   */
  async findManySessionInfo(sessionType, senderId, receiverId) {
    try {
      if (sessionType === 1) {
        const sessionInfo = await this.db.session.findMany({
          where: {
            OR: [
              {
                senderId,
                receiverId,
                sessionType: 1
              },
              {
                senderId: receiverId,
                receiverId: senderId,
                sessionType: 1
              }
            ]
          },
          select: {
            sessionId: true,
            receiverId: true,
            senderId: true
          }
        });
        this.logger.info(
          JSON.stringify({
            sessionType,
            senderId,
            receiverId
          })
        );
        return {
          senderSessionId: find(sessionInfo, (item) => item.senderId === senderId).sessionId,
          receiverSessionId: find(sessionInfo, (item) => item.senderId === receiverId).sessionId
        };
      }
    } catch (error) {
      this.logger.error(JSON.stringify(error));
    }
    return;
  }
  /**
   * @description 更新聊天发送者和接收者的会话信息
   * @param sessionInfo 会话信息
   * @param data 需要更新的字段
   */
  async updateManySession(
    sessionInfo,
    data: {
      isTop?: boolean;
      isDisturb?: boolean;
      isDelete?: boolean;
      lastMsgId?: string | null;
      topMsgId?: string | null;
      topMsgUserId?: string | null;
      deletedAt?: Date | string | null;
    }
  ) {
    await this.db.session.updateMany({
      where: {
        sessionId: {
          in: [sessionInfo.senderSessionId, sessionInfo.receiverSessionId]
        }
      },
      data
    });
  }
  /**
   * @description 更新单个会话信息
   * @param sessionId 会话Id
   * @param data 更新内容
   */
  async updateSessionById(
    sessionId,
    data: {
      isTop?: boolean;
      isDisturb?: boolean;
      isDelete?: boolean;
      lastMsgId?: string | null;
      topMsgId?: string | null;
      topMsgUserId?: string | null;
      deletedAt?: Date | string | null;
    }
  ) {
    return await this.db.session.update({
      where: {
        sessionId
      },
      data
    });
  }
}
