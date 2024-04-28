/*
 * @Description: 常量
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2023-06-28 23:27:00
 */
import { ErrorEnum } from '@/enums';
// 错误类型
export const ERROR_TYPE = {
  [ErrorEnum.errorPwd]: '密码错误',
  [ErrorEnum.userNotExit]: '用户不存在',
  [ErrorEnum.codeExpired]: '验证码过期',
  [ErrorEnum.codeError]: '验证码错误',
  [ErrorEnum.loginStateExpired]: '登陆已过期，请重新登陆'
};

/** 接口访问权限装饰器类型 */
export const PERMISSIONS = 'permissions';

export const IMAGE_TYPE = 'image';
export const VIDEO_TYPE = 'video';
export const TXT_TYPE = 'txt';
