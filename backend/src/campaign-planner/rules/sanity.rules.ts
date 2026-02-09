import { ChannelShareMap } from '../domain/channel.types';
import { StrategyKey } from '../domain/strategy.types';

export function getSanityWarnings(strategy: StrategyKey, shares: ChannelShareMap): string[] {
  const warnings: string[] = [];
  if (strategy === 'max_reach' && shares.video > 0.35) {
    warnings.push('Max reach strategy should keep video share at or below 0.35 to prioritize reach.');
  }
  if (strategy === 'max_engagement' && shares.video < 0.35) {
    warnings.push('Max engagement strategy should keep video share at or above 0.35 to sustain engagement.');
  }
  return warnings;
}
