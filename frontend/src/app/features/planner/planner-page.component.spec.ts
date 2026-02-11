import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CampaignPlannerApi } from '../../core/api/campaign-planner.api';
import { BudgetPlanResponse, ConfigResponse } from '../../core/models/domain.models';
import { PlannerPageComponent } from './planner-page.component';

describe('PlannerPageComponent', () => {
  let mockApi: jasmine.SpyObj<CampaignPlannerApi>;

  const configResponse: ConfigResponse = {
    channels: ['video', 'display', 'social'],
    defaultCpms: { video: 12, display: 6, social: 4 },
    strategyPresets: {
      balanced: { video: 0.3, display: 0.3, social: 0.4 },
      max_reach: { video: 0.2, display: 0.4, social: 0.4 },
      max_engagement: { video: 0.5, display: 0.2, social: 0.3 },
    },
  };

  const planResponse: BudgetPlanResponse = {
    strategy: 'balanced',
    totalBudget: 10000,
    allocations: [
      { channelKey: 'video', share: 0.3, budget: 3000, cpm: 12, impressions: 250000 },
      { channelKey: 'display', share: 0.3, budget: 3000, cpm: 6, impressions: 500000 },
      { channelKey: 'social', share: 0.4, budget: 4000, cpm: 4, impressions: 1000000 },
    ],
    totals: { impressionsTotal: 1750000 },
    warnings: [],
  };

  beforeEach(async () => {
    mockApi = jasmine.createSpyObj('CampaignPlannerApi', ['getConfig', 'createPlan']);
    mockApi.getConfig.and.returnValue(of(configResponse));
    mockApi.createPlan.and.returnValue(of(planResponse));

    await TestBed.configureTestingModule({
      imports: [PlannerPageComponent],
      providers: [{ provide: CampaignPlannerApi, useValue: mockApi }],
    }).compileComponents();
  });

  it('renders plan results after submit', () => {
    const fixture = TestBed.createComponent(PlannerPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.submit();
    fixture.detectChanges();

    expect(mockApi.createPlan).toHaveBeenCalledWith({
      totalBudget: 10000,
      durationDays: 30,
      strategy: 'balanced',
    });
    expect(component.plan).toEqual(planResponse);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Results');
    expect(text).toContain('Video');
  });
});
