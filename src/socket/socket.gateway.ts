/*
 * @Description: ws
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { PrismaService } from 'nestjs-prisma';
import { RedisService } from '@/plugin/redis/redis.service';
import { Server, Socket } from 'socket.io';
// TODO ws也需要有个拦截器
@WebSocketGateway(9094, { namespace: '/chat', cors: true })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private onlineCount = 0
  constructor(private readonly db: PrismaService, private readonly redisService: RedisService) {
  }

  // TODO 改成private
  @WebSocketServer()
  public wsServer: Server;

  /**
   * @description 服务端发送消息到客户端
   * @param clientId 客户端ID userId或者groupId
   * @param type 发送消息的type
   * @param data 发送的消息
   */
  sendMessageToClient<T extends MessageType>(clientId: string, type: T, data: MessageDataMap[T]): void {
    this.wsServer.to(clientId).emit(type, data);
  }
  /**
   * @description 客户端连接处理
   */
  public handleConnection(client: Socket): void {
    this.connectSuccess(client, client.handshake.query);
  }
  /**
   * @description 客户端断开连接处理
   */
  public handleDisconnect(client: Socket): void {
    console.log('Disconnected', client.id);
  }

  /**
   * @description
   * @param client Socket连接
   * @param query socket连接携带的参数
   */
  public async connectSuccess(client: Socket, query) {
    const { userId } = query;
    // 进来统计一下在线人数
    console.log('用户上线', userId);
    // 获取用户所在群聊
    const groupList = await this.db.groupMember.findMany({
      where: {
        userId,
        isQuit: false
      },
      select: {
        groupId: true,
        isQuit: false
      }
    });

    groupList.forEach((item) => {
      if (item) {
        client.join(item.groupId.toString());
      }
    });

    //  socket.io会自动将client.id加入到一个房间 我们可以将用户id与client.id进行映射
    if (userId) {
      client.join(userId);
      // TODO 是否需要使用映射
      client.leave(client.id);
    }
    // console.log('client', client);
    return '连接成功';
    // this.server.to(id).emit("hello", JSON.stringify({ event: 'hello', data: 'ss' }))
  }

  /**
   * @description 处理消息已读
   */
  @SubscribeMessage('readMessage')
  async readMessage(@MessageBody() data): Promise<boolean> {
    await this.db.contactMessage.updateMany({
      where: {
        OR: data.idList.map((item) => {
          return {
            msgId: item
          };
        })
      },
      data: {
        read: true
      }
    });
    const msgList = await this.db.contactMessage.findMany({
      where: {
        msgId: {
          in: data.idList
        }
      }
    });

    this.wsServer.to(data.receiverId).emit('receiveReadMessage', msgList);
    return true;
  }

  /**
   * @description 清空redis会话列表未读数
   */
  @SubscribeMessage('clearMessageUnread')
  async clearMessageUnread(@MessageBody() data): Promise<void> {
    this.redisService.client.hdel('userSessionUnRead:' + data.userId, data.sessionId);
  }

  /**
   * @description 退出群聊
   */
  @SubscribeMessage('exitGroup')
  async exitGroup(@MessageBody() data, @ConnectedSocket() client: Socket): Promise<boolean> {
    client.leave(data.groupId.toString());
    return true;
  }

}
