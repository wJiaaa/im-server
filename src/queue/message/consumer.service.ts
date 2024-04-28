/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-22 16:48:36
 */
import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { GroupService } from '@/api/group/group.service';
import { sleep } from '@/utils/common';
// import { ConsumeMessage, Channel } from 'amqplib';
@Injectable()
export class ConsumerService {
  constructor(private readonly groupService: GroupService) { }
  @RabbitSubscribe({
    exchange: 'exchanges_test',
    routingKey: 'friendMsg',
    queue: 'queue1',
    queueOptions: {
      durable: true
    }
  })
  // 收到队列的订阅消息自动调用该方法
  public async consume1(msg: any) {
    // await sleep(10000)
    console.log('Consumer 1 Received1:', msg);
    // this.groupService.sendGroupMsg(msg);
    // this.logger.info(
    //   `amqp receive msg,exchange is ${arguments[1].fields.exchange},routingKey is ${routingKey},msg is ${JSON.stringify(
    //     data,
    //   )}`,
    // );
  }

  // @RabbitSubscribe({
  //   exchange: 'exchange1',
  //   routingKey: 'friendMsg',
  //   queue: 'queue12',
  //   errorHandler: (channel: Channel, msg: any, error: Error) => {
  //     console.log('error1', error);
  //     channel.reject(msg, false);
  //   }
  // })
  // public async consume2(data: {}, context: ConsumeMessage) {
  //   console.log('Consumer 1 Received1:', data);
  // }
}
