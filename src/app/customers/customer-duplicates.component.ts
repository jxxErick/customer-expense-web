import { Component, OnInit, inject, signal } from '@angular/core';
import { PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ToastService } from '../core/toast.service';
import { Customer, DuplicateCandidate, REASON_LABELS } from './customer.models';
import { CustomerService } from './customer.service';

@Component({
  selector: 'app-customer-duplicates',
  standalone: true,
  imports: [FormsModule, RouterLink, PercentPipe],
  template: `
    <div class="page-head">
      <h1>Prováveis duplicados</h1>
      <a class="button ghost" routerLink="/customers">Voltar</a>
    </div>

    <section class="card">
      <label class="slider">
        Semelhança mínima: <strong>{{ minScore | percent: '1.0-0' }}</strong>
        <input type="range" min="0.5" max="1" step="0.05" [(ngModel)]="minScore" (change)="load()" />
      </label>
      <p class="muted small">
        Nomes comparados com Jaro-Winkler (sem acento e em qualquer ordem); mesmo usuário de e-mail e mesmo CEP somam pontos.
      </p>
    </section>

    @for (pair of pairs(); track pair.first.id + pair.second.id) {
      <section class="card pair">
        <div class="pair-head">
          <span class="score">{{ pair.score | percent: '1.0-0' }}</span>
          @for (reason of pair.reasons; track reason) {
            <span class="pill">{{ reasonLabels[reason] }}</span>
          }
        </div>
        <div class="grid two">
          @for (customer of [pair.first, pair.second]; track customer.id; let i = $index) {
            <div class="candidate">
              <a [routerLink]="['/customers', customer.id]"><strong>{{ customer.name }}</strong></a>
              <div class="small">{{ customer.email }} · CPF {{ customer.cpf ?? '—' }}</div>
              <div class="small muted">{{ customer.address.city }}/{{ customer.address.state }} · {{ customer.address.zipCode }}</div>
              <button type="button" class="ghost" (click)="merge(customer, i === 0 ? pair.second : pair.first)">
                Manter este e mesclar o outro
              </button>
            </div>
          }
        </div>
      </section>
    } @empty {
      <p class="empty">{{ loading() ? 'Procurando…' : 'Nenhum duplicado com essa semelhança.' }}</p>
    }
  `,
})
export class CustomerDuplicatesComponent implements OnInit {
  private readonly service = inject(CustomerService);
  private readonly toasts = inject(ToastService);

  protected readonly reasonLabels = REASON_LABELS;
  protected readonly pairs = signal<DuplicateCandidate[]>([]);
  protected readonly loading = signal(true);
  protected minScore = 0.85;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.service.duplicates(this.minScore).subscribe({
      next: (pairs) => {
        this.pairs.set(pairs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected merge(keep: Customer, remove: Customer): void {
    if (!confirm(`Manter "${keep.name}" e excluir "${remove.name}"? O CPF passa para o mantido se ele não tiver.`)) {
      return;
    }
    this.service.merge(keep.id, remove.id).subscribe(() => {
      this.toasts.success(`${remove.name} mesclado em ${keep.name}`);
      this.load();
    });
  }
}
