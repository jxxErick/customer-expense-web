import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, debounceTime, map, of, switchMap, tap } from 'rxjs';

import { describe } from '../../core/problem.interceptor';
import { ToastService } from '../../core/toast.service';
import { CATEGORY_LABELS, ExpenseCategory, Group, ReceiptPreview, ReceiptSplit } from '../group.models';
import { GroupService } from '../group.service';

type ItemForm = FormGroup<{
  description: FormControl<string>;
  unitPrice: FormControl<number | null>;
  quantity: FormControl<number>;
  memberIds: FormControl<number[]>;
}>;

@Component({
  selector: 'app-receipt-panel',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  template: `
    <form class="layout-side" [formGroup]="form" (ngSubmit)="submit()">
      <section class="card form">
        <div class="section-head">
          <h3>Itens da comanda</h3>
          <button type="button" class="ghost" (click)="addItem()">+ item</button>
        </div>

        @for (item of items.controls; track item; let i = $index) {
          <div class="receipt-item" [formGroup]="item">
            <div class="receipt-line">
              <input formControlName="description" placeholder="Item (ex.: Pizza grande)" aria-label="Item" />
              <input formControlName="unitPrice" type="number" step="0.01" min="0.01" placeholder="Preço" aria-label="Preço" />
              <input formControlName="quantity" type="number" min="1" max="99" aria-label="Quantidade" title="Quantidade" />
              <button type="button" class="link danger-text" (click)="removeItem(i)" [disabled]="items.length === 1"
                      aria-label="Remover item">remover</button>
            </div>
            <div class="chips">
              @for (member of activeMembers(); track member.id) {
                <button type="button" class="chip" [class.on]="item.controls.memberIds.value.includes(member.id)"
                        (click)="toggle(item, member.id)">{{ member.name }}</button>
              }
              <button type="button" class="link" (click)="everyone(item)">todos</button>
            </div>
          </div>
        }
        <p class="muted small">Cada item é dividido igualmente entre quem está marcado nele.</p>
      </section>

      <div class="grid">
        <section class="card form">
          <h3>Conta</h3>
          <label>Descrição <input formControlName="description" placeholder="Ex.: Pizzaria sexta" /></label>
          <div class="row">
            <label>Quem pagou
              <select formControlName="payerId">
                @for (member of activeMembers(); track member.id) { <option [ngValue]="member.id">{{ member.name }}</option> }
              </select>
            </label>
            <label>Data <input formControlName="spentAt" type="date" /></label>
          </div>
          <div class="row">
            <label>Serviço (%) <input formControlName="serviceChargePercent" type="number" min="0" max="30" step="0.5" /></label>
            <label>Desconto <input formControlName="discount" type="number" min="0" step="0.01" placeholder="0,00" /></label>
          </div>
          <label>Categoria
            <select formControlName="category">
              @for (category of categories; track category) { <option [ngValue]="category">{{ categoryLabels[category] }}</option> }
            </select>
          </label>
        </section>

        <section class="card">
          <h3>Quanto cada um paga</h3>
          @if (previewError()) {
            <p class="negative small">{{ previewError() }}</p>
          } @else {
            @if (preview(); as bill) {
              @for (row of bill.members; track row.memberId) {
                <div class="bill-row">
                  <div>
                    <strong>{{ row.name }}</strong>
                    <div class="small muted">
                      {{ row.subtotal | currency: group().currency }}
                      @if (row.serviceCharge > 0) { + {{ row.serviceCharge | currency: group().currency }} serviço }
                      @if (row.discount > 0) { − {{ row.discount | currency: group().currency }} desc. }
                    </div>
                  </div>
                  <strong>{{ row.total | currency: group().currency }}</strong>
                </div>
              }
              <dl class="bill-summary">
                <dt>Consumo</dt><dd>{{ bill.subtotal | currency: group().currency }}</dd>
                <dt>Serviço</dt><dd>{{ bill.serviceCharge | currency: group().currency }}</dd>
                <dt>Desconto</dt><dd>− {{ bill.discount | currency: group().currency }}</dd>
                <dt><strong>Total</strong></dt><dd><strong>{{ bill.total | currency: group().currency }}</strong></dd>
              </dl>
            } @else {
              <p class="empty">Preencha os itens para ver a divisão.</p>
            }
          }
          <button type="submit" class="full" [disabled]="form.invalid || !preview() || !!previewError() || saving()">
            Lançar {{ preview() && !previewError() ? (preview()!.total | currency: group().currency) : '' }}
          </button>
        </section>
      </div>
    </form>
  `,
})
export class ReceiptPanelComponent implements OnInit {
  readonly group = input.required<Group>();
  /** Emitted after the receipt becomes an expense. */
  readonly saved = output<void>();

