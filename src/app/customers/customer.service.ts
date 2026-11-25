import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  ChangeAddress,
  CreateCustomer,
  Customer,
  CustomerChange,
  CustomerStats,
  DuplicateCandidate,
  Page,
  VersionedCustomer,
} from './customer.models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.customerApiUrl}/customers`;

  list(name: string, page: number, size = 10): Observable<Page<Customer>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (name.trim()) {
      params = params.set('name', name.trim());
    }
    return this.http.get<Page<Customer>>(this.url, { params });
  }

  get(id: string): Observable<VersionedCustomer> {
    return this.http.get<Customer>(`${this.url}/${id}`, { observe: 'response' }).pipe(map(versioned));
  }

  /** A fresh Idempotency-Key per form submission makes double clicks harmless. */
  create(request: CreateCustomer, idempotencyKey: string): Observable<Customer> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<Customer>(this.url, request, { headers });
  }

  rename(id: string, name: string, etag: string | null): Observable<VersionedCustomer> {
    return this.http
      .patch<Customer>(`${this.url}/${id}/name`, { name }, { headers: ifMatch(etag), observe: 'response' })
      .pipe(map(versioned));
  }

  changeAddress(id: string, request: ChangeAddress, etag: string | null): Observable<VersionedCustomer> {
    return this.http
      .put<Customer>(`${this.url}/${id}/address`, request, { headers: ifMatch(etag), observe: 'response' })
      .pipe(map(versioned));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  history(id: string, page = 0, size = 20): Observable<Page<CustomerChange>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<CustomerChange>>(`${this.url}/${id}/history`, { params });
  }

  stats(): Observable<CustomerStats> {
    return this.http.get<CustomerStats>(`${this.url}/stats`);
  }

  duplicates(minScore: number): Observable<DuplicateCandidate[]> {
    return this.http.get<DuplicateCandidate[]>(`${this.url}/duplicates`, { params: { minScore } });
  }

  /** Keeps {@code targetId} and removes {@code duplicateId}. */
  merge(targetId: string, duplicateId: string): Observable<Customer> {
    return this.http.post<Customer>(`${this.url}/${targetId}/merge`, { duplicateId });
  }

  exportUrl(name: string): string {
    return name.trim() ? `${this.url}/export?name=${encodeURIComponent(name.trim())}` : `${this.url}/export`;
  }
}

function versioned(response: HttpResponse<Customer>): VersionedCustomer {
  return { customer: response.body as Customer, etag: response.headers.get('ETag') };
}

function ifMatch(etag: string | null): HttpHeaders {
  return etag ? new HttpHeaders({ 'If-Match': etag }) : new HttpHeaders();
}
