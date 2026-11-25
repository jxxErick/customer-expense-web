import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { ToastService } from '../../core/toast.service';
import { CATEGORY_LABELS, Expense, ExpenseCategory, Group, SPLIT_LABELS, SplitType } from '../group.models';
import { GroupService } from '../group.service';

@Component({
  selector: 'app-expense-panel',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="layout-side">
      <section class="card">
        <h3>Despesas</h3>
        @for (expense of expenses(); track expense.id) {
          <div class="expense">
            <div>
              <strong>{{ expense.description }}</strong>
              <span class="pill">{{ categoryLabels[expense.category] }}</span>
              <div class="small muted">
                {{ expense.payer.name }} pagou · {{ expense.spentAt | date: 'dd/MM/yyyy' }} · {{ splitLabels[expense.splitType] }}
                @if (expense.foreign; as f) { · {{ f.amount | currency: f.currency }} a {{ f.exchangeRate }} }
              </div>
              <div class="small">
                @for (share of expense.shares; track share.memberId) {
                  <span class="share">{{ share.memberName }} {{ share.amount | currency: group().currency }}</span>
                }
              </div>
            </div>
            <div class="expense-side">
              <strong>{{ expense.amount | currency: group().currency }}</strong>
              <button type="button" class="link danger-text" (click)="remove(expense)">excluir</button>
            </div>
          </div>
        } @empty {
          <p class="empty">Nenhuma despesa ainda.</p>
        }
      </section>

      <form class="card form" [formGroup]="form" (ngSubmit)="submit()">
        <h3>Nova despesa</h3>
        <label>Descrição <input formControlName="description" /></label>
        <div class="row">
          <label>Valor <input formControlName="amount" type="number" step="0.01" min="0.01" /></label>
          <label>Data <input formControlName="spentAt" type="date" /></label>
        </div>
        <div class="row">
          <label>Quem pagou
            <select formControlName="payerId">
              @for (member of activeMembers(); track member.id) { <option [ngValue]="member.id">{{ member.name }}</option> }
            </select>
          </label>
          <label>Categoria
            <select formControlName="category">
              @for (category of categories; track category) { <option [ngValue]="category">{{ categoryLabels[category] }}</option> }
            </select>
          </label>
        </div>
        <label>Divisão
          <select formControlName="splitType">
            @for (type of splitTypes; track type) { <option [ngValue]="type">{{ splitLabels[type] }}</option> }
          </select>
        </label>

        <fieldset>
          <legend>Quem participa</legend>
          @for (member of activeMembers(); track member.id; let i = $index) {
            <div class="participant">
              <label class="check"><input type="checkbox" [formControl]="included.at(i)" /> {{ member.name }}</label>
              @if (form.controls.splitType.value !== 'EQUAL') {
                <input type="number" step="0.01" [formControl]="values.at(i)" [placeholder]="valueHint()" />
              }
            </div>
          }
        </fieldset>
        <button type="submit" [disabled]="form.invalid">Adicionar</button>
      </form>
    </div>
  `,
})
export class ExpensePanelComponent implements OnInit {
  readonly group = input.required<Group>();

  private readonly service = inject(GroupService);
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly splitLabels = SPLIT_LABELS;
  protected readonly categories = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];
  protected readonly splitTypes = Object.keys(SPLIT_LABELS) as SplitType[];
  protected readonly expenses = signal<Expense[]>([]);
  protected readonly activeMembers = computed(() => this.group().members.filter((member) => member.active));

  protected readonly included = new FormArray<FormControl<boolean>>([]);
  protected readonly values = new FormArray<FormControl<number | null>>([]);
  protected readonly form = this.fb.group({
    description: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    // local date, not UTC: late in the evening UTC is already tomorrow
    spentAt: [new Date().toLocaleDateString('sv-SE')],
    payerId: [0, Validators.required],
    category: ['OTHER' as ExpenseCategory],
    splitType: ['EQUAL' as SplitType],
  });

  ngOnInit(): void {
    this.resetParticipants();
    this.load();
  }

  protected valueHint(): string {
    return { EXACT: 'valor', PERCENTAGE: '%', SHARES: 'cotas', EQUAL: '' }[this.form.controls.splitType.value];
  }

  protected submit(): void {
    const value = this.form.getRawValue();
    const shares = this.activeMembers()
      .map((member, i) => ({ memberId: member.id, value: this.values.at(i).value, included: this.included.at(i).value }))
      .filter((share) => share.included)
      .map(({ memberId, value: shareValue }) => ({
        memberId,
        value: value.splitType === 'EQUAL' ? null : shareValue,
      }));
    this.service
      .addExpense(this.group().id, {
        description: value.description,
        amount: value.amount ?? 0,
        payerId: value.payerId,
        splitType: value.splitType,
        category: value.category,
        spentAt: value.spentAt || null,
        shares,
      })
      .subscribe(() => {
        this.toasts.success('Despesa adicionada');
        this.form.patchValue({ description: '', amount: null });
        this.load();
      });
  }

  protected remove(expense: Expense): void {
    if (!confirm(`Excluir "${expense.description}"?`)) {
      return;
    }
    this.service.deleteExpense(this.group().id, expense.id).subscribe(() => {
      this.toasts.success('Despesa excluída');
      this.load();
    });
  }

  private load(): void {
    this.service.expenses(this.group().id).subscribe((expenses) => this.expenses.set(expenses));
  }

  private resetParticipants(): void {
    const members = this.activeMembers();
    members.forEach(() => {
      this.included.push(new FormControl(true, { nonNullable: true }));
      this.values.push(new FormControl<number | null>(null));
    });
    this.form.patchValue({ payerId: members[0]?.id ?? 0 });
  }
}
