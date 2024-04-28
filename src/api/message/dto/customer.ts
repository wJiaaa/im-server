/*
 * @Description: 自定义参数校验器
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2022-12-28 21:47:26
 */
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsNumberAndInt(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsNumberAndInt',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          return !Number.isNaN(+value) && +value % 1 === 0;
        }
      }
    });
  };
}
