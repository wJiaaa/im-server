/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { RedisService } from '@/plugin/redis/redis.service';
import { SocketGateway } from '@/socket/socket.gateway';
import { HandleEvent } from '@/common/decorators/event.decorators';
import { HeroById } from './interfaces/hero-by-id.interface';
import { Hero } from './interfaces/hero.interface';
import { Observable } from 'rxjs';
import { find } from 'lodash';
import { ToolsService } from '@/plugin/tools/tools.service';
import { GrpcService } from './../../plugin/grpc.service';
interface HeroService {
  findOne(data: HeroById): Observable<Hero>;
  findMany(upstream: Observable<HeroById>): Observable<Hero>;
}

@Injectable()
export class GroupService {
  constructor(
    private readonly db: PrismaService,
    private readonly socket: SocketGateway,
    private readonly redisService: RedisService,
    private readonly grpcService: GrpcService,
    private readonly toolsService: ToolsService
  ) { }
  /**
   * @description 邀请用户进入群聊
   */
  async invite(body) {
    console.log('vbo', body);
    const { memberList, groupId, avatar, inviteUserInfo } = body;
    const groupMemList = memberList.map((item) => {
      return {
        userId: item.userId,
        groupId: +groupId,
        nickName: item.username
      };
    });
    const member = memberList.map((item) => item.username);
    const initMsg = inviteUserInfo.username + '邀请了 ' + member.join('、') + ' 加入群聊';
    await this.db.group.update({
      where: {
        groupId
      },
      data: {
        avatar
      }
    });
    await this.db.groupMember.createMany({
      data: groupMemList
    });
    await this.db.session.createMany({
      data: groupMemList.map((item) => {
        return {
          sessionType: 2,
          senderId: item.userId,
          receiverId: groupId.toString()
        };
      })
    });
    const groupSession = await this.db.session.findMany({
      where: {
        sessionType: 2,
        receiverId: groupId.toString()
      },
      select: {
        senderId: true,
        sessionId: true
      }
    });
    const sockets = await this.socket.wsServer.fetchSockets();
    groupMemList.forEach((item) => {
      const socketClient = find(sockets, (e) => e.handshake.query.userId === item.userId);
      if (socketClient) {
        socketClient.join(item.groupId.toString());
      }
    });
    const groupInfo = await this.db.group.findUnique({
      where: {
        groupId
      }
    });
    groupSession.forEach((session) => {
      this.socket.wsServer.to(session.senderId).emit('addGroup', {
        createdAt: new Date(),
        deletedAt: null,
        groupId: groupId,
        groupName: groupInfo.groupName,
        sessionId: session.sessionId,
        sessionType: 2,
        userId: session.senderId,
        avatar: groupInfo.avatar
      });
    });
    const ownerInfo = await this.db.user.findUnique({
      where: {
        userId: groupInfo.creatorId
      },
      select: {
        username: true
      }
    });
    const extra = {
      members: memberList,
      ownerId: groupInfo.creatorId,
      ownerName: ownerInfo.username,
      type: 1
    };
    await this.sendGroupMsg({
      msgInfo: {
        content: initMsg,
        groupId: +groupId,
        messageType: 99,
        msgId: this.toolsService.generateMsgUniqueId(),
        extra: extra
      },
      userInfo: {
        ...inviteUserInfo,
        userId: '0'
      }
    });
  }
  /**
   * @description 创建群聊
   */
  async create(createGroupDto) {
    console.log('createGroupDto', createGroupDto);
    const { memberList, userInfo, groupName, avatar } = createGroupDto;
    const member = memberList.map((item) => item.username);
    const initMsg = userInfo.username + '邀请了 ' + member.join('、') + ' 加入群聊';
    const newGroup = await this.db.group.create({
      data: {
        groupName,
        creatorId: userInfo.userId,
        avatar
      }
    });
    const groupMemList = [
      ...memberList.map((item) => {
        return {
          userId: item.userId,
          groupId: newGroup.groupId,
          nickName: item.username
        };
      }),
      { userId: userInfo.userId, groupId: newGroup.groupId, nickName: userInfo.username, type: 2 }
    ];

    await this.db.groupMember.createMany({
      data: groupMemList
    });
    await this.db.session.createMany({
      data: groupMemList.map((item) => {
        return {
          sessionType: 2,
          senderId: item.userId,
          receiverId: newGroup.groupId.toString()
        };
      })
    });
    const groupSession = await this.db.session.findMany({
      where: {
        sessionType: 2,
        receiverId: newGroup.groupId.toString()
      },
      select: {
        senderId: true,
        sessionId: true
      }
    });

    // const sockets = await this.socket.wsServer.fetchSockets();
    // groupMemList.forEach((item) => {
    //   const socketClient = find(sockets, (e) => e.handshake.query.userId === item.userId);
    //   if (socketClient) {
    //     socketClient.join(item.groupId.toString());
    //   }
    // });

    groupSession.forEach((session) => {
      this.socket.wsServer.to(session.senderId).emit('addGroup', {
        createdAt: newGroup.createdAt,
        deletedAt: null,
        groupId: newGroup.groupId,
        groupName: newGroup.groupName,
        sessionId: session.sessionId,
        sessionType: 2,
        senderId: session.senderId,
        avatar: newGroup.avatar
      });
    });
    const extra = {
      members: memberList,
      ownerId: userInfo.userId,
      ownerName: userInfo.username,
      type: 1
    };
    const newMsg = await this.sendGroupMsg({
      msgInfo: {
        content: initMsg,
        groupId: newGroup.groupId,
        messageType: 99,
        msgId: this.toolsService.generateMsgUniqueId(),
        extra: extra
      },
      userInfo: {
        ...userInfo,
        userId: '0'
      }
    });

    return newMsg;
  }

