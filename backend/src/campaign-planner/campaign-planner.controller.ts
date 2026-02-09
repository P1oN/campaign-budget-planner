import { Body, Controller, Get, Post } from '@nestjs/common';
import { CampaignPlannerService } from './campaign-planner.service';
import { CompareRequestDto } from './dto/compare.request.dto';
import { PlanRequestDto } from './dto/plan.request.dto';
import { ConfigResponse } from './dto/config.response';
import { PlanResponse } from './dto/plan.response';

@Controller('api')
export class CampaignPlannerController {
  constructor(private readonly campaignPlannerService: CampaignPlannerService) {}

  @Get('config')
  getConfig(): ConfigResponse {
    return this.campaignPlannerService.getConfig();
  }

  @Post('plan')
  createPlan(@Body() dto: PlanRequestDto): PlanResponse {
    return this.campaignPlannerService.createPlan(dto);
  }

  @Post('compare')
  compare(@Body() dto: CompareRequestDto): PlanResponse[] {
    return this.campaignPlannerService.compare(dto);
  }
}
