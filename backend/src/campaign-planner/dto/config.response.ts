import { ChannelCpmMap, ChannelShareMap } from '../domain/channel.types';

export interface ConfigResponse {
  channels: string[];
  defaultCpms: ChannelCpmMap;
  strategyPresets: Record<string, ChannelShareMap>;
}
