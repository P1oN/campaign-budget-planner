import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CampaignPlannerApi } from '../../core/api/campaign-planner.api';
import { BudgetPlanResponse } from '../../core/models/domain.models';
import { ComparisonPanelComponent } from './comparison-panel.component';

describe('ComparisonPanelComponent', () => {
  let mockApi: jasmine.SpyObj<CampaignPlannerApi>;

  const comparisonResults: BudgetPlanResponse[] = [
    {
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
    },
    {
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
    },
    {
      strategy: 'max_engagement',
      totalBudget: 10000,
      durationDays: 30,
      allocations: [
        { channelKey: 'video', share: 0.5, budget: 5000, cpm: 12, impressions: 416666 },
        { channelKey: 'display', share: 0.2, budget: 2000, cpm: 6, impressions: 333333 },
        { channelKey: 'social', share: 0.3, budget: 3000, cpm: 4, impressions: 750000 },
      ],
      totals: { impressionsTotal: 1499999 },
      warnings: [],
    },
    {
      strategy: 'custom',
      strategyLabel: 'Custom V45/D35/S20',
      totalBudget: 10000,
      durationDays: 30,
      allocations: [
        { channelKey: 'video', share: 0.45, budget: 4500, cpm: 12, impressions: 375000 },
        { channelKey: 'display', share: 0.35, budget: 3500, cpm: 6, impressions: 583333 },
        { channelKey: 'social', share: 0.2, budget: 2000, cpm: 4, impressions: 500000 },
      ],
      totals: { impressionsTotal: 1458333 },
      warnings: [],
    },
  ];

  beforeEach(async () => {
    mockApi = jasmine.createSpyObj('CampaignPlannerApi', ['compare']);
    mockApi.compare.and.returnValue(of(comparisonResults));

    await TestBed.configureTestingModule({
      imports: [ComparisonPanelComponent],
      providers: [{ provide: CampaignPlannerApi, useValue: mockApi }],
    }).compileComponents();
  });

  it('loads comparison results when compare is triggered', () => {
    const fixture = TestBed.createComponent(ComparisonPanelComponent);
    const component = fixture.componentInstance;
    component.totalBudget = 10000;
    component.durationDays = 30;
    component.customStrategies = [
      {
        name: 'Custom V45/D35/S20',
        mix: { video: 0.45, display: 0.35, social: 0.2 },
      },
    ];

    fixture.detectChanges();
    component.compare();
    fixture.detectChanges();

    expect(mockApi.compare).toHaveBeenCalledWith({
      totalBudget: 10000,
      durationDays: 30,
      customStrategies: [
        {
          name: 'Custom V45/D35/S20',
          mix: { video: 0.45, display: 0.35, social: 0.2 },
        },
      ],
    });
    expect(component.results.length).toBe(4);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Balanced');
    expect(text).toContain('Max Reach');
    expect(text).toContain('Custom V45/D35/S20');
  });

  it('emits selected strategy for detailed view when strategy name is clicked', () => {
    const fixture = TestBed.createComponent(ComparisonPanelComponent);
    const component = fixture.componentInstance;
    component.results = comparisonResults;
    const emitSpy = spyOn(component.viewDetails, 'emit');

    fixture.detectChanges();
    const strategyRow = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    strategyRow.click();

    expect(emitSpy).toHaveBeenCalledWith(comparisonResults[0]);
    expect(component.selectedStrategyName).toBe('Balanced');
  });
});
