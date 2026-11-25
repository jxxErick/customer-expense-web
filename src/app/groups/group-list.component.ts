import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ToastService } from '../core/toast.service';
import { Group } from './group.models';
import { GroupService } from './group.service';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-head"><h1>Grupos</h1></div>

    <div class="layout-side">
      <section>
        @for (group of groups(); track group.id) {
          <a class="card link-card row-card" [routerLink]="['/groups', group.id]">
            <div>
              <strong>{{ group.name }}</strong>
              <div class="small muted">{{ activeNames(group) }}</div>
            </div>
            <span class="pill">{{ group.currency }}</span>
          </a>
        } @empty {
          <p class="empty">Nenhum grupo ainda. Crie o primeiro ao lado.</p>
        }
      </section>

      <form class="card form" [formGroup]="form" (ngSubmit)="create()">
        <h3>Novo grupo</h3>
        <label>Nome <input formControlName="name" placeholder="Viagem para Lisboa" /></label>
        <label>Membros <small class="muted">(separados por vírgula)</small>
          <input formControlName="members" placeholder="Ana, Bruno, Carla" />
        </label>
        <label>Moeda <input formControlName="currency" maxlength="3" /></label>
        <button type="submit" [disabled]="form.invalid">Criar grupo</button>
      </form>
    </div>
  `,
})
export class GroupListComponent implements OnInit {
  private readonly service = inject(GroupService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly groups = signal<Group[]>([]);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    members: ['', Validators.required],
    currency: ['BRL', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]],
  });

  ngOnInit(): void {
    this.service.list().subscribe((groups) => this.groups.set(groups));
  }

  protected activeNames(group: Group): string {
    return group.members.filter((member) => member.active).map((member) => member.name).join(', ');
  }

  protected create(): void {
    const { name, members, currency } = this.form.getRawValue();
    const names = members.split(',').map((member) => member.trim()).filter(Boolean);
    this.service.create(name, names, currency).subscribe((group) => {
      this.toasts.success(`Grupo ${group.name} criado`);
      this.router.navigate(['/groups', group.id]);
    });
  }
}
