import { Routes } from '@angular/router';
import { PlannerPageComponent } from './features/planner/planner-page.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: PlannerPageComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
