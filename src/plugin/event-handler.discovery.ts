/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2023-06-28 21:40:30
 */
import { Injectable } from '@nestjs/common';
import { DiscoveryService } from '@golevelup/nestjs-discovery';
@Injectable()
export class EventHandlerDiscovery {
  constructor(private readonly discoveryService: DiscoveryService) {}
  public async getEventsToHandkersMap() {
    const scanResult = await this.discoveryService.providerMethodsWithMetaAtKey('HANDLE_ENENT');
    const eventsToHandersMap = new Map();

    scanResult.forEach((result) => {
      const event = result.meta;
      const handler = result.discoveredMethod.handler;
      const that = result.discoveredMethod.parentClass.instance;
      const boundHandler = handler.bind(that);
      // TODO 需要对多个HANDLE_ENENT 处理 让其能够触发多条
      eventsToHandersMap.set(event, boundHandler);
    });
    return eventsToHandersMap;
  }
}
