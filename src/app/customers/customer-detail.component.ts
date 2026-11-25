import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ToastService } from '../core/toast.service';
import { CHANGE_LABELS, CustomerChange, VersionedCustomer } from './customer.models';
import { CustomerService } from './customer.service';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    <div class="page-head">
      <h1>{{ current()?.customer?.name ?? 'Cliente' }}</h1>
      <div class="actions">
        <a class="button ghost" routerLink="/customers">Voltar</a>
        @if (current()) {
          <button type="button" class="danger" (click)="remove()">Excluir</button>
        }
      </div>
    </div>

    @if (current(); as data) {
      <div class="grid two">
        <section class="card">
          <h3>Dados</h3>
          <dl>
            <dt>E-mail</dt><dd>{{ data.customer.email }}</dd>
            <dt>CPF</dt><dd>{{ data.customer.cpf ?? '—' }}</dd>
            <dt>Endereço</dt>
            <dd>
              {{ data.customer.address.street }}, {{ data.customer.address.number }}
              @if (data.customer.address.complement) { - {{ data.customer.address.complement }} }
              <br />{{ data.customer.address.neighborhood }}, {{ data.customer.address.city }}/{{ data.customer.address.state }}
              · {{ data.customer.address.zipCode }}
            </dd>
            <dt>Cadastro</dt><dd>{{ data.customer.createdAt | date: 'short' }}</dd>
            <dt>Versão (ETag)</dt><dd class="muted">{{ data.etag }}</dd>
          </dl>
        </section>

        <section class="card">
          <h3>Editar</h3>
          <form class="form inline" [formGroup]="nameForm" (ngSubmit)="rename()">
            <label>Nome <input formControlName="name" /></label>
            <button type="submit" [disabled]="nameForm.invalid">Renomear</button>
          </form>
          <form class="form" [formGroup]="addressForm" (ngSubmit)="move()">
            <div class="row">
              <label>CEP <input formControlName="zipCode" /></label>
              <label>Número <input formControlName="number" /></label>
              <label>Complemento <input formControlName="complement" /></label>
            </div>
            <button type="submit" [disabled]="addressForm.invalid">Trocar endereço</button>
          </form>
          <p class="muted small">
            As alterações mandam a versão no If-Match: se outra pessoa editou antes, a API devolve 412 e a tela recarrega.
          </p>
        </section>
      </div>
    }

    <section class="card">
      <h3>Histórico</h3>
      <ol class="timeline">
        @for (change of history(); track $index) {
          <li>
            <strong>{{ labels[change.type] }}</strong>
            <span class="muted">{{ change.occurredAt | date: 'short' }}</span>
            @for (field of change.changes; track field.field) {
              <div class="small">
                <code>{{ field.field }}</code>:
                @if (field.from) { <s>{{ field.from }}</s> → }
                {{ field.to }}
              </div>
            }
          </li>
        } @empty {
          <li class="muted">Sem alterações registradas.</li>
        }
      </ol>
    </section>
  `,
})
export class CustomerDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly service = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly labels = CHANGE_LABELS;
  protected readonly current = signal<VersionedCustomer | null>(null);
  protected readonly history = signal<CustomerChange[]>([]);
  protected readonly nameForm = this.fb.group({ name: ['', Validators.required] });
  protected readonly addressForm = this.fb.group({
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
    number: ['', Validators.required],
    complement: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  protected rename(): void {
    this.service
      .rename(this.id(), this.nameForm.getRawValue().name, this.current()?.etag ?? null)
      .subscribe({ next: (data) => this.updated(data, 'Nome alterado'), error: (e) => this.reloadOnConflict(e) });
  }

  protected move(): void {
    const value = this.addressForm.getRawValue();
    this.service
      .changeAddress(this.id(), { ...value, complement: value.complement || null }, this.current()?.etag ?? null)
      .subscribe({ next: (data) => this.updated(data, 'Endereço alterado'), error: (e) => this.reloadOnConflict(e) });
  }

  protected remove(): void {
    if (!confirm('Excluir este cliente? O histórico continua disponível.')) {
      return;
    }
    this.service.delete(this.id()).subscribe(() => {
      this.toasts.success('Cliente excluído');
      this.router.navigate(['/customers']);
    });
  }

  private load(): void {
    this.service.get(this.id()).subscribe((data) => this.fill(data));
    this.service.history(this.id()).subscribe((page) => this.history.set(page.items));
  }

  private updated(data: VersionedCustomer, message: string): void {
    this.toasts.success(message);
    this.fill(data);
    this.service.history(this.id()).subscribe((page) => this.history.set(page.items));
  }

  private fill(data: VersionedCustomer): void {
    this.current.set(data);
    const address = data.customer.address;
    this.nameForm.setValue({ name: data.customer.name });
    this.addressForm.setValue({ zipCode: address.zipCode, number: address.number, complement: address.complement ?? '' });
  }

  private reloadOnConflict(error: HttpErrorResponse): void {
    if (error.status === 412) {
      this.load();
    }
  }
}
