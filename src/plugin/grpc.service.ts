/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2023-06-30 20:20:54
 */
import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class GrpcService {
  public client: ClientGrpc;
  constructor() {
    // console.log('config.get', config.get('name'));
    // const server = config.get('consul-micro-demo');
    const option = userRpcPath('localhost:8999');
    this.client = ClientProxyFactory.create(option);
  }

  onModuleInit() {
    Logger.log('grpc  服务加载完成', 'grpcService');
  }

  changeClient() {
    // const server = this.config.get('message-micro');
    // const option = userRpcPath(server.Address + ':' + server.Port);
    // console.log('option', option);
    // this.client = ClientProxyFactory.create(option);
  }
}

const userRpcPath = (path: string) => {
  return {
    transport: Transport.GRPC as number,
    options: {
      url: path,
      package: 'hero',
      protoPath: join('src/proto', 'hero.proto')
    }
  };
};
