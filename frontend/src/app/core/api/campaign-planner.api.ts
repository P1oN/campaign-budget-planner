import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  BudgetPlanRequest,
  BudgetPlanResponse,
  ConfigResponse,
  StrategyCompareRequest,
  StrategyCompareResponse,
} from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class CampaignPlannerApi {
  constructor(private readonly http: HttpClient) {}

  getConfig(): Observable<ConfigResponse> {
    return this.http.get<ConfigResponse>('/api/config');
  }

  createPlan(request: BudgetPlanRequest): Observable<BudgetPlanResponse> {
    return this.http.post<BudgetPlanResponse>('/api/plan', request);
  }

  compare(request: StrategyCompareRequest): Observable<StrategyCompareResponse> {
    return this.http.post<StrategyCompareResponse>('/api/compare', request);
  }
}
