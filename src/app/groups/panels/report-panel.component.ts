import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

import { CATEGORY_LABELS, Group, SpendingReport } from '../group.models';
import { GroupService } from '../group.service';

@Component({
  selector: 'app-report-panel',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  template: `
    @if (report(); as r) {
      <div class="grid three">
        <div class="card stat"><span class="muted">Total</span><strong>{{ r.total | currency: group().currency }}</strong></div>
        <div class="card stat"><span class="muted">Despesas</span><strong>{{ r.expenseCount }}</strong></div>
        <div class="card stat"><span class="muted">Média</span><strong>{{ r.averageExpense | currency: group().currency }}</strong></div>
      </div>

      <div class="grid two">
        <section class="card">
          <h3>Por categoria</h3>
          @for (row of r.categories; track row.category) {
            <div class="bar-row">
              <span>{{ labels[row.category] }}</span>
              <div class="bar"><div [style.width.%]="row.percentage"></div></div>
              <span class="muted">{{ row.total | currency: group().currency }} · {{ row.percentage | number: '1.0-1' }}%</span>
            </div>
          } @empty {
            <p class="empty">Sem despesas.</p>
          }
        </section>

        <section class="card">
          <h3>Por membro</h3>
          <table>
            <thead><tr><th>Membro</th><th>Pagou</th><th>Consumiu</th><th>%</th></tr></thead>
            <tbody>
              @for (row of r.members; track row.memberId) {
                <tr>
                  <td>{{ row.memberName }}</td>
                  <td>{{ row.paid | currency: group().currency }}</td>
                  <td>{{ row.consumed | currency: group().currency }}</td>
                  <td>{{ row.percentage | number: '1.0-1' }}%</td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      </div>
    }
  `,
})
export class ReportPanelComponent implements OnInit {
  readonly group = input.required<Group>();

  private readonly service = inject(GroupService);

  protected readonly labels = CATEGORY_LABELS;
  protected readonly report = signal<SpendingReport | null>(null);

  ngOnInit(): void {
    this.service.spending(this.group().id).subscribe((report) => this.report.set(report));
  }
}
