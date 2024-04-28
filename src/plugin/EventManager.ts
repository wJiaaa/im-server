/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2023-06-28 21:40:39
 */
import { EventHandlerDiscovery } from './event-handler.discovery';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class EventManager implements OnModuleInit {
  private eventsToHandlersMap;
  constructor(private readonly eventHandlerDiscovery: EventHandlerDiscovery) {}
  async onModuleInit() {
    this.eventsToHandlersMap = await this.eventHandlerDiscovery.getEventsToHandkersMap();
  }
  public fireEvent(event, data) {
    const handler = this.eventsToHandlersMap.get(event);
    if (handler) {
      handler(data);
    }
  }
}
