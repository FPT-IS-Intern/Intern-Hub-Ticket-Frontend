import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'create-ticket',
    pathMatch: 'full',
  },

  {
    path: 'create-ticket',
    loadComponent: () =>
      import('./features/create-ticket/create-ticket.page').then((m) => m.CreateTicketPage),
  },
  {
    path: 'request-ticket-management',
    loadComponent: () =>
      import('./features/ticket-management/request-ticket-management/request-ticket-management').then(
        (m) => m.RequestTicketManagementPage
      ),
  },
  {
    path: 'detail-ticket-management',
    loadComponent: () =>
      import('./features/ticket-management/detail-ticket-management/detail-ticket-management').then(
        (m) => m.DetailTicketManagementPage
      ),
  },

  
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/forbidden/forbidden.page').then((m) => m.ForbiddenPage),
  },

  {
    path: '**',
    redirectTo: 'create-ticket',
  },
];