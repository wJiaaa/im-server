/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-22 15:56:08
 */

import { fromBuffer } from 'file-type';
import { IMAGE_TYPE, VIDEO_TYPE, TXT_TYPE } from '@/utils/constants';
/**
 * @Description 获取上传的文件类型
 * @params file
 */
export const getFileType = async (file) => {
  if (file?.mimetype.startsWith('image/')) return IMAGE_TYPE;
  if (file?.mimetype.startsWith('video/')) return VIDEO_TYPE;
  if (file?.mimetype.startsWith('text/')) return TXT_TYPE;
  const fileType = await fromBuffer(file.buffer);
  console.log('fileType', fileType);
  return fileType?.ext;
};
/**
 * @description 休眠
 * @param ms 休眠时间
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}