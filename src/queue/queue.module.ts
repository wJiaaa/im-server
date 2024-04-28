/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-22 18:31:19
 */
import { Global, Module } from '@nestjs/common';
import { MessageHandlerErrorBehavior, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ProducerService } from './message/producer.service';
import { ConsumerService } from './message/consumer.service';
import { GroupModule } from '@/api/group/group.module';

@Global()
@Module({
  imports: [
    // RabbitMQModule.forRootAsync(RabbitMQModule, {
    //   useFactory: () => {
    //     return {
    //       // 交换机配置
    //       exchanges: [
    //         {
    //           // 交换机名称
    //           name: `exchanges_test`,
    //           /**
    //            * 交换机类型
    //            * direct: 直连交换机，根据消息的路由键（routing key）将消息发送到一个或多个绑定的队列。
    //               fanout: 扇形交换机，将消息广播到所有绑定的队列，无需指定路由键。
    //               topic: 主题交换机，根据消息的路由键模式匹配将消息发送到一个或多个绑定的队列。
    //               headers: 头交换机，根据消息的头部信息将消息发送到一个或多个绑定的队列。
    //            */
    //           type: 'direct',
    //           // 其他选项
    //           // 持久化（Durable）: 指定交换机、队列或消息是否需要在服务器重启后保留
    //           options: { durable: false },
    //         },
    //       ],
    //       // 连接的url
    //       uri: 'amqp://admin:admin@localhost:5672',
    //       /**
    //        * 用于配置 RabbitMQ 连接的选项。它是一个对象，可以包含以下属性：
    //         wait: 一个布尔值，表示是否等待连接成功后才开始启动应用程序。默认为 true。
    //         rejectUnauthorized: 一个布尔值，表示是否拒绝不受信任的 SSL 证书。默认为 true。
    //         timeout: 一个数字，表示连接超时时间（以毫秒为单位）。默认为 10000 毫秒。
    //         heartbeatIntervalInSeconds: 一个数字，表示心跳间隔时间（以秒为单位）。默认为 60 秒。
    //         channelMax: 一个数字，表示最大通道数。默认为 65535。
    //         这些选项将影响 RabbitMQ 连接的行为和性能。您可以根据需要进行调整
    //        */
    //       connectionInitOptions: { wait: false },
    //       /**
    //        * 用于启用直接回复模式。当设置为 true 时，
    //        * 生产者将使用 replyTo 和 correlationId 字段指定的队列和标识符来接收响应，
    //        * 而不是使用默认生成的匿名队列。这使得消费者可以将响应直接发送到请求者所在的队列，
    //        * 从而避免了性能上的开销和消息传递中断的问题。
    //        * 
    //        * 这里设置为false
    //        */
    //       enableDirectReplyTo: false,
    //       // 通道的默认预取计数。
    //       prefetchCount: 2,
    //       /**
    //       用于配置 RabbitMQ 消费者订阅的默认错误处理行为选项。
    //       当消费者处理消息时出现错误时，可以使用该选项来指定消费者应如何处理这些错误。
    //         MessageHandlerErrorBehavior.ACK 表示在发生错误时自动确认消息并从队列中删除
    //         以避免消息反复传递和死信队列的问题。
    //         如果您想要更多的控制权来处理错误，可以将其设置为 
    //         MessageHandlerErrorBehavior.NACK，然后手动决定是否重新排队或丢弃该消息。
    //        */
    //       defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.ACK,
    //     };
    //   },
    // }),
    GroupModule
  ],
  // providers: [ProducerService, ConsumerService],
  // exports: [ProducerService],
  controllers: []
})
export class QueueModule { }
