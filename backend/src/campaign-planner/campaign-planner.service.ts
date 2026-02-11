import { BadRequestException, Injectable } from '@nestjs/common';
import { PlanRequestDto } from './dto/plan.request.dto';
import { CompareRequestDto } from './dto/compare.request.dto';
import { ConfigResponse } from './dto/config.response';
import { PlanResponse } from './dto/plan.response';
import { CHANNEL_KEYS } from './domain/channels.config';
import { ChannelAllocation, ChannelCpmMap, ChannelShareMap } from './domain/channel.types';
import { StrategyKey } from './domain/strategy.types';
import { CpmRepository } from './repositories/cpm.repository';
import { StrategyRepository } from './repositories/strategy.repository';
import { getSanityWarnings } from './rules/sanity.rules';

@Injectable()
export class CampaignPlannerService {
  constructor(
    private readonly cpmRepository: CpmRepository,
    private readonly strategyRepository: StrategyRepository
  ) {}

  getConfig(): ConfigResponse {
    return {
      channels: [...CHANNEL_KEYS],
      defaultCpms: this.cpmRepository.getDefaults(),
      strategyPresets: this.strategyRepository.getAllPresets()
    };
  }

  createPlan(dto: PlanRequestDto): PlanResponse {
    const strategy = dto.strategy;
    const shares = this.resolveShares(strategy, dto.customMix);
    const cpms = this.resolveCpms(dto.cpmOverrides);
    return this.buildPlan(strategy, shares, cpms, dto.totalBudget);
  }

  compare(dto: CompareRequestDto): PlanResponse[] {
    const cpms = this.resolveCpms(dto.cpmOverrides);
    const presets: Exclude<StrategyKey, 'custom'>[] = [
      'balanced',
      'max_reach',
      'max_engagement'
    ];
    const presetResults = presets.map((strategy) => {
      const shares = this.strategyRepository.getPreset(strategy);
      return this.buildPlan(strategy, shares, cpms, dto.totalBudget);
    });

    const customResults = (dto.customStrategies ?? []).map((customStrategy) => {
      const shares = this.resolveShares('custom', customStrategy.mix);
      return this.buildPlan('custom', shares, cpms, dto.totalBudget, customStrategy.name);
    });

    return [...presetResults, ...customResults];
  }

  private resolveCpms(overrides?: Partial<ChannelCpmMap>): ChannelCpmMap {
    const defaults = this.cpmRepository.getDefaults();
    return {
      video: overrides?.video ?? defaults.video,
      display: overrides?.display ?? defaults.display,
      social: overrides?.social ?? defaults.social
    };
  }

  private resolveShares(
    strategy: StrategyKey,
    customMix?: Partial<ChannelShareMap>
  ): ChannelShareMap {
    if (strategy !== 'custom') {
      return this.strategyRepository.getPreset(strategy);
    }

    if (!customMix) {
      throw new BadRequestException('Custom mix is required when strategy is custom.');
    }

    const { video, display, social } = customMix;
    const hasAllChannels =
      typeof video === 'number' && typeof display === 'number' && typeof social === 'number';

    if (!hasAllChannels) {
      throw new BadRequestException('Custom mix must include video, display, and social shares.');
    }

    const total = video + display + social;
    const tolerance = 0.0001;
    if (Math.abs(total - 1) > tolerance) {
      throw new BadRequestException('Custom mix shares must sum to 1.0.');
    }

    return {
      video,
      display,
      social
    };
  }

  private buildPlan(
    strategy: StrategyKey,
    shares: ChannelShareMap,
    cpms: ChannelCpmMap,
    totalBudget: number,
    strategyLabel?: string
  ): PlanResponse {
    const allocations: ChannelAllocation[] = CHANNEL_KEYS.map((channelKey) => {
      const share = shares[channelKey];
      const budget = totalBudget * share;
      const cpm = cpms[channelKey];
      const impressions = Math.floor((budget / cpm) * 1000);
      return {
        channelKey,
        share,
        budget,
        cpm,
        impressions
      };
    });

    const impressionsTotal = allocations.reduce((sum, allocation) => sum + allocation.impressions, 0);

    return {
      strategy,
      strategyLabel,
      allocations,
      totals: { impressionsTotal },
      warnings: getSanityWarnings(strategy, shares)
    };
  }
}
