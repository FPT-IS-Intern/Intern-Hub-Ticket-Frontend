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
    path: 'manage-tickets',
    loadComponent: () =>
      import('./features/management/ticket-management/ticket-dashdoard/ticket-management.page').then(
        (m) => m.TicketManagementPage,
      ),
  },
  {
    path: 'manage-tickets/registration',
    loadComponent: () =>
      import('./features/management/ticket-management/registration-ticket/registrantion-ticket.page').then(
        (m) => m.RegistrationTicketPage,
      ),
  },
  {
    path: 'manage-tickets/registration/:id',
    loadComponent: () =>
      import('./features/management/ticket-management/detail-registration-ticket/detail-registration-ticket.page').then(
        (m) => m.DetailRegistrationTicketPage,
      ),
  },
  {
    path: 'manage-tickets/attendance',
    loadComponent: () =>
      import('./features/management/attendance-management/attendance-management.page').then(
        (m) => m.AttendancePage,
      ),
  },
  {
    path: 'request-ticket-management',
    loadComponent: () =>
      import('./features/ticket-management/request-ticket-management/request-ticket-management').then(
        (m) => m.RequestTicketManagementPage,
      ),
  },
  {
    path: 'detail-ticket-management',
    loadComponent: () =>
      import('./features/ticket-management/detail-ticket-management/detail-ticket-management').then(
        (m) => m.DetailTicketManagementPage,
      ),
  },

  {
    path: 'my-ticket',
    loadComponent: () =>
      import('./features/user-ticket/user-ticket.page').then((m) => m.UserTicketPage),
  },

  {
    path: 'forbidden',
    loadComponent: () => import('./features/forbidden/forbidden.page').then((m) => m.ForbiddenPage),
  },

  {
    path: '**',
    redirectTo: 'create-ticket',
  },
];
