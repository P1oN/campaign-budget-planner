export type ChannelKey = 'video' | 'display' | 'social';
export type StrategyKey = 'balanced' | 'max_reach' | 'max_engagement' | 'custom';

export type Mix = Record<ChannelKey, number>;
export type CpmOverrides = Partial<Record<ChannelKey, number>>;

export interface BudgetPlanRequest {
  totalBudget: number;
  durationDays: number;
  strategy: StrategyKey;
  customMix?: Mix;
  cpmOverrides?: CpmOverrides;
}

export interface ChannelAllocation {
  channel: ChannelKey;
  share: number;
  budget: number;
  cpm: number;
  impressions: number;
}

export interface BudgetPlanResponse {
  strategy: StrategyKey;
  allocations: ChannelAllocation[];
  totalImpressions: number;
  warnings: string[];
}

export interface StrategyCompareRequest {
  totalBudget: number;
  durationDays: number;
  cpmOverrides?: CpmOverrides;
}

export interface StrategyCompareItem {
  strategy: Exclude<StrategyKey, 'custom'>;
  mix: Mix;
  totalImpressions: number;
}

export interface StrategyCompareResponse {
  results: StrategyCompareItem[];
}

export interface ConfigResponse {
  defaultCpm: Mix;
  strategies: Record<Exclude<StrategyKey, 'custom'>, Mix>;
}
