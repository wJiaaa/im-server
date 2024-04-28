/*
 * @Description: 好友
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-28 16:54:05
 */
import { Controller, Get, Post, Body, Delete, Query, Put } from '@nestjs/common';
import { FriendService } from './friend.service';
import { UserInfo } from '@/common/decorators/userInfo.decorators';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) { }

  /**
   * @Description  请求添加好友
   */
  @Post('requestAddFriend')
  requestAddFriend(@Body() body, @UserInfo() userInfo) {
    return this.friendService.requestAddFriend({ userInfo, ...body });
  }

  /**
   * @Description 获取全部好友列表
   */
  @Get('getMyFriendList')
  getMyFriendList(@UserInfo('userId') userId) {
    return this.friendService.getMyFriendList(userId);
  }

  /**
   * @Description 查找好友
   * @param tel 手机号
   */
  @Get('search')
  searchFriend(@Query() params) {
    return this.friendService.searchFriend(params);
  }

  /**
   * @description 同意添加好友
   */
  @Post('agree')
  agreeFriend(@Body() body, @UserInfo('userId') userId) {
    return this.friendService.agreeFriend({ ...body, userId });
  }

  /**
   * @description 拒绝添加好友
   */
  @Post('refuse')
  refuseFriend(@Body() body, @UserInfo('userId') userId) {
    return this.friendService.refuseFriend({ ...body, userId });
  }

  /**
   * @Description 获取好友请求列表
   */
  @Get('getAllFriendAddReq')
  getAllFriendAddReq(@UserInfo('userId') userId) {
    return this.friendService.getAllFriendAddReq(userId);
  }

  /**
   * @Description 删除好友
   */
  @Delete('delete')
  deleteFriend(@Query() body, @UserInfo('userId') userId) {
    return this.friendService.deleteFriend({ userId, ...body });
  }

  /**
   * @description 获取用户信息
   */
  @Get('getFriendInfo')
  getFriendInfo(@UserInfo('userId') userId, @Query() params) {
    return this.friendService.getFriendInfo(userId, params.friendId);
  }
  /**
   * @description 修改好友信息
   */
  @Put('updateFriendInfo')
  updateFriendInfo(@UserInfo('userId') userId, @Body() body) {
    return this.friendService.updateFriendInfo(userId, body);
  }
}
