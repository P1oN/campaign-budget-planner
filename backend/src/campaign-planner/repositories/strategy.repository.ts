import { Injectable } from '@nestjs/common';
import { STRATEGY_PRESETS } from '../domain/strategies.config';
import { ChannelShareMap } from '../domain/channel.types';
import { StrategyKey } from '../domain/strategy.types';

@Injectable()
export class StrategyRepository {
  getPreset(strategy: Exclude<StrategyKey, 'custom'>): ChannelShareMap {
    return { ...STRATEGY_PRESETS[strategy] };
  }

  getAllPresets(): Record<Exclude<StrategyKey, 'custom'>, ChannelShareMap> {
    return {
      balanced: this.getPreset('balanced'),
      max_reach: this.getPreset('max_reach'),
      max_engagement: this.getPreset('max_engagement')
    };
  }
}
