/*
 * @Description: 登录DTO
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
export class UserLoginDto {
  @IsNotEmpty({ message: '手机号不能为空' })
  readonly tel: string;

  @IsNotEmpty({ message: '密码不能为空' })
  readonly password: string;

  @IsNotEmpty({ message: '验证码不能为空' })
  readonly code: number | string;
}

export class UserRegisteDto {
  @IsNotEmpty({ message: '手机号不能为空' })
  readonly tel: string;

  @IsNotEmpty({ message: '密码不能为空' })
  readonly password: string;

  @IsNotEmpty({ message: '用户名不能为空' })
  readonly username: string;
}
export class UpdateUserDto {
  @IsString()
  readonly avatar: string;
  @IsString()
  readonly username: string;
  @IsNumber()
  readonly gender: number;
  @IsString()
  readonly birthday: string;
  @IsString()
  readonly email: string;
  @IsString()
  readonly signature: string;
  @IsString()
  readonly tel: string
}