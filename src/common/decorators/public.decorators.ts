/*
 * @Description: 自定义装饰器
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2022-12-28 22:04:42
 */
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
