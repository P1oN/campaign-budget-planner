import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { CampaignPlannerApi } from '../../core/api/campaign-planner.api';
import {
  CpmOverrides,
  StrategyCompareItem,
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

  loading = false;
  errorMessage = '';
  results: StrategyCompareItem[] = [];

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

    this.loading = true;
    this.api.compare(request).subscribe({
      next: (response) => {
        this.results = response.results ?? [];
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
    return Math.max(...this.results.map((item) => item.totalImpressions ?? 0));
  }

  barWidth(value: number): string {
    const max = this.maxImpressions();
    if (!max) {
      return '0%';
    }
    return `${Math.round((value / max) * 100)}%`;
  }

  mixSummary(item: StrategyCompareItem): string {
    const v = Math.round((item.mix?.video ?? 0) * 100);
    const d = Math.round((item.mix?.display ?? 0) * 100);
    const s = Math.round((item.mix?.social ?? 0) * 100);
    return `V:${v}% D:${d}% S:${s}%`;
  }
}
