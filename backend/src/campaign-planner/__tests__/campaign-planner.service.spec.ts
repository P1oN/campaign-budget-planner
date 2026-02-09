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

  it('produces warnings when sanity rules are violated', () => {
    const plan = (service as any).buildPlan(
      'max_reach',
      { video: 0.4, display: 0.3, social: 0.3 },
      { video: 12, display: 6, social: 4 },
      1000
    );

    expect(plan.warnings.length).toBeGreaterThan(0);
  });
});
