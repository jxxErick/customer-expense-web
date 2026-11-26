import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { SILENT_ERRORS } from '../core/problem.interceptor';
import { environment } from '../../environments/environment';
import {
  ActivityFeed,
  Balance,
  CreateExpense,
  Expense,
  Group,
  Member,
  ReceiptPreview,
  ReceiptSplit,
  Settlement,
  SpendingReport,
  Transfer,
} from './group.models';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.expenseApiUrl}/groups`;

  list(): Observable<Group[]> {
    return this.http.get<Group[]>(this.url);
  }

  get(id: number): Observable<Group> {
    return this.http.get<Group>(`${this.url}/${id}`);
  }

  create(name: string, members: string[], currency: string): Observable<Group> {
    return this.http.post<Group>(this.url, { name, members, currency });
  }

  addMember(groupId: number, name: string): Observable<Member> {
    return this.http.post<Member>(`${this.url}/${groupId}/members`, { name });
  }

  leave(groupId: number, memberId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${groupId}/members/${memberId}`);
  }

  expenses(groupId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.url}/${groupId}/expenses`);
  }

  addExpense(groupId: number, request: CreateExpense): Observable<Expense> {
    return this.http.post<Expense>(`${this.url}/${groupId}/expenses`, request);
  }

  /** Errors stay on the screen instead of a toast: the preview runs while the user types. */
  previewReceipt(groupId: number, request: ReceiptSplit): Observable<ReceiptPreview> {
    return this.http.post<ReceiptPreview>(`${this.url}/${groupId}/expenses/receipt/preview`, request, {
      context: new HttpContext().set(SILENT_ERRORS, true),
    });
  }

  addReceipt(groupId: number, request: ReceiptSplit): Observable<Expense> {
    return this.http.post<Expense>(`${this.url}/${groupId}/expenses/receipt`, request);
  }

  deleteExpense(groupId: number, expenseId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${groupId}/expenses/${expenseId}`);
  }

  balances(groupId: number): Observable<Balance[]> {
    return this.http.get<Balance[]>(`${this.url}/${groupId}/balances`);
  }

  debts(groupId: number): Observable<Transfer[]> {
    return this.http.get<Transfer[]>(`${this.url}/${groupId}/debts`);
  }

  settlements(groupId: number): Observable<Settlement[]> {
    return this.http.get<Settlement[]>(`${this.url}/${groupId}/settlements`);
  }

  settle(groupId: number, transfer: Transfer): Observable<Settlement> {
    return this.http.post<Settlement>(`${this.url}/${groupId}/settlements`, {
      fromMemberId: transfer.from.id,
      toMemberId: transfer.to.id,
      amount: transfer.amount,
    });
  }

  settleUp(groupId: number): Observable<Settlement[]> {
    return this.http.post<Settlement[]>(`${this.url}/${groupId}/settlements/settle-up`, null);
  }

  activity(groupId: number, before?: number | null): Observable<ActivityFeed> {
    let params = new HttpParams().set('limit', 15);
    if (before) {
      params = params.set('before', before);
    }
    return this.http.get<ActivityFeed>(`${this.url}/${groupId}/activity`, { params });
  }

  spending(groupId: number): Observable<SpendingReport> {
    return this.http.get<SpendingReport>(`${this.url}/${groupId}/reports/spending`);
  }
}
