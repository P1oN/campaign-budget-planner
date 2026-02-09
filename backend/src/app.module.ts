import { Module } from '@nestjs/common';
import { CampaignPlannerModule } from './campaign-planner/campaign-planner.module';

@Module({
  imports: [CampaignPlannerModule]
})
export class AppModule {}
