import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { CampaignPlannerApi } from '../../core/api/campaign-planner.api';
import { isValidCustomStrategy } from '../../core/models/custom-strategy.validation';
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
  @Output() viewDetails = new EventEmitter<BudgetPlanResponse>();
  @Output() removeSavedStrategy = new EventEmitter<CustomStrategy>();

  loading = false;
  errorMessage = '';
  results: BudgetPlanResponse[] = [];
  selectedStrategyName = '';

  readonly strategyLabels: Record<string, string> = {
    balanced: 'Balanced',
    max_reach: 'Max Reach',
    max_engagement: 'Max Engagement',
  };

  constructor(private readonly api: CampaignPlannerApi) {}

  compare(): void {
    this.errorMessage = '';
    this.results = [];
    this.selectedStrategyName = '';

    if (!this.totalBudget || this.totalBudget <= 0) {
      this.errorMessage = 'Budget must be > 0.';
      return;
    }

    if (!this.durationDays || this.durationDays <= 0) {
      this.errorMessage = 'Duration must be > 0.';
      return;
    }
    if (!Number.isInteger(this.durationDays)) {
      this.errorMessage = 'Duration must be a whole number of days.';
      return;
    }

    const request: StrategyCompareRequest = {
      totalBudget: this.totalBudget,
      durationDays: this.durationDays,
    };

    if (this.cpmOverrides && Object.keys(this.cpmOverrides).length > 0) {
      request.cpmOverrides = this.cpmOverrides;
    }
    const validCustomStrategies = this.customStrategies.filter((strategy) => isValidCustomStrategy(strategy));
    if (validCustomStrategies.length > 0) {
      request.customStrategies = validCustomStrategies;
    }

    this.loading = true;
    this.api.compare(request).subscribe({
      next: (response) => {
        this.results = response ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.formatApiError(err, 'Failed to compare strategies.');
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

  openDetails(item: BudgetPlanResponse): void {
    this.selectedStrategyName = this.strategyName(item);
    this.viewDetails.emit(item);
  }

  removeStrategy(strategy: CustomStrategy): void {
    this.removeSavedStrategy.emit(strategy);
  }

  private formatApiError(err: unknown, fallback: string): string {
    const message = (err as { error?: { message?: unknown } })?.error?.message;
    if (Array.isArray(message)) {
      return message.join(' ');
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    return fallback;
  }

}