  /**
   * @description 获取当前用户所在的群聊列表
   */
  async getGroupList(userInfo) {
    return await this.db.$queryRaw`
      SELECT
	      g.group_name As groupName, 
        g.created_at As createdAt,
        g.creator_id As creatorId,
        g.group_id As groupId,
        g.avatar,
        g.updated_at As updatedAt,
        g.is_mute As isMute,
        s.session_id As sessionId,
        s.session_type As sessionType
      FROM im_group g
	    INNER JOIN im_group_member gm
	    ON gm.group_id = g.group_id
      INNER JOIN im_session s
	    ON s.receiver_id = g.group_id AND s.sender_id = gm.user_id AND s.session_type = 2
      WHERE gm.user_id = ${userInfo.userId} AND gm.is_quit = false AND g.is_dismiss = false;
    `;
  }

  /**
   * @description 获取群聊消息
   */
  async getGroupMsg(params) {
    const { pageNum = 1, pageSize = 50, groupId } = params;
    const total = await this.db.groupMessage.count({
      where: {
        belongGroupId: groupId
      }
    });
    const msgList: any = await this.db.group.findUnique({
      where: {
        groupId
      },
      include: {
        messages: {
          orderBy: {
            msgId: 'desc'
          },
          skip: (pageNum - 1) * pageSize,
          take: pageSize
        }
      }
    });
    // TODO content里固定的名字需要改变 可以通过${userId}的形式 前端替换调${userId}获取后端替换 最近会话列表也是
    const newMsgList = msgList.messages.map((item) => {
      if (item.extra) {
        return { ...item, extra: JSON.parse(item.extra) };
      }
      return item;
    });
    return { messageList: newMsgList.reverse(), total };
  }

