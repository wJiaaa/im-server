/*
 * @Description: 用户路由
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-28 16:59:27
 */

import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { UserLoginDto, UserRegisteDto } from './dto/user.dto';
import { Public } from '@/common/decorators/public.decorators';
import { UserInfo } from '@/common/decorators/userInfo.decorators';
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('login')
  @Public()
  @HttpCode(200)
  async login(@Body() loginData: UserLoginDto) {
    const user = await this.userService.validateUser(loginData);
    return this.userService.login(user);
  }

  @Post('register')
  @Public()
  @HttpCode(200)
  async register(@Body() user: UserRegisteDto) {
    return await this.userService.register(user);
  }

  /**
   * @description: 获取登陆验证码
   * @return {*}
   */
  @Get('getQrCode')
  @Public()
  async getQrCode(@Res() res) {
    console.log(1232);
    const code = await this.userService.getQrCode();
    res.type('image/svg+xml'); //指定返回的类型
    res.send(code); //给页面返回一张图片
  }

  @Post('logOut')
  async logOut(@UserInfo('userId') userId) {
    return this.userService.logOut(userId);
  }

  /**
   * @return {*}
   */
  @Get('getUserInfo')
  async getUserInfo(@UserInfo('userId') userId) {
    return this.userService.getUserInfo(userId);
  }

  /**
   * @return {*}
   */
  @Post('/updateUserInfo')
  async updateUserInfo(@UserInfo('userId') userId, @UserInfo('token') token, @Body() body) {
    return this.userService.updateUserInfo(userId, body, token);
  }

  @Get('health')
  @Public()
  async health() {
    console.log('健康检查health');
    return 'health';
  }

  @Post('check')
  @Public()
  async check(@Body() body) {
    console.log('服务通知', body);
  }

  /**
   * @description 获取用户的表情列表
   */
  @Get('getEmoteList')
  async getEmoteList(@UserInfo('userId') userId) {
    return this.userService.getEmoteList(userId);
  }
  /**
   * @description 新增表情
   */
  @Post('addEmote')
  async addEmote(@UserInfo('userId') userId, @Body() body) {
    return this.userService.addEmote(userId, body);
  }

  /** 测试用的 */
  @Post('getLoginUser')
  @Public()
  async getLoginUser(@Body() body) {
    return this.userService.getLoginUser();
  }
}
