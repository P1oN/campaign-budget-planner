import { ChannelShareMap } from './channel.types';
import { StrategyKey } from './strategy.types';

export const STRATEGY_PRESETS: Record<Exclude<StrategyKey, 'custom'>, ChannelShareMap> = {
  balanced: { video: 0.3, display: 0.3, social: 0.4 },
  max_reach: { video: 0.15, display: 0.35, social: 0.5 },
  max_engagement: { video: 0.55, display: 0.25, social: 0.2 }
};
