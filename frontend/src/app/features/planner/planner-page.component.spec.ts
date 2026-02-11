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
    durationDays: 30,
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

    expect(mockApi.createPlan).toHaveBeenCalledWith({
      totalBudget: 10000,
      durationDays: 30,
      strategy: 'balanced',
    });
    expect(component.plan).toEqual(planResponse);
  });

  it('validates custom mix using floating-point tolerance', () => {
    const fixture = TestBed.createComponent(PlannerPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.form.get('strategy')?.setValue('custom');
    component.form.get('customMix.video')?.setValue(33.33);
    component.form.get('customMix.display')?.setValue(33.33);
    component.form.get('customMix.social')?.setValue(33.34);

    component.submit();

    expect(component.errorMessage).toBe('');
    expect(mockApi.createPlan).toHaveBeenCalled();
  });

  it('sends CPM overrides only when user provides changed CPM values', () => {
    const fixture = TestBed.createComponent(PlannerPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.form.get('overrideCpm')?.setValue(true);
    component.form.get('cpm.video')?.setValue(12);
    component.form.get('cpm.display')?.setValue(8);
    component.form.get('cpm.social')?.setValue('');

    component.submit();

    expect(mockApi.createPlan).toHaveBeenCalledWith({
      totalBudget: 10000,
      durationDays: 30,
      strategy: 'balanced',
      cpmOverrides: { display: 8 },
    });
  });

  it('blocks submit when CPM overrides contain invalid values', () => {
    const fixture = TestBed.createComponent(PlannerPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.form.get('overrideCpm')?.setValue(true);
    component.form.get('cpm.video')?.setValue(0);

    component.submit();

    expect(component.errorMessage).toBe('Please correct the highlighted fields.');
    expect(mockApi.createPlan).toHaveBeenCalledTimes(0);
  });

  it('opens detailed results from a selected comparison strategy', () => {
    const fixture = TestBed.createComponent(PlannerPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const selectedPlan: BudgetPlanResponse = {
      strategy: 'max_reach',
      totalBudget: 10000,
      durationDays: 30,
      allocations: [
        { channelKey: 'video', share: 0.15, budget: 1500, cpm: 12, impressions: 125000 },
        { channelKey: 'display', share: 0.35, budget: 3500, cpm: 6, impressions: 583333 },
        { channelKey: 'social', share: 0.5, budget: 5000, cpm: 4, impressions: 1250000 },
      ],
      totals: { impressionsTotal: 1958333 },
      warnings: [],
    };

    component.showPlanDetails(selectedPlan);

    expect(component.plan).toEqual(selectedPlan);
    expect(component.resultStrategyLabel).toBe('Max Reach');
  });

  it('removes a saved custom strategy from history', () => {
    const fixture = TestBed.createComponent(PlannerPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.customStrategyHistory = [
      { name: 'Custom A', mix: { video: 0.4, display: 0.3, social: 0.3 } },
      { name: 'Custom B', mix: { video: 0.5, display: 0.2, social: 0.3 } }
    ];

    component.removeCustomStrategy({ name: 'Custom A', mix: { video: 0.4, display: 0.3, social: 0.3 } });

    expect(component.customStrategyHistory).toEqual([
      { name: 'Custom B', mix: { video: 0.5, display: 0.2, social: 0.3 } }
    ]);
  });
});
