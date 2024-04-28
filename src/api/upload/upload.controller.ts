/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-28 16:58:56
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Query
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ensureDir } from 'fs-extra';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        //自定义路径
        destination: (req, file, cb) => {
          const multerConfig = {
            dest: '../../../uploads'
          };
          // 创建临时文件
          if (!existsSync(join(__dirname, multerConfig.dest + '/tempFile'))) {
            mkdirSync(join(__dirname, multerConfig.dest + '/tempFile'));
          }
          const uploadPath = multerConfig.dest + '/tempFile/' + req.body.fileMd5;
          ensureDir(join(__dirname, uploadPath));
          cb(null, join(__dirname, uploadPath));
        },
        filename: (req, file, cb) => {
          return cb(null, file.originalname);
        }
      })
    })
  )
  @Post()
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body) {
    if (!file) {
      throw new HttpException('请选择上传文件', HttpStatus.BAD_REQUEST);
    }
    return this.uploadService.create({ file, ...body });
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('uploadToCos')
  async uploadToCos(@UploadedFile() file: Express.Multer.File, @Body() body) {
    if (!file) {
      throw new HttpException('请选择上传文件', HttpStatus.BAD_REQUEST);
    }
    return this.uploadService.uploadToCos({ file, ...body });
  }

  @Get('/merge')
  merge(@Query() params) {
    return this.uploadService.merge(params);
  }
}
