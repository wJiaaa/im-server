/*
 * @Description: 权限装饰器 使用 @Permissions(['article:update'])
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2022-12-01 23:13:05
 */
import { PERMISSIONS } from '@/utils/constants';
import { applyDecorators, SetMetadata } from '@nestjs/common';

export function Permissions(permissions: string[]) {
  // 可定义‘组合装饰器’
  return applyDecorators(SetMetadata(PERMISSIONS, permissions));
}
