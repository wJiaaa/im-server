/*
 * @Description: 数据校验管道 这里是为了校验数据 与main.ts ValidationPipe 不同
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-23 15:50:06
 */
import { ArgumentMetadata, Injectable, PipeTransform, HttpException, HttpStatus } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { values } from 'lodash';
import { LoggerService } from '../logger/logger.service';
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  constructor(private readonly logger: LoggerService) { }
  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype } = metadata;
    // 如果没有传入验证规则，则不验证，直接返回数据
    if (!metatype || !this.toValidate(metatype)) {
      // value 当前处理的参数在我们的路由处理方法接收之前的输入值
      // metadata 当前处理的参数元数据
      return value;
    }
    // 将对象转换为 Class 来验证
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      // 遍历全部的错误信息,返回给前端
      // const errorMessage = errors.map(item => {
      //   return {
      //     currentValue: item.value === undefined ? '' : item.value,
      //     [item.property]: _.values(item.constraints)[0],
      //   };
      // });
      //获取第一个错误并且返回
      const msg = values(errors[0].constraints)[0];
      throw new HttpException({ message: msg }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return value;
  }
}
