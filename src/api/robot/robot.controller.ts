import { Controller } from '@nestjs/common';
import { RobotService } from './robot.service';

@Controller('robot')
export class RobotController {
  constructor(private readonly robotService: RobotService) { }

}
