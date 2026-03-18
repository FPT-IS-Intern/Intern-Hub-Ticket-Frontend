import { Routes } from '@angular/router';

export const routes: Routes = [
  // ==============================================
  // Public Route Pages
  // ==============================================
  // ==============================================
  // App Route Pages
  // ==============================================
  {
    path: 'create-ticket',
    loadComponent: () => import('./features/create-ticket/create-ticket.page').then((m) => m.CreateTicketPage),
  }, 

  // ==============================================
  // Default Route
  // ==============================================
  {
    path: '**',
    redirectTo: '',
  },
];
