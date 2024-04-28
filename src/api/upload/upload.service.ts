/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-28 22:01:26
 */
import { Injectable } from '@nestjs/common';
import { readdir, removeSync } from 'fs-extra';
import { join } from 'path';
import * as fs from 'fs';
import { CosService } from '@/plugin/cos/cos.service';
import { getFileType } from '@/utils/common';
@Injectable()
export class UploadService {
  constructor(private readonly cosService: CosService) {}

  /**
   * @description: 上传image到cos服务
   * @param {*} uploadInfo
   * @return {*}
   */
  async uploadToCos(uploadInfo) {
    console.log('uploadInfo', uploadInfo);
    const { file, type = 'chat' } = uploadInfo;
    const fileType = await getFileType(file);
    const key = fileType + '/' + Date.now() + '-' + file.originalname;
    await this.cosService.uploadCosFile({
      bucketName: type,
      fileName: key,
      fileBuffer: file.buffer,
      fileSize: file.size,
      metaData: {
        'Content-Type': file.mimetype
      }
    });
    // TODO 改为配置
    return {
      fileUrl: `http://${process.env.MINIO_ENDPOINT}:9000/${type}/` + key,
      fileName: key,
      fileType: fileType
    };
  }

  /**
   * @description: 上传image
   * @param {*} uploadInfo
   * @return {*}
   */
  async create(uploadInfo) {
    console.log('uploadInfo', uploadInfo);
    return '';
  }

  /**
   *  合并分片上传的文件
   */
  async merge(params) {
    try {
      const chunkDir = join(__dirname, '../../../uploads/tempFile/' + params.fileMd5);
      const chunks = await readdir(chunkDir);
      const newchunks = chunks.sort((a, b) => a - b);
      newchunks.map((chunkPath) => {
        const filePath = `${chunkDir}/${chunkPath}`;
        if (!fs.existsSync(join(__dirname, '../../../uploads/file'))) {
          fs.mkdirSync(join(__dirname, '../../../uploads/file'));
        }
        fs.appendFileSync(join(__dirname, '../../../uploads/file/' + params.fileName), fs.readFileSync(filePath));
      });
      removeSync(chunkDir);
      return `http://localhost:9092/file/${params.fileName}`;
    } catch (error) {
      console.log('err', error);
    }
  }

  async findOne(id: number) {}

  update(id: number, updateUploadDto) {
    return `This action updates a #${id} upload`;
  }
}
