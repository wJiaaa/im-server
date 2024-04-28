/*
 * @Description: 日志配置
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2023-11-21 15:11:20
 */
// 项目根目录新建config文件用于保存配置文件, 新建log4jsConfig.ts配置文件

import * as path from 'path';
const baseLogPath = path.resolve(__dirname, '../../logs');

const log4jsConfig = {
  appenders: {
    console: { type: 'console', layout: { type: 'ticket' } }, // 控制打印至控制台
    // 统计日志
    access: {
      type: 'dateFile', // 写入文件格式，并按照日期分类
      filename: `${baseLogPath}/access/access.log`, // 日志文件名，会命名为：access.2021-04-01.log
      alwaysIncludePattern: true, // 为true, 则每个文件都会按pattern命名，否则最新的文件不会按照pattern命名
      pattern: 'yyyy-MM-dd', // 日期格式
      // maxLogSize: 10485760,  // 日志大小
      daysToKeep: 7, // 文件保存日期7天
      numBackups: 3, //  配置日志文件最多存在个数
      compress: true, // 配置日志文件是否压缩
      category: 'http', // category 类型
      keepFileExt: true, // 是否保留文件后缀
      mode: 0o755,
      layout: {
        type: 'pattern',
        pattern: "'%m'",
      }, // 自定义的输出格式, 可参考 https://blog.csdn.net/hello_word2/article/details/79295344
    },
    // 一些app的 应用日志
    app: {
      type: 'dateFile',
      filename: `${baseLogPath}/app-out/app.log`,
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern: "'%m'",
      }, // 自定义的输出格式, 可参考 https://blog.csdn.net/hello_word2/article/details/79295344
      pattern: 'yyyy-MM-dd',
      daysToKeep: 7,
      numBackups: 3,
      keepFileExt: true,
      mode: 0o755,
    },
    // 异常日志
    errorFile: {
      type: 'dateFile',
      filename: `${baseLogPath}/error/error.log`,
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern: "'%m'",
      },
      pattern: 'yyyy-MM-dd',
      daysToKeep: 7,
      numBackups: 3,
      keepFileExt: true,
      mode: 0o755,
    },
    errors: {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: 'errorFile',
      mode: 0o755,
    },
  },

  categories: {
    default: {
      appenders: ['console', 'app', 'errors'],
      level: 'DEBUG',
    },
    mysql: { appenders: ['access', 'errors'], level: 'info' },
    http: { appenders: ['access'], level: 'DEBUG' },
  },
};

export default log4jsConfig;
