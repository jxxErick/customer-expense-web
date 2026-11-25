import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home.component').then((m) => m.HomeComponent) },
  {
    path: 'customers',
    loadComponent: () => import('./customers/customer-list.component').then((m) => m.CustomerListComponent),
    title: 'Clientes',
  },
  {
    path: 'customers/new',
    loadComponent: () => import('./customers/customer-form.component').then((m) => m.CustomerFormComponent),
    title: 'Novo cliente',
  },
  {
    path: 'customers/duplicates',
    loadComponent: () =>
      import('./customers/customer-duplicates.component').then((m) => m.CustomerDuplicatesComponent),
    title: 'Duplicados',
  },
  {
    path: 'customers/:id',
    loadComponent: () => import('./customers/customer-detail.component').then((m) => m.CustomerDetailComponent),
    title: 'Cliente',
  },
  {
    path: 'groups',
    loadComponent: () => import('./groups/group-list.component').then((m) => m.GroupListComponent),
    title: 'Grupos',
  },
  {
    path: 'groups/:id',
    loadComponent: () => import('./groups/group-detail.component').then((m) => m.GroupDetailComponent),
    title: 'Grupo',
  },
  { path: '**', redirectTo: '' },
];
