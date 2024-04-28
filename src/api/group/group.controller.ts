/*
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { UserInfo } from '@/common/decorators/userInfo.decorators';
import { Controller, Get, Post, Body, Delete, Query, UseInterceptors } from '@nestjs/common';
import { GroupService } from './group.service';
import { DateFormatInterceptor } from '@/common/interceptor/DateFormatInterceptor';

@UseInterceptors(new DateFormatInterceptor())
@Controller('group')
export class GroupController {
  constructor(
    private readonly groupService: GroupService
  ) { }

  @Post('create')
  create(@Body() body, @UserInfo() userInfo) {
    return this.groupService.create({ ...body, userInfo });
  }

  @Post('createGroupAnnouncement')
  createGroupAnnouncement(@Body() body, @UserInfo('userId') userId) {
    return this.groupService.createGroupAnnouncement({ ...body, userId });
  }

  @Post('invite')
  invite(@Body() body, @UserInfo() inviteUserInfo) {
    return this.groupService.invite({ ...body, inviteUserInfo });
  }

  @Post('updateMemberInfo')
  updateMemberInfo(@Body() body, @UserInfo('userId') userId) {
    return this.groupService.updateMemberInfo({ ...body, userId });
  }

  @Get('getGroupAnnouncement')
  getGroupAnnouncement(@Query() query) {
    return this.groupService.getGroupAnnouncement(query);
  }

  @Get('getGroupList')
  getGroupList(@UserInfo() userInfo) {
    return this.groupService.getGroupList(userInfo);
  }

  @Get('getGroupMember')
  getGroupMember(@Query() query) {
    return this.groupService.getGroupMember(query);
  }

  @Get('getGroupInfo')
  getGroupInfo(@Query() query) {
    return this.groupService.getGroupInfo(query);
  }

  @Delete('exitGroup')
  exitGroup(@Query() body, @UserInfo('userId') userId) {
    return this.groupService.exitGroup({ userId, ...body });
  }
}
