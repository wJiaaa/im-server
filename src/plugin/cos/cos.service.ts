/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-28 22:00:56
 */
import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';
@Injectable()
export class CosService {
  private cosClient;
  constructor() {
    this.cosClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: Number(process.env.MINIO_PORT),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY
    });
  }

  onModuleInit() {
    // TODO 可选择传到哪个cos
    Logger.log('对象存储 服务加载完成', 'CosService');
  }
  /**
   * @description: 上传文件到cos
   * @param {*} options
   * @return {*} 上传文件的url
   */
  public uploadCosFile = async (options): Promise<string> => {
    console.log('options', options);
    // TODO 压缩图片 返回封面图
    try {
      const { bucketName, fileName, fileBuffer, fileSize, metaData } = options;
      return await new Promise((resolve, reject) =>
        this.cosClient.putObject(bucketName, fileName, fileBuffer, fileSize, metaData, (err, data) => {
          if (err) {
            Logger.error('cos上传失败', err);
            return reject(err);
          }
          Logger.log('cos上传成功', data);
          resolve(data);
        })
      );
    } catch (error) {
      console.log('error', error);
    }
  };
}
