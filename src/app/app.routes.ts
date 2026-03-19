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
  {
    path: 'request-ticket-management',
    loadComponent: () =>
      import('./features/ticket-management/request-ticket-management/request-ticket-management').then(
        (m) => m.RequestTicketManagementPage
      ),
  },

  // ==============================================
  // Default Route
  // ==============================================
  {
    path: '**',
    redirectTo: '',
  },
];
