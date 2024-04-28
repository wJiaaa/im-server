/*
 * @Description: log4js日志
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 * @LastEditTime: 2024-04-23 10:18:30
 */
import * as Log4js from 'log4js';
import * as Util from 'util';
import *as dayjs from 'dayjs'; // 处理时间的工具
import *as Chalk from 'chalk';
import log4jsConfig from './log4jsConfig';
import { Injectable, Logger } from '@nestjs/common';
// 定义日志级别
export enum LoggerLevel {
  ALL = 'ALL',
  MARK = 'MARK',
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
  OFF = 'OFF',
}

// 添加用户自定义的格式化布局函数。 可参考: https://log4js-node.github.io/log4js-node/layouts.html
Log4js.addLayout('ticket', (logConfig: any) => {
  return (logEvent: Log4js.LoggingEvent): string => {
    // 日志组装
    const messageList: string[] = [];
    logEvent.data.forEach((value: any) => {
      if (typeof value !== 'string') {
        value = Util.inspect(value, false, 3, true);
      }
      messageList.push(value);
    });

    // 日志组成部分
    const messageOutput: string = messageList.join(' ');
    const typeOutput = `[${logConfig.type}] ${logEvent.pid.toString()}  - `;
    const dateOutput = `${dayjs(logEvent.startTime).format(
      'YYYY-MM-DD HH:mm:ss',
    )}`;
    let levelOutput = `[${logEvent.level}] ${messageOutput}`;
    // 根据日志级别，用不同颜色区分
    switch (logEvent.level.toString()) {
      case LoggerLevel.DEBUG:
        levelOutput = Chalk.green(levelOutput);
        break;
      case LoggerLevel.INFO:
        levelOutput = Chalk.cyan(levelOutput);
        break;
      case LoggerLevel.WARN:
        levelOutput = Chalk.yellow(levelOutput);
        break;
      case LoggerLevel.ERROR:
        levelOutput = Chalk.red(levelOutput);
        break;
      case LoggerLevel.FATAL:
        levelOutput = Chalk.hex('#DD4C35')(levelOutput);
        break;
      default:
        levelOutput = Chalk.grey(levelOutput);
        break;
    }
    return `${Chalk.yellow(typeOutput)}${dateOutput}   ${levelOutput} `;
  };
});

// 注入配置
Log4js.configure(log4jsConfig);

// 定义log类方法
@Injectable()
export class LoggerService {
  private readonly logger: Log4js.Logger;
  constructor() {
    this.logger = Log4js.getLogger('default');
  }

  onModuleInit() {
    Logger.log('日志服务加载完成', 'LoggerService');
  }

  public trace(args) {
    this.logger.trace(args);
  }

  public debug(args) {
    this.logger.debug(args);
  }
  public log(args) {
    this.logger.info(args);
  }

  public info(args) {
    this.logger.info(args);
  }

  public warn(args) {
    this.logger.warn(args);
  }

  public warning(args) {
    this.logger.warn(args);
  }

  public error(args) {
    this.logger.error(args);
  }

  public fatal(args) {
    this.logger.fatal(args);
  }

  public access(args) {
    const loggerCustom = Log4js.getLogger('http');
    loggerCustom.info(args);
  }
}
