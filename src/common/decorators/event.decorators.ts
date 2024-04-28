/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2023-05-03 18:14:06
 */
export function HandleEvent(event: string) {
  return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('HANDLE_ENENT', event, descriptor.value);
  };
}
