import { ChannelAllocation } from '../domain/channel.types';
import { StrategyKey } from '../domain/strategy.types';

export interface PlanTotals {
  impressionsTotal: number;
}

export interface PlanResponse {
  strategy: StrategyKey;
  strategyLabel?: string;
  allocations: ChannelAllocation[];
  totals: PlanTotals;
  warnings: string[];
}
