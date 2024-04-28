/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-22 16:31:36
 */
import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { LoggerService } from '@/common/logger/logger.service';
@Injectable()
export class ProducerService {
  constructor(private readonly amqpConnection: AmqpConnection, private readonly logger: LoggerService) { }
  // queue = 'exchange1', routingKey = 'friendMsg',
  async sendMessage(message: any): Promise<void> {
    await this.amqpConnection.publish('exchanges_test', 'friendMsg', message);
    this.logger.log(`amqp publish message -> exchange : exchanges_test, routingKey : friendMsg ,message : ${JSON.stringify(
      message,
    )}`);
    //   headers: {
    //     'x-delay': expiration, // 一定要设置，否则无效 延迟队列
    // }
  }
}
