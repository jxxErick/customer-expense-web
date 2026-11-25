import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ToastService } from './core/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <a routerLink="/" class="brand">Clientes <span>&amp;</span> Despesas</a>
      <nav>
        <a routerLink="/customers" routerLinkActive="active">Clientes</a>
        <a routerLink="/groups" routerLinkActive="active">Grupos</a>
      </nav>
    </header>

    <main class="container">
      <router-outlet />
    </main>

    <div class="toasts" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <button type="button" class="toast" [class]="toast.kind" (click)="toasts.dismiss(toast.id)">
          {{ toast.message }}
        </button>
      }
    </div>
  `,
})
export class AppComponent {
  protected readonly toasts = inject(ToastService);
}
