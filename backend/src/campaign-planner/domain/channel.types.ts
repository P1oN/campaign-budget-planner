export type ChannelKey = 'video' | 'display' | 'social';

export type ChannelCpmMap = Record<ChannelKey, number>;

export type ChannelShareMap = Record<ChannelKey, number>;

export interface ChannelAllocation {
  channelKey: ChannelKey;
  share: number;
  budget: number;
  cpm: number;
  impressions: number;
}
