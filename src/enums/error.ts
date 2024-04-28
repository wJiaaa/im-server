/*
 * @Description: 请求错误枚举
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2022-12-04 17:45:20
 */

export enum ErrorEnum {
  /** 服务异常 */
  systemError = 1000,
  /** 密码错误 */
  errorPwd = 1001,
  /** 用户不存在 */
  userNotExit = 1002,
  /** 验证码过期 */
  codeExpired = 1003,
  /** 验证码错误 */
  codeError = 1004,
  /** 没有验证码 */
  noCode = 1005,
  /** 登陆过期 */
  loginStateExpired = 1006
}
