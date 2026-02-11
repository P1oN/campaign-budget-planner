import { ChannelShareMix, CustomStrategy } from './domain.models';

export const MIX_TOLERANCE = 0.0001;
export const MAX_CUSTOM_STRATEGY_NAME_LENGTH = 60;

export function isValidShareMix(value: unknown): value is ChannelShareMix {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const mix = value as Partial<ChannelShareMix>;
  const entries = [mix.video, mix.display, mix.social];
  if (entries.some((entry) => typeof entry !== 'number' || !Number.isFinite(entry))) {
    return false;
  }

  const numbers = entries as number[];
  const inBounds = numbers.every((entry) => entry >= 0 && entry <= 1);
  if (!inBounds) {
    return false;
  }

  const total = numbers.reduce((sum, entry) => sum + entry, 0);
  return Math.abs(total - 1) <= MIX_TOLERANCE;
}

export function isValidCustomStrategy(value: unknown): value is CustomStrategy {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const strategy = value as Partial<CustomStrategy>;
  if (typeof strategy.name !== 'string') {
    return false;
  }

  const trimmedName = strategy.name.trim();
  if (!trimmedName || trimmedName.length > MAX_CUSTOM_STRATEGY_NAME_LENGTH) {
    return false;
  }

  return isValidShareMix(strategy.mix);
}
