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
import { MIX_TOLERANCE, isValidCustomStrategy } from '../../core/models/custom-strategy.validation';
import {
  BudgetPlanRequest,
  BudgetPlanResponse,
  ChannelKey,
  ChannelShareMix,
  ChannelCpmMap,
  CustomStrategy,
  CpmOverrides,
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
  private static readonly CUSTOM_STRATEGY_HISTORY_KEY = 'campaignPlanner.customStrategyHistory';
  private static readonly MAX_CUSTOM_STRATEGY_HISTORY = 5;

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
  readonly strategyLabels: Record<StrategyKey, string> = {
    balanced: 'Balanced',
    max_reach: 'Max Reach',
    max_engagement: 'Max Engagement',
    custom: 'Custom',
  };

  form: FormGroup;
  plan: BudgetPlanResponse | null = null;
  loading = false;
  errorMessage = '';
  configError = '';
  defaultCpm: ChannelCpmMap | null = null;
  customStrategyHistory: CustomStrategy[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder, private readonly api: CampaignPlannerApi) {
    this.form = this.fb.group({
      totalBudget: [10000, [Validators.required, Validators.min(1)]],
      durationDays: [30, [Validators.required, Validators.min(1), PlannerPageComponent.integerValidator()]],
      strategy: ['balanced', Validators.required],
      overrideCpm: [false],
      cpm: this.fb.group({
        video: [null, [Validators.min(0.01)]],
        display: [null, [Validators.min(0.01)]],
        social: [null, [Validators.min(0.01)]],
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
    this.customStrategyHistory = this.loadCustomStrategyHistory();

    this.api.getConfig().subscribe({
      next: (config) => {
        this.defaultCpm = config.defaultCpms;
        this.seedCpmWithDefaults();
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
          this.seedCpmWithDefaults();
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
        if (strategy === 'custom' && request.customMix) {
          this.storeCustomStrategy(request.customMix);
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.formatApiError(err, 'Failed to generate plan.');
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

  get resultStrategyLabel(): string {
    if (!this.plan) {
      return this.strategyLabel;
    }
    return this.plan.strategyLabel ?? this.strategyLabels[this.plan.strategy] ?? this.plan.strategy;
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

  get resultDurationDays(): number {
    return this.plan?.durationDays ?? this.durationDays;
  }

  get resultBudget(): number {
    return this.plan?.totalBudget ?? this.totalBudget;
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
    if (!this.plan.totalBudget) {
      return 0;
    }
    return Math.round((allocationBudget / this.plan.totalBudget) * 100);
  }

  barWidth(value: number, max: number): string {
    if (!max) {
      return '0%';
    }
    return `${Math.round((value / max) * 100)}%`;
  }

  showPlanDetails(plan: BudgetPlanResponse): void {
    this.plan = plan;
  }

  private percentToMix(raw: { [key: string]: number }): ChannelShareMix {
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
        const isSameAsDefault =
          typeof this.defaultCpm?.[channel] === 'number' && numeric === this.defaultCpm[channel];
        if (!Number.isNaN(numeric) && numeric > 0 && !isSameAsDefault) {
          overrides[channel] = numeric;
        }
      }
    });
    return overrides;
  }

  private seedCpmWithDefaults(): void {
    if (!this.defaultCpm) {
      return;
    }
    const cpmGroup = this.form.get('cpm');
    if (!cpmGroup) {
      return;
    }
    (['video', 'display', 'social'] as ChannelKey[]).forEach((channel) => {
      const control = cpmGroup.get(channel);
      if (!control) {
        return;
      }
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        control.setValue(this.defaultCpm?.[channel], { emitEvent: false });
      }
    });
  }

  private storeCustomStrategy(mix: ChannelShareMix): void {
    const key = this.mixKey(mix);
    const deduped = this.customStrategyHistory.filter((strategy) => this.mixKey(strategy.mix) !== key);
    const strategy: CustomStrategy = {
      name: this.buildCustomStrategyName(mix),
      mix,
    };
    this.customStrategyHistory = [strategy, ...deduped].slice(0, PlannerPageComponent.MAX_CUSTOM_STRATEGY_HISTORY);
    this.persistCustomStrategyHistory();
  }

  private buildCustomStrategyName(mix: ChannelShareMix): string {
    const v = Math.round(mix.video * 100);
    const d = Math.round(mix.display * 100);
    const s = Math.round(mix.social * 100);
    return `Custom V${v}/D${d}/S${s}`;
  }

  private mixKey(mix: ChannelShareMix): string {
    return `${mix.video.toFixed(4)}|${mix.display.toFixed(4)}|${mix.social.toFixed(4)}`;
  }

  private loadCustomStrategyHistory(): CustomStrategy[] {
    try {
      const raw = localStorage.getItem(PlannerPageComponent.CUSTOM_STRATEGY_HISTORY_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((item): item is CustomStrategy => isValidCustomStrategy(item))
        .slice(0, PlannerPageComponent.MAX_CUSTOM_STRATEGY_HISTORY);
    } catch {
      return [];
    }
  }

  private persistCustomStrategyHistory(): void {
    try {
      localStorage.setItem(
        PlannerPageComponent.CUSTOM_STRATEGY_HISTORY_KEY,
        JSON.stringify(this.customStrategyHistory)
      );
    } catch {
      // Ignore storage failures (private mode/quota) and keep in-memory history.
    }
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
      return Math.abs(total - 100) <= MIX_TOLERANCE ? null : { mixSumInvalid: true };
    };
  }

  private static integerValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = Number(control.value);
      if (!Number.isFinite(value)) {
        return { integer: true };
      }
      return Number.isInteger(value) ? null : { integer: true };
    };
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

  removeCustomStrategy(strategy: CustomStrategy): void {
    const key = this.mixKey(strategy.mix);
    this.customStrategyHistory = this.customStrategyHistory.filter(
      (savedStrategy) => this.mixKey(savedStrategy.mix) !== key
    );
    this.persistCustomStrategyHistory();
  }
}
