/*
 * @Description: 用户登录注册服务
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-24 21:16:45
 */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashPassword, checkPassword } from 'src/utils/bcrypt';
import { ToolsService } from '@/plugin/tools/tools.service';
import { PrismaService } from 'nestjs-prisma';
import { RedisService } from '@/plugin/redis/redis.service';
import { ERROR_TYPE } from '@/utils/constants';
import { ErrorEnum } from '@/enums';
import { LoggerService } from '@/common/logger/logger.service';
import { RobotService } from '../robot/robot.service';
import { MessageService } from '../message/message.service';
import { UpdateUserDto, UserRegisteDto } from './dto/user.dto';
@Injectable()
export class UserService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly toolsService: ToolsService,
    private readonly db: PrismaService,
    private readonly logger: LoggerService,
    private readonly roBotService: RobotService,
    private readonly messageService: MessageService
  ) { }
  /**
   * @description 新增表情
   * @param
   */
  async addEmote(userId, body) {
    await this.db.emote.create({
      data: {
        userId,
        ...body
      }
    });
    return;
  }
  /**
   * @description 获取用户表情列表
   * @param userId
   */
  getEmoteList(userId) {
    return this.db.emote.findMany({
      where: {
        userId
      }
    });
  }
  /**
   * @description: 校验用户信息
   * @return {*}
   */
  async validateUser(loginData): Promise<any> {
    const { tel, password } = loginData;
    const user = await this.db.user.findUnique({
      where: {
        tel
      }
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (!checkPassword(password, user.password)) {
      throw new HttpException('密码错误', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return user;
  }

  /**
   * @description: 校验二维码是否正确
   * @param {*} code
   * @return {*}
   */
  async validateCode(code): Promise<void> {
    // 校验验证码是否正确
    const cacheCode = await this.redisService.get('login', 'loginCode');
    if (!code || !cacheCode) {
      throw new HttpException(ERROR_TYPE[ErrorEnum.codeExpired], ErrorEnum.codeExpired);
    }
    if (+cacheCode !== +code) {
      throw new HttpException(ERROR_TYPE[ErrorEnum.codeError], ErrorEnum.codeError);
    }
  }

  /**
   * @description: 用户登陆
   * @param {*} user
   * @return {*}
   */
  async login(user) {
    const { userId } = user;
    // 生成一个id用来生成token 并且当作缓存的key 缓存用来存储用户信息
    const token = this.jwtService.sign({ login_user_key: userId });
    // 存储用户信息
    this.redisService.set('login', 'login_user_key:' + userId, { ...user, token });
    // // 1.找到与该机器人的会话
    // const session = await this.db.session.findUnique({
    //   where: {
    //     senderId_receiverId_sessionType: {
    //       userId: userId,
    //       receiverId: 'robot_2',
    //       sessionType: 1
    //     }
    //   }
    // });
    // await this.db.loginNoticeMessage.create({
    //   data: {
    //     userId,
    //     loginIp: 'localhost',
    //     loginAgent: '1',
    //     loginAddress: '1'
    //   }
    // });
    // // TODO 登录消息和好友消息建立关系
    // await this.roBotService.robotSendMessageToUser('[登录消息]', session, {
    //   userId: userId,
    //   receiverId: 'robot_2'
    // });
    // // 更新redis中该会话列表的未读数
    // await this.messageService.increaseSessionUnreadNum(userId, session.sessionId.toString());
    return token;
  }

  /**
   * @description: 用户注册
   * @param {*} user
   * @return {*}
   */
  async register(user: UserRegisteDto) {
    // 判断是否已经有用户使用手机号注册
    const haveUser = await this.db.user.findUnique({
      where: {
        tel: user.tel
      }
    });
    if (!haveUser) {
      const regInfo = await this.db.user.create({
        data: {
          ...user,
          password: hashPassword(user.password)
        }
      });
      // // 添加系统机器人为好友 不能删除
      // await this.db.friend.createMany({
      //   data: [
      //     { userId: regInfo.userId, friendId: 'robot_1' },
      //     { userId: regInfo.userId, friendId: 'robot_2' }
      //   ]
      // });
      // // 创建和系统机器人的会话
      // await this.db.session.createMany({
      //   data: [
      //     {
      //       sessionType: 1,
      //       receiverId: 'robot_1',
      //       userId: regInfo.userId,
      //       isRobot: true
      //     },
      //     {
      //       sessionType: 1,
      //       receiverId: 'robot_2',
      //       userId: regInfo.userId,
      //       isRobot: true
      //     }
      //   ]
      // });
      return regInfo.userId;
    }
    return '用户已存在';
  }

  /**
   * @description: 退出登录
   * @return {*}
   */

  async logOut(userId) {
    // 清空redis中用户的 token_key user_info userId_tokenKey
    await this.redisService.del('loginOut', 'login_user_key:' + userId);
    return;
  }

  /**
   * @Description 获取二维码
   */
  async getQrCode() {
    console.log(123);

    const svgCaptcha = await this.toolsService.captche(); //创建验证码
    // 将二维码结果存在redis /缓存中
    this.redisService.setTimeKey('getCode', 'loginCode', svgCaptcha.text, 60);
    this.logger.log(svgCaptcha.text);
    return svgCaptcha.data;
  }
  /**
   * @description 获取用户信息
   * @param userId 用户id
   */
  async getUserInfo(userId) {
    return await this.db.user.findUnique({
      where: {
        userId
      },
      select: {
        userId: true,
        tel: true,
        username: true,
        signature: true,
        avatar: true,
        email: true,
        birthday: true,
        gender: true
      }
    });
  }
  /**
   *  更新用户信息
   * @param userId
   * @param data
   * @param token
   * @returns
   */
  async updateUserInfo(userId, data: UpdateUserDto, token) {
    const userInfo = await this.db.user.update({
      where: {
        userId
      },
      data: {
        ...data
      },
      select: {
        userId: true,
        username: true,
        avatar: true,
        signature: true,
        gender: true,
        email: true,
        isRobot: true,
        birthday: true
      }
    });
    // 更新redis中的信息
    await this.redisService.set('updateUserInfo', 'login_user_key:' + userId, { ...userInfo, token });
    return userInfo;
  }
  /**
   * @description 获取登录用户 用于测试
   */
  async getLoginUser() {
    const pattern = 'login_user_key:*';
    const keys = await this.redisService.client.keys(pattern);
    return this.redisService.client.mget(keys);
  }
}
