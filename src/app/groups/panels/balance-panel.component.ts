import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { ToastService } from '../../core/toast.service';
import { Balance, Group, Settlement, Transfer } from '../group.models';
import { GroupService } from '../group.service';

@Component({
  selector: 'app-balance-panel',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="grid two">
      <section class="card">
        <h3>Saldos</h3>
        <table>
          <thead><tr><th>Membro</th><th>Pagou</th><th>Consumiu</th><th>Saldo</th></tr></thead>
          <tbody>
            @for (row of balances(); track row.memberId) {
              <tr>
                <td>{{ row.memberName }}</td>
                <td>{{ row.paid | currency: group().currency }}</td>
                <td>{{ row.owed | currency: group().currency }}</td>
                <td [class.positive]="row.balance > 0" [class.negative]="row.balance < 0">
                  {{ row.balance | currency: group().currency }}
                </td>
              </tr>
            }
          </tbody>
        </table>
        <p class="muted small">Positivo: tem a receber. Negativo: deve ao grupo.</p>
      </section>

      <section class="card">
        <div class="section-head">
          <h3>Quem paga quem</h3>
          @if (debts().length > 0) {
            <button type="button" (click)="settleUp()">Quitar tudo</button>
          }
        </div>
        @for (debt of debts(); track debt.from.id + '-' + debt.to.id) {
          <div class="transfer">
            <span><strong>{{ debt.from.name }}</strong> → <strong>{{ debt.to.name }}</strong></span>
            <span>{{ debt.amount | currency: group().currency }}</span>
            <button type="button" class="ghost" (click)="settle(debt)">Registrar</button>
          </div>
        } @empty {
          <p class="empty">Tudo acertado. 🎉</p>
        }
        <p class="muted small">Plano com o menor número de transferências (no máximo n − 1).</p>
      </section>
    </div>

    <section class="card">
      <h3>Acertos registrados</h3>
      @for (item of settlements(); track item.id) {
        <div class="transfer">
          <span>{{ item.from.name }} pagou {{ item.to.name }}</span>
          <span>{{ item.amount | currency: group().currency }}</span>
          <span class="muted">{{ item.paidAt | date: 'dd/MM/yyyy' }}</span>
        </div>
      } @empty {
        <p class="empty">Nenhum acerto ainda.</p>
      }
    </section>
  `,
})
export class BalancePanelComponent implements OnInit {
  readonly group = input.required<Group>();

  private readonly service = inject(GroupService);
  private readonly toasts = inject(ToastService);

  protected readonly balances = signal<Balance[]>([]);
  protected readonly debts = signal<Transfer[]>([]);
  protected readonly settlements = signal<Settlement[]>([]);

  ngOnInit(): void {
    this.load();
  }

  protected settle(debt: Transfer): void {
    this.service.settle(this.group().id, debt).subscribe(() => {
      this.toasts.success(`${debt.from.name} pagou ${debt.to.name}`);
      this.load();
    });
  }

  protected settleUp(): void {
    if (!confirm('Registrar todos os pagamentos do plano de uma vez?')) {
      return;
    }
    this.service.settleUp(this.group().id).subscribe((recorded) => {
      this.toasts.success(`${recorded.length} acerto(s) registrados; saldos zerados`);
      this.load();
    });
  }

  private load(): void {
    const id = this.group().id;
    this.service.balances(id).subscribe((balances) => this.balances.set(balances));
    this.service.debts(id).subscribe((debts) => this.debts.set(debts));
    this.service.settlements(id).subscribe((settlements) => this.settlements.set(settlements));
  }
}
