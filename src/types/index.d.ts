/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import * as express from 'express';
declare global {
  namespace Express {
    interface Request {
      user?: Record<string, any>;
    }
  }
}
// TODO
declare module 'sha1';
declare module 'request';
