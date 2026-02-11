import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CampaignPlannerService } from '../campaign-planner.service';
import { CpmRepository } from '../repositories/cpm.repository';
import { StrategyRepository } from '../repositories/strategy.repository';

describe('CampaignPlannerService', () => {
  let service: CampaignPlannerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CampaignPlannerService, CpmRepository, StrategyRepository]
    }).compile();

    service = moduleRef.get(CampaignPlannerService);
  });

  it('plans balanced strategy with default CPMs', () => {
    const result = service.createPlan({
      totalBudget: 1000,
      durationDays: 30,
      strategy: 'balanced'
    });

    const video = result.allocations.find((alloc) => alloc.channelKey === 'video');
    const display = result.allocations.find((alloc) => alloc.channelKey === 'display');
    const social = result.allocations.find((alloc) => alloc.channelKey === 'social');

    expect(video?.impressions).toBe(25000);
    expect(display?.impressions).toBe(50000);
    expect(social?.impressions).toBe(100000);
    expect(result.totals.impressionsTotal).toBe(175000);
  });

  it('throws when custom mix sum is invalid', () => {
    expect(() =>
      service.createPlan({
        totalBudget: 1000,
        durationDays: 30,
        strategy: 'custom',
        customMix: { video: 0.5, display: 0.3, social: 0.3 }
      })
    ).toThrow(BadRequestException);
  });

  it('compare returns three preset results', () => {
    const results = service.compare({
      totalBudget: 2000,
      durationDays: 14
    });

    expect(results).toHaveLength(3);
    expect(results.map((result) => result.strategy)).toEqual([
      'balanced',
      'max_reach',
      'max_engagement'
    ]);
  });

  it('compare appends saved custom strategies', () => {
    const results = service.compare({
      totalBudget: 2000,
      durationDays: 14,
      customStrategies: [
        {
          name: 'Custom V45/D35/S20',
          mix: { video: 0.45, display: 0.35, social: 0.2 }
        }
      ]
    });

    expect(results).toHaveLength(4);
    expect(results[3].strategy).toBe('custom');
    expect(results[3].strategyLabel).toBe('Custom V45/D35/S20');
  });

  it('compare results include totals and channelKey allocations', () => {
    const results = service.compare({
      totalBudget: 2000,
      durationDays: 14
    });

    results.forEach((plan) => {
      expect(plan.totals.impressionsTotal).toBeGreaterThan(0);
      expect(plan.allocations).toHaveLength(3);
      plan.allocations.forEach((allocation) => {
        expect(allocation.channelKey).toBeDefined();
        expect(typeof allocation.channelKey).toBe('string');
      });
    });
  });

  it('applies CPM overrides to impressions', () => {
    const result = service.createPlan({
      totalBudget: 1000,
      durationDays: 30,
      strategy: 'balanced',
      cpmOverrides: { video: 24 }
    });

    const video = result.allocations.find((alloc) => alloc.channelKey === 'video');
    expect(video?.impressions).toBe(12500);
  });

  it('getConfig includes channels, defaultCpms, and strategyPresets', () => {
    const config = service.getConfig();

    expect(config.channels).toEqual(['video', 'display', 'social']);
    expect(config.defaultCpms.video).toBeGreaterThan(0);
    expect(config.strategyPresets.balanced).toBeDefined();
    expect(config.strategyPresets.max_reach).toBeDefined();
    expect(config.strategyPresets.max_engagement).toBeDefined();
  });

  it('returns warnings array in plan responses', () => {
    const plan = service.createPlan({
      totalBudget: 1000,
      durationDays: 30,
      strategy: 'max_reach'
    });

    expect(Array.isArray(plan.warnings)).toBe(true);
  });
});
