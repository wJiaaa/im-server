/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2023-06-02 00:48:54
 */
import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import SnowFlake from '@/utils/snowflake';
import * as svgCaptcha from 'svg-captcha';
@Injectable()
export class ToolsService {
  public idWorker;
  constructor() {
    this.idWorker = new SnowFlake(1, 1);
  }

  onModuleInit() {
    Logger.log('Tools 服务加载完成', 'RedisService');
  }

  async captche(size = 4) {
    // const captcha = svgCaptcha.create({
    //   //可配置返回的图片信息
    //   size, //生成几个验证码
    //   fontSize: 50, //文字大小
    //   width: 100, //宽度
    //   height: 34, //高度
    //   background: '#cc9966' //背景颜色
    // });
    const captcha = svgCaptcha.createMathExpr({
      mathMin: -20,
      mathMax: 20,
      width: 100, //宽度
      height: 40, //高度
      mathOperator: '+-',
      size,
      background: '#cc9966' //背景颜色
    });
    return captcha;
  }
  /**
   * @description 生成一个msgId
   */
  generateMsgUniqueId() {
    const id = this.idWorker.nextId();
    return id.toString();
  }
}
