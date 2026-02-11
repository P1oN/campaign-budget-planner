export type ChannelKey = 'video' | 'display' | 'social';
export type StrategyKey = 'balanced' | 'max_reach' | 'max_engagement' | 'custom';

export type ChannelShareMix = Record<ChannelKey, number>;
export type ChannelCpmMap = Record<ChannelKey, number>;
export type CpmOverrides = Partial<ChannelCpmMap>;

export interface BudgetPlanRequest {
  totalBudget: number;
  durationDays: number;
  strategy: StrategyKey;
  customMix?: ChannelShareMix;
  cpmOverrides?: CpmOverrides;
}

export interface ChannelAllocation {
  channelKey: ChannelKey;
  share: number;
  budget: number;
  cpm: number;
  impressions: number;
}

export interface BudgetPlanResponse {
  strategy: StrategyKey;
  strategyLabel?: string;
  totalBudget: number;
  durationDays: number;
  allocations: ChannelAllocation[];
  totals: {
    impressionsTotal: number;
  };
  warnings: string[];
}

export interface CustomStrategy {
  name: string;
  mix: ChannelShareMix;
}

export interface StrategyCompareRequest {
  totalBudget: number;
  durationDays: number;
  cpmOverrides?: CpmOverrides;
  customStrategies?: CustomStrategy[];
}

export interface ConfigResponse {
  channels: ChannelKey[];
  defaultCpms: ChannelCpmMap;
  strategyPresets: Record<Exclude<StrategyKey, 'custom'>, ChannelShareMix>;
}
