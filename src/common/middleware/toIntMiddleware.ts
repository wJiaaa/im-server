/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class toIntMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // const pageNum = parseInt(req.query.pageNum, 10);
    // const pageSize = parseInt(req.query.pageSize, 10);
    // if (!isNaN(pageNum)) {
    //   req.query.pageNum = pageNum;
    // }
    // if (!isNaN(pageSize)) {
    //   req.query.pageSize = pageSize;
    // }

    next();
  }
}
