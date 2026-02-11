import { ChannelCpmMap, ChannelKey, ChannelShareMap } from '../domain/channel.types';
import { StrategyKey } from '../domain/strategy.types';

export interface ConfigResponse {
  channels: ChannelKey[];
  defaultCpms: ChannelCpmMap;
  strategyPresets: Record<Exclude<StrategyKey, 'custom'>, ChannelShareMap>;
}
