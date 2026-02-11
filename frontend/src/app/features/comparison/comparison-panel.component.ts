import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { CampaignPlannerApi } from '../../core/api/campaign-planner.api';
import {
  BudgetPlanResponse,
  CustomStrategy,
  CpmOverrides,
  StrategyCompareRequest,
} from '../../core/models/domain.models';

@Component({
  selector: 'app-comparison-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comparison-panel.component.html',
})
export class ComparisonPanelComponent {
  @Input() totalBudget = 0;
  @Input() durationDays = 0;
  @Input() cpmOverrides?: CpmOverrides;
  @Input() customStrategies: CustomStrategy[] = [];

  loading = false;
  errorMessage = '';
  results: BudgetPlanResponse[] = [];

  readonly strategyLabels: Record<string, string> = {
    balanced: 'Balanced',
    max_reach: 'Max Reach',
    max_engagement: 'Max Engagement',
  };

  constructor(private readonly api: CampaignPlannerApi) {}

  compare(): void {
    this.errorMessage = '';
    this.results = [];

    if (!this.totalBudget || this.totalBudget <= 0) {
      this.errorMessage = 'Budget must be > 0.';
      return;
    }

    if (!this.durationDays || this.durationDays <= 0) {
      this.errorMessage = 'Duration must be > 0.';
      return;
    }

    const request: StrategyCompareRequest = {
      totalBudget: this.totalBudget,
      durationDays: this.durationDays,
    };

    if (this.cpmOverrides && Object.keys(this.cpmOverrides).length > 0) {
      request.cpmOverrides = this.cpmOverrides;
    }
    if (this.customStrategies.length > 0) {
      request.customStrategies = this.customStrategies;
    }

    this.loading = true;
    this.api.compare(request).subscribe({
      next: (response) => {
        this.results = response ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'Failed to compare strategies.';
      },
    });
  }

  maxImpressions(): number {
    if (!this.results.length) {
      return 0;
    }
    return Math.max(...this.results.map((item) => item.totals?.impressionsTotal ?? 0));
  }

  barWidth(value: number): string {
    const max = this.maxImpressions();
    if (!max) {
      return '0%';
    }
    return `${Math.round((value / max) * 100)}%`;
  }

  mixSummary(item: BudgetPlanResponse): string {
    const shares = item.allocations.reduce<Record<string, number>>((acc, allocation) => {
      acc[allocation.channelKey] = allocation.share;
      return acc;
    }, {});
    const v = Math.round((shares['video'] ?? 0) * 100);
    const d = Math.round((shares['display'] ?? 0) * 100);
    const s = Math.round((shares['social'] ?? 0) * 100);
    return `V:${v}% D:${d}% S:${s}%`;
  }

  strategyName(item: BudgetPlanResponse): string {
    return item.strategyLabel ?? this.strategyLabels[item.strategy] ?? item.strategy;
  }
}