  /**
   * @description 发送群聊消息
   */
  async sendGroupMsg(options) {
    console.log('options', options);

    const { msgInfo, userInfo } = options;
    // 判断是否有引用消息id 如果有找到并存入extra中
    if (msgInfo.extra?.quoteId) {
      const quoteMsgItem = await this.db.groupMessage.findUnique({
        where: {
          msgId: msgInfo.extra.quoteId
        }
      });
      msgInfo.extra.quote = quoteMsgItem;
    }
    const memberInfo = await this.db.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userInfo.userId,
          groupId: msgInfo.groupId
        }
      }
    });
    const newMsg = await this.db.groupMessage.create({
      data: {
        content: msgInfo.content,
        senderId: userInfo.userId,
        messageType: msgInfo.messageType,
        msgId: msgInfo.msgId,
        extra: JSON.stringify(msgInfo.extra)
      }
    });
    await this.db.group.update({
      where: {
        groupId: +msgInfo.groupId
      },
      data: {
        messages: {
          connect: newMsg
        }
      },
      select: {
        groupName: true,
        avatar: true
      }
    });
    //TODO 判断用户是否退出群聊 若没有退出则更新最近聊天列表 并推送消息 退出则不推送
    const groupMember = await this.db.groupMember.findMany({
      where: {
        groupId: msgInfo.groupId
      }
    });

    await this.db.session.updateMany({
      where: {
        receiverId: msgInfo.groupId.toString(),
        senderId: {
          in: groupMember.filter((item) => !item.isQuit).map((k) => k.userId)
        }
      },
      data: {
        lastMsgId: newMsg.msgId,
        isDelete: false
      }
    });
    // 更新当前群聊消息总数 total
    const groupMsgTotal = await this.redisService.client.incr('groupMsgNum:' + msgInfo.groupId);
    console.log('groupMsgTotal', groupMsgTotal);
    const session = await this.db.session.findMany({
      where: {
        receiverId: msgInfo.groupId.toString(),
        isDelete: false
      }
    });
    session.forEach(async (s) => {
      // 获取redis中该会话列表的未读数
      // TODO 我自己发出去的不需要收到unreadnum应该为0 或者receiveRecentMsg不推给自己发送消息的人
      const sessionUnreadNums = await this.increaseSessionUnreadNum(s.senderId, s.sessionId.toString()); // 增加未读数
      this.socket.wsServer.to(s.senderId).emit('receiveMessage', {
        avatar: userInfo.avatar,
        createdAt: newMsg.createdAt,
        senderId: userInfo.userId,
        receiverId: msgInfo.groupId,
        content: msgInfo.content,
        messageType: msgInfo.messageType,
        msgToken: msgInfo.msgToken,
        msgId: msgInfo.msgId,
        sessionType: 2,
        status: 2,
        extra: msgInfo.extra,
        atUserIdList: msgInfo.atUserIdList,
        sessionId: s.sessionId,
        updatedAt: s.updatedAt,
        unReadNum: sessionUnreadNums,
        lastMsgSendUserId: newMsg.senderId,
        lastMsgSendUserName: memberInfo.nickName
      });
    });
    return newMsg;
  }
  /**
   * @Description 修改redis中未读数
   */
  async increaseSessionUnreadNum(userId: string, sessionId: string): Promise<number> {
    const tx = this.redisService.client.multi();
    tx.hincrby('userSessionUnRead:' + userId, sessionId, 1); // 增加未读数
    const [[err, newUnReadNum]] = await tx.exec(); // 执行事务
    // TODO 需要考虑失败的问题
    return newUnReadNum as number;
  }
  /**
   * @description 根据群ID获取群聊成员
   */
  async getGroupMember(query) {
    const { groupId } = query;
    return await this.db.$queryRaw`
        SELECT user.user_id AS userId, 
         user.avatar,
         gm.type,
         gm.nick_name As nickName,
         gm.is_mute AS isMute,
         gm.remark,
         user.gender,
         user.signature,
         user.email
        FROM im_group_member gm
	      INNER JOIN im_user user
	      ON gm.user_id = user.user_id
        WHERE gm.group_id = ${groupId}
    `;
  }
  /**
   * @Description 根据群ID获取群聊信息
   */
  async getGroupInfo(query) {
    const { groupId } = query;
    return await this.db.group.findUnique({
      where: {
        groupId: +groupId
      },
      select: {
        groupId: true,
        creatorId: true,
        groupName: true,
        groupAnnouncement: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            createUser: {
              select: {
                nickName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
  }
  /**
   * @description 用户退出群聊
   */
  async exitGroup(data) {
    console.log('data', data);
    // TODO 退出群聊需要判断是否是群主 是群主则不能退出
    // TODO 入参 参数转换
    // BUG 退出群聊需要删除最近会话列表
    const { userId, groupId, sessionId } = data;

    await this.db.session.update({
      where: {
        sessionId: +sessionId
      },
      data: {
        isDelete: true
      }
    });
    await this.db.groupMember.update({
      where: {
        userId_groupId: {
          userId,
          groupId: +groupId
        }
      },
      data: {
        isQuit: true,
        quitTime: new Date()
      }
    });
    return;
  }
  /**
   * @Description 创建群公告
   * @param data
   * @returns
   * @memberof GroupService
   */
  async createGroupAnnouncement(data) {
    const { content, belongGroupId, userId } = data;
    const announcement = await this.db.groupAnnouncement.create({
      data: {
        content: content,
        createdAt: new Date(),
        createUser: { connect: { userId_groupId: { userId, groupId: belongGroupId } } },
        belongGroup: { connect: { groupId: belongGroupId } }
      }
    });
    // 推送给当前群聊
    this.socket.wsServer.to(belongGroupId.toString()).emit('updateGroupAnnouncement', announcement.belongGroupId);
    return announcement;
  }
  /**
   * @description 获取群公告
   */
  async getGroupAnnouncement(data) {
    const { groupId } = data;
    return await this.db.groupAnnouncement.findMany({
      where: {
        belongGroupId: +groupId
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        createUser: {
          select: {
            nickName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  @HandleEvent('sendGroupMsg')
  async ceshi(aaa) {
    return await this.grpcService.client.getService<HeroService>('HeroService').findOne({ id: 1 });
  }
  /**
   * @description 更新群成员信息
   * @param params
   */
  async updateMemberInfo(params: { userId: string; groupId: number; nickName?: string }) {
    console.log('params', params);
    const { userId, groupId, nickName } = params;
    await this.db.groupMember.update({
      where: {
        userId_groupId: {
          userId,
          groupId: +groupId
        }
      },
      data: {
        nickName
      }
    });
    const memberInfo = await this.db.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: +groupId
        }
      },
      select: {
        isMute: true,
        nickName: true,
        remark: true,
        type: true
      }
    });
    this.socket.wsServer.to(groupId + '').emit('updateGroupMember', { ...memberInfo, userId, groupId });
  }
}
