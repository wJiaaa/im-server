/*
 * @Description: ws
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Module, Global } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
@Global()
@Module({
  imports: [],
  providers: [SocketGateway],
  exports: [SocketGateway]
})
export class SocketModule { }
