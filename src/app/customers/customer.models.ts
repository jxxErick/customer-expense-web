export interface Address {
  zipCode: string;
  street: string | null;
  number: string;
  complement: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  /** Masked by the API: ***.982.247-** */
  cpf: string | null;
  address: Address;
  createdAt: string;
}

/** Customer plus the version from the ETag, sent back as If-Match. */
export interface VersionedCustomer {
  customer: Customer;
  etag: string | null;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface CreateCustomer {
  name: string;
  email: string;
  zipCode: string;
  number: string;
  complement?: string | null;
  cpf?: string | null;
}

export interface ChangeAddress {
  zipCode: string;
  number: string;
  complement?: string | null;
}

export type ChangeType = 'CREATED' | 'RENAMED' | 'ADDRESS_CHANGED' | 'DELETED' | 'MERGED' | 'MERGED_INTO';

export interface CustomerChange {
  type: ChangeType;
  occurredAt: string;
  changes: { field: string; from: string | null; to: string | null }[];
}

export type DuplicateReason = 'SAME_NAME' | 'SIMILAR_NAME' | 'SAME_EMAIL_USER' | 'SAME_ZIP_CODE';

export interface DuplicateCandidate {
  first: Customer;
  second: Customer;
  score: number;
  reasons: DuplicateReason[];
}

export interface CustomerStats {
  totalCustomers: number;
  states: { state: string; customers: number; percentage: number; cities: { city: string; customers: number }[] }[];
}

export const CHANGE_LABELS: Record<ChangeType, string> = {
  CREATED: 'Cadastro',
  RENAMED: 'Nome alterado',
  ADDRESS_CHANGED: 'Endereço alterado',
  DELETED: 'Excluído',
  MERGED: 'Recebeu um duplicado',
  MERGED_INTO: 'Mesclado em outro cliente',
};

export const REASON_LABELS: Record<DuplicateReason, string> = {
  SAME_NAME: 'mesmo nome',
  SIMILAR_NAME: 'nome parecido',
  SAME_EMAIL_USER: 'mesmo usuário de e-mail',
  SAME_ZIP_CODE: 'mesmo CEP',
};
