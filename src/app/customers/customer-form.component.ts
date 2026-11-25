import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ToastService } from '../core/toast.service';
import { CustomerService } from './customer.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-head">
      <h1>Novo cliente</h1>
      <a class="button ghost" routerLink="/customers">Voltar</a>
    </div>

    <form class="card form" [formGroup]="form" (ngSubmit)="submit()">
      <label>Nome <input formControlName="name" maxlength="120" /></label>
      <label>E-mail <input formControlName="email" type="email" /></label>
      <label>CPF <small class="muted">(opcional)</small> <input formControlName="cpf" placeholder="529.982.247-25" /></label>
      <div class="row">
        <label>CEP <input formControlName="zipCode" placeholder="01001-000" /></label>
        <label>Número <input formControlName="number" /></label>
        <label>Complemento <input formControlName="complement" /></label>
      </div>
      <p class="muted">Rua, bairro, cidade e UF vêm do ViaCEP.</p>
      <button type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Salvando…' : 'Cadastrar' }}</button>
    </form>
  `,
})
export class CustomerFormComponent {
  private readonly service = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  /** Same key while the form is untouched, so a retry never creates two customers. */
  private idempotencyKey = crypto.randomUUID();

  protected readonly saving = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    cpf: [''],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
    number: ['', Validators.required],
    complement: [''],
  });

  constructor() {
    this.form.valueChanges.subscribe(() => (this.idempotencyKey = crypto.randomUUID()));
  }

  protected submit(): void {
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.service
      .create({ ...value, cpf: value.cpf || null, complement: value.complement || null }, this.idempotencyKey)
      .subscribe({
        next: (customer) => {
          this.toasts.success(`${customer.name} cadastrado`);
          this.router.navigate(['/customers', customer.id]);
        },
        error: () => this.saving.set(false),
      });
  }
}
