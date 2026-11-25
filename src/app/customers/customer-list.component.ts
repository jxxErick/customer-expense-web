import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { Customer, CustomerStats, Page } from './customer.models';
import { CustomerService } from './customer.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  template: `
    <div class="page-head">
      <h1>Clientes</h1>
      <div class="actions">
        <a class="button ghost" [href]="exportUrl()" download>Exportar CSV</a>
        <a class="button ghost" routerLink="/customers/duplicates">Duplicados</a>
        <a class="button" routerLink="/customers/new">Novo cliente</a>
      </div>
    </div>

    <div class="layout-side">
      <section class="card">
        <input class="search" type="search" placeholder="Buscar por nome…" [formControl]="search" />

        @if (page(); as result) {
          @if (result.items.length === 0) {
            <p class="empty">Nenhum cliente encontrado.</p>
          } @else {
            <table>
              <thead>
                <tr><th>Nome</th><th>E-mail</th><th>Cidade</th><th>CPF</th></tr>
              </thead>
              <tbody>
                @for (customer of result.items; track customer.id) {
                  <tr>
                    <td><a [routerLink]="['/customers', customer.id]">{{ customer.name }}</a></td>
                    <td>{{ customer.email }}</td>
                    <td>{{ customer.address.city }}/{{ customer.address.state }}</td>
                    <td class="muted">{{ customer.cpf ?? '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
            <div class="pager">
              <button type="button" class="ghost" [disabled]="result.page === 0" (click)="go(result.page - 1)">‹</button>
              <span>Página {{ result.page + 1 }} de {{ result.totalPages }} · {{ result.totalItems }} clientes</span>
              <button type="button" class="ghost" [disabled]="result.page + 1 >= result.totalPages"
                      (click)="go(result.page + 1)">›</button>
            </div>
          }
        } @else {
          <p class="muted">Carregando…</p>
        }
      </section>

      <aside class="card">
        <h3>Por estado</h3>
        @if (stats(); as s) {
          @for (state of s.states; track state.state) {
            <div class="bar-row">
              <span>{{ state.state }}</span>
              <div class="bar"><div [style.width.%]="state.percentage"></div></div>
              <span class="muted">{{ state.customers }} · {{ state.percentage | number: '1.0-1' }}%</span>
            </div>
          } @empty {
            <p class="muted">Sem clientes ainda.</p>
          }
        }
      </aside>
    </div>
  `,
})
export class CustomerListComponent implements OnInit {
  private readonly service = inject(CustomerService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly page = signal<Page<Customer> | null>(null);
  protected readonly stats = signal<CustomerStats | null>(null);

  ngOnInit(): void {
    this.go(0);
    this.service.stats().subscribe((stats) => this.stats.set(stats));
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.go(0));
  }

  protected go(page: number): void {
    this.service.list(this.search.value, page).subscribe((result) => this.page.set(result));
  }

  protected exportUrl(): string {
    return this.service.exportUrl(this.search.value);
  }
}
