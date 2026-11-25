import { Component, inject, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { ToastService } from '../../core/toast.service';
import { Group, Member } from '../group.models';
import { GroupService } from '../group.service';

@Component({
  selector: 'app-member-panel',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="grid two">
      <section class="card">
        <h3>Membros</h3>
        @for (member of group().members; track member.id) {
          <div class="transfer">
            <span [class.muted]="!member.active">
              {{ member.name }}
              @if (!member.active) { <span class="pill">saiu</span> }
            </span>
            @if (member.active) {
              <button type="button" class="ghost" (click)="leave(member)">Sair do grupo</button>
            } @else {
              <button type="button" class="ghost" (click)="add(member.name)">Voltar</button>
            }
          </div>
        }
        <p class="muted small">
          Só sai quem está com saldo zerado e fora de despesas recorrentes; as despesas antigas continuam com o nome.
        </p>
      </section>

      <form class="card form" (ngSubmit)="add(name.value)">
        <h3>Adicionar membro</h3>
        <label>Nome <input [formControl]="name" /></label>
        <button type="submit" [disabled]="name.invalid">Adicionar</button>
      </form>
    </div>
  `,
})
export class MemberPanelComponent {
  readonly group = input.required<Group>();
  readonly changed = output<void>();

  private readonly service = inject(GroupService);
  private readonly toasts = inject(ToastService);

  protected readonly name = new FormControl('', { nonNullable: true, validators: Validators.required });

  protected add(name: string): void {
    this.service.addMember(this.group().id, name).subscribe((member) => {
      this.toasts.success(`${member.name} está no grupo`);
      this.name.reset();
      this.changed.emit();
    });
  }

  protected leave(member: Member): void {
    this.service.leave(this.group().id, member.id).subscribe(() => {
      this.toasts.success(`${member.name} saiu do grupo`);
      this.changed.emit();
    });
  }
}
