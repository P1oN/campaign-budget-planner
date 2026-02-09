import { Module } from '@nestjs/common';
import { CampaignPlannerController } from './campaign-planner.controller';
import { CampaignPlannerService } from './campaign-planner.service';
import { CpmRepository } from './repositories/cpm.repository';
import { StrategyRepository } from './repositories/strategy.repository';

@Module({
  controllers: [CampaignPlannerController],
  providers: [CampaignPlannerService, CpmRepository, StrategyRepository]
})
export class CampaignPlannerModule {}