  private readonly service = inject(GroupService);
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly categories = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];
  protected readonly activeMembers = computed(() => this.group().members.filter((member) => member.active));
  protected readonly preview = signal<ReceiptPreview | null>(null);
  protected readonly previewError = signal<string | null>(null);
  protected readonly saving = signal(false);

  protected readonly items = new FormArray<ItemForm>([]);
  protected readonly form = this.fb.group({
    description: ['', Validators.required],
    payerId: [0, Validators.required],
    // local date, not UTC: late in the evening UTC is already tomorrow
    spentAt: [new Date().toLocaleDateString('sv-SE')],
    category: ['FOOD' as ExpenseCategory],
    serviceChargePercent: [10 as number | null, [Validators.min(0), Validators.max(30)]],
    discount: [null as number | null, Validators.min(0)],
    items: this.items,
  });

  constructor() {
    // live preview while the receipt is typed; switchMap drops answers that are already stale
    this.form.valueChanges
      .pipe(
        debounceTime(350),
        map(() => (this.itemsReady() ? this.request() : null)),
        tap((request) => {
          if (!request) {
            this.preview.set(null);
            this.previewError.set(null);
          }
        }),
        switchMap((request) =>
          request
            ? this.service.previewReceipt(this.group().id, request).pipe(
                catchError((error: HttpErrorResponse) => {
                  this.previewError.set(describe(error));
                  return of(null);
                }),
              )
            : of(null),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((bill) => {
        if (bill) {
          this.preview.set(bill);
          this.previewError.set(null);
        } else if (!this.previewError()) {
          this.preview.set(null);
        }
      });
  }

  ngOnInit(): void {
    this.form.patchValue({ payerId: this.activeMembers()[0]?.id ?? 0 });
    this.addItem();
  }

  protected addItem(): void {
    this.items.push(
      this.fb.group({
        description: ['', Validators.required],
        unitPrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
        quantity: [1, [Validators.required, Validators.min(1), Validators.max(99)]],
        memberIds: [this.activeMembers().map((member) => member.id), Validators.required],
      }),
    );
  }

  protected removeItem(index: number): void {
    this.items.removeAt(index);
  }

  protected toggle(item: ItemForm, memberId: number): void {
    const ids = item.controls.memberIds.value;
    item.controls.memberIds.setValue(ids.includes(memberId) ? ids.filter((id) => id !== memberId) : [...ids, memberId]);
  }

  protected everyone(item: ItemForm): void {
    item.controls.memberIds.setValue(this.activeMembers().map((member) => member.id));
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.service.addReceipt(this.group().id, this.request()).subscribe({
      next: (expense) => {
        this.saving.set(false);
        this.toasts.success(`Comanda "${expense.description}" lançada`);
        this.saved.emit();
      },
      error: () => this.saving.set(false),
    });
  }

  /** Items are what the preview depends on; the description can come later. */
  private itemsReady(): boolean {
    return this.items.valid && this.form.controls.serviceChargePercent.valid && this.form.controls.discount.valid;
  }

  private request(): ReceiptSplit {
    const value = this.form.getRawValue();
    return {
      description: value.description || 'Comanda',
      payerId: value.payerId,
      category: value.category,
      spentAt: value.spentAt || null,
      serviceChargePercent: value.serviceChargePercent,
      discount: value.discount,
      items: value.items.map((item) => ({
        description: item.description,
        unitPrice: item.unitPrice ?? 0,
        quantity: item.quantity,
        memberIds: item.memberIds,
      })),
    };
  }
}
