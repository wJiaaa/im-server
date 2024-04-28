/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-28 18:05:25
 */
import Redis from 'ioredis';
import { Logger } from '@nestjs/common';
import appConfig from '@/config/app.config';
import { Injectable } from '@nestjs/common';
@Injectable()
export class RedisService {
  public client!: Redis;
  constructor() { }
  // 模块加载的时候就缓存创建redis连接
  onModuleInit() {
    if (!this.client) {
      this.getClient();
    }
    Logger.log('Redis 服务加载完成', 'RedisService');
  }

  private getClient() {
    this.client = new Redis({
      ...appConfig.redis
    });
  }

  async set(method, key, value) {
    // this.logger.info(`来自 ${method} 方法调用redis set方法`);
    // 存储

    return await this.client.set(key, JSON.stringify(value), (err) => {
      let flag = true;
      if (err) {
        // this.logger.error('redis set error', err);
        flag = false;
      }
      return flag;
    });
  }

  /**
   * @description: 删除redis中某个值
   * @param {*} method 调用方法
   * @param {*} key 键值
   */
  async del(method, key) {
    // this.logger.info(`来自 ${method} 方法调用redis del方法`);
    return await this.client.del(key);
  }

  /**
   * @description: 判断redis中是否存在某个值
   * @param {*} method 调用方法
   * @param {*} key 键值
   * @return {*} 为空返回false 否则返回true
   */
  async exit(method, key) {
    // this.logger.info(`来自 ${method} 方法调用redis exit方法`);
    const result = await this.client.exists(key);
    return Boolean(result);
  }

  /**
   * @description: 从redis中获取一个值
   * @param {*} method 调用方法
   * @param {*} key 需要获取值的键名
   * @return {*} 为空返回null 否则返回查找的值
   */
  async get(method, key) {
    // this.logger.info(`来自 ${method} 方法调用redis get方法`);
    try {
      const data = await this.client.get(key);
      if (data) {
        return JSON.parse(data);
      } else {
        return null;
      }
    } catch (e) {
      return await this.client.get(key);
    }
  }

  /**
   * @description: 设置一个带有过期时间的key
   * @param {*} method 调用方法
   * @param {*} key 需要获取值的键名
   * @param {*} value 需要设置的值
   * @param {*} expired 过期时间
   * @return {*}
   */
  async setTimeKey(method, key, value, expired) {
    // this.logger.info(`来自 ${method} 方法调用redis setTimeKey方法`);
    // TODO 需要判断value 是否是对象
    return await this.client.setex(key, expired, JSON.stringify(value));
  }
  /**
    * @Description 修改redis中未读数
    */
  async increaseSessionUnreadNum(userId: string, sessionId: string): Promise<void> {
    const tx = this.client.multi();
    tx.hincrby('userSessionUnRead:' + userId, sessionId, 1); // 增加未读数
    await tx.exec(); // 执行事务
  }
}
