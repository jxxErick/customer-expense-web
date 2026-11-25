import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ActivityPanelComponent } from './panels/activity-panel.component';
import { BalancePanelComponent } from './panels/balance-panel.component';
import { ExpensePanelComponent } from './panels/expense-panel.component';
import { MemberPanelComponent } from './panels/member-panel.component';
import { ReportPanelComponent } from './panels/report-panel.component';
import { Group } from './group.models';
import { GroupService } from './group.service';

type Tab = 'expenses' | 'balances' | 'members' | 'activity' | 'report';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [
    RouterLink,
    ExpensePanelComponent,
    BalancePanelComponent,
    MemberPanelComponent,
    ActivityPanelComponent,
    ReportPanelComponent,
  ],
  template: `
    <div class="page-head">
      <h1>{{ group()?.name ?? 'Grupo' }} @if (group(); as g) { <span class="pill">{{ g.currency }}</span> }</h1>
      <a class="button ghost" routerLink="/groups">Voltar</a>
    </div>

    <nav class="tabs">
      @for (item of tabs; track item.id) {
        <button type="button" [class.active]="tab() === item.id" (click)="tab.set(item.id)">{{ item.label }}</button>
      }
    </nav>

    @if (group(); as g) {
      @switch (tab()) {
        @case ('expenses') { <app-expense-panel [group]="g" /> }
        @case ('balances') { <app-balance-panel [group]="g" /> }
        @case ('members') { <app-member-panel [group]="g" (changed)="reload()" /> }
        @case ('activity') { <app-activity-panel [group]="g" /> }
        @case ('report') { <app-report-panel [group]="g" /> }
      }
    }
  `,
})
export class GroupDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly service = inject(GroupService);

  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'expenses', label: 'Despesas' },
    { id: 'balances', label: 'Saldos e acertos' },
    { id: 'members', label: 'Membros' },
    { id: 'activity', label: 'Atividade' },
    { id: 'report', label: 'Relatório' },
  ];
  protected readonly tab = signal<Tab>('expenses');
  protected readonly group = signal<Group | null>(null);

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.service.get(Number(this.id())).subscribe((group) => this.group.set(group));
  }
}
