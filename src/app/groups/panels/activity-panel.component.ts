import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { Activity, Group } from '../group.models';
import { GroupService } from '../group.service';

@Component({
  selector: 'app-activity-panel',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="card">
      <h3>Atividade</h3>
      <ol class="timeline">
        @for (item of items(); track item.id) {
          <li>
            {{ item.summary }}
            <span class="muted small">{{ item.occurredAt | date: 'short' }}</span>
          </li>
        } @empty {
          <li class="muted">Nada por aqui ainda.</li>
        }
      </ol>
      @if (cursor()) {
        <button type="button" class="ghost" (click)="more()">Carregar mais</button>
      }
    </section>
  `,
})
export class ActivityPanelComponent implements OnInit {
  readonly group = input.required<Group>();

  private readonly service = inject(GroupService);

  protected readonly items = signal<Activity[]>([]);
  protected readonly cursor = signal<number | null>(null);

  ngOnInit(): void {
    this.more();
  }

  /** Cursor pagination: each page starts right before the last id seen. */
  protected more(): void {
    this.service.activity(this.group().id, this.cursor()).subscribe((feed) => {
      this.items.update((items) => [...items, ...feed.items]);
      this.cursor.set(feed.nextCursor);
    });
  }
}
