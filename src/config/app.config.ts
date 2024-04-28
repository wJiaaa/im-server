/*
 * @Description: 配置
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
export default {
  port: Number(process.env.PORT),
  redis: {
    port: +process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PWD
  },
  minio: {
    port: +process.env.MINIO_PORT,
    endPoint: process.env.MINIO_ENDPOINT,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
  },
  chatGpt: {
    key: process.env.CHAT_GPT_KEY
  },
  common: {
    prefix: process.env.PREFIX,
    apiKey: process.env.API_KEY
  }
};
