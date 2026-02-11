import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { CampaignPlannerApi } from '../../core/api/campaign-planner.api';
import {
  BudgetPlanRequest,
  BudgetPlanResponse,
  ChannelKey,
  CpmOverrides,
  Mix,
  StrategyKey,
} from '../../core/models/domain.models';
import { ComparisonPanelComponent } from '../comparison/comparison-panel.component';

@Component({
  selector: 'app-planner-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ComparisonPanelComponent],
  templateUrl: './planner-page.component.html',
})
export class PlannerPageComponent implements OnInit, OnDestroy {
  readonly strategyOptions: { key: StrategyKey; label: string; description: string }[] = [
    { key: 'balanced', label: 'Balanced', description: 'Even split for steady reach.' },
    { key: 'max_reach', label: 'Max Reach', description: 'Favor channels with lower CPM.' },
    { key: 'max_engagement', label: 'Max Engagement', description: 'Lean into high engagement.' },
    { key: 'custom', label: 'Custom', description: 'Define your own mix.' },
  ];

  readonly channelLabels: Record<ChannelKey, string> = {
    video: 'Video',
    display: 'Display',
    social: 'Social',
  };

  form: FormGroup;
  plan: BudgetPlanResponse | null = null;
  loading = false;
  errorMessage = '';
  configError = '';
  defaultCpm: Mix | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder, private readonly api: CampaignPlannerApi) {
    this.form = this.fb.group({
      totalBudget: [10000, [Validators.required, Validators.min(1)]],
      durationDays: [30, [Validators.required, Validators.min(1)]],
      strategy: ['balanced', Validators.required],
      overrideCpm: [false],
      cpm: this.fb.group({
        video: [null],
        display: [null],
        social: [null],
      }),
      customMix: this.fb.group(
        {
          video: [40, [Validators.min(0), Validators.max(100)]],
          display: [30, [Validators.min(0), Validators.max(100)]],
          social: [30, [Validators.min(0), Validators.max(100)]],
        },
        { validators: [PlannerPageComponent.mixSumValidator()] }
      ),
    });
  }

  ngOnInit(): void {
    this.api.getConfig().subscribe({
      next: (config) => {
        this.defaultCpm = config.defaultCpms;
      },
      error: () => {
        this.configError = 'Unable to load defaults. You can still run plans manually.';
      },
    });

    this.form
      .get('overrideCpm')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((enabled) => {
        const cpmGroup = this.form.get('cpm');
        if (!cpmGroup) {
          return;
        }
        if (enabled) {
          cpmGroup.enable({ emitEvent: false });
        } else {
          cpmGroup.disable({ emitEvent: false });
        }
      });

    this.form.get('cpm')?.disable({ emitEvent: false });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submit(): void {
    this.errorMessage = '';
    this.plan = null;

    if (this.form.invalid) {
      this.errorMessage = 'Please correct the highlighted fields.';
      this.form.markAllAsTouched();
      return;
    }

    const strategy = this.form.get('strategy')?.value as StrategyKey;

    if (strategy === 'custom' && this.form.get('customMix')?.invalid) {
      this.errorMessage = 'Shares must sum to 100%.';
      this.form.get('customMix')?.markAllAsTouched();
      return;
    }

    const request: BudgetPlanRequest = {
      totalBudget: Number(this.form.get('totalBudget')?.value),
      durationDays: Number(this.form.get('durationDays')?.value),
      strategy,
    };

    if (strategy === 'custom') {
      request.customMix = this.percentToMix(this.form.get('customMix')?.value);
    }

    const overrides = this.buildOverrides();
    if (overrides && Object.keys(overrides).length > 0) {
      request.cpmOverrides = overrides;
    }

    this.loading = true;
    this.api.createPlan(request).subscribe({
      next: (plan) => {
        this.plan = plan;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'Failed to generate plan.';
      },
    });
  }

  get showCustomMix(): boolean {
    return this.form.get('strategy')?.value === 'custom';
  }

  get strategyDescription(): string {
    const strategy = this.form.get('strategy')?.value as StrategyKey | undefined;
    const match = this.strategyOptions.find((option) => option.key === strategy);
    return match?.description ?? '';
  }

  get strategyLabel(): string {
    const strategy = this.form.get('strategy')?.value as StrategyKey | undefined;
    const match = this.strategyOptions.find((option) => option.key === strategy);
    return match?.label ?? '';
  }

  get showOverrides(): boolean {
    return Boolean(this.form.get('overrideCpm')?.value);
  }

  get customMixError(): string {
    if (!this.showCustomMix) {
      return '';
    }
    const mixGroup = this.form.get('customMix');
    if (mixGroup?.errors?.['mixSumInvalid']) {
      return 'Shares must sum to 100%.';
    }
    return '';
  }

  get totalBudget(): number {
    return Number(this.form.get('totalBudget')?.value ?? 0);
  }

  get durationDays(): number {
    return Number(this.form.get('durationDays')?.value ?? 0);
  }

  get cpmOverrides(): CpmOverrides | undefined {
    const overrides = this.buildOverrides();
    return overrides && Object.keys(overrides).length > 0 ? overrides : undefined;
  }

  totalImpressions(): number {
    if (!this.plan) {
      return 0;
    }
    if (typeof this.plan.totals?.impressionsTotal === 'number') {
      return this.plan.totals.impressionsTotal;
    }
    return this.plan.allocations.reduce((sum, item) => sum + (item.impressions ?? 0), 0);
  }

  maxImpressions(): number {
    if (!this.plan) {
      return 0;
    }
    return Math.max(...this.plan.allocations.map((item) => item.impressions ?? 0), 0);
  }

  channelSharePercent(share: number): number {
    return Math.round(share * 100);
  }

  budgetSharePercent(allocationBudget: number): number {
    if (!this.plan) {
      return 0;
    }
    const totalBudget = this.totalBudget || this.plan.allocations.reduce((sum, item) => sum + (item.budget ?? 0), 0);
    if (!totalBudget) {
      return 0;
    }
    return Math.round((allocationBudget / totalBudget) * 100);
  }

  barWidth(value: number, max: number): string {
    if (!max) {
      return '0%';
    }
    return `${Math.round((value / max) * 100)}%`;
  }

  private percentToMix(raw: { [key: string]: number }): Mix {
    return {
      video: (Number(raw?.['video']) || 0) / 100,
      display: (Number(raw?.['display']) || 0) / 100,
      social: (Number(raw?.['social']) || 0) / 100,
    };
  }

  private buildOverrides(): CpmOverrides {
    if (!this.showOverrides) {
      return {};
    }
    const raw = this.form.get('cpm')?.value ?? {};
    const overrides: CpmOverrides = {};
    (['video', 'display', 'social'] as ChannelKey[]).forEach((channel) => {
      const value = raw[channel];
      if (value !== null && value !== undefined && value !== '') {
        const numeric = Number(value);
        if (!Number.isNaN(numeric) && numeric > 0) {
          overrides[channel] = numeric;
        }
      }
    });
    return overrides;
  }

  static mixSumValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = control.value as Record<string, number>;
      if (!raw) {
        return null;
      }
      const total = ['video', 'display', 'social']
        .map((key) => Number(raw[key]) || 0)
        .reduce((sum, value) => sum + value, 0);
      return total === 100 ? null : { mixSumInvalid: true };
    };
  }
}
