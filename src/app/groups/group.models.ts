export interface Member {
  id: number;
  name: string;
  /** False once the member left the group. */
  active: boolean;
}

export interface Group {
  id: number;
  name: string;
  currency: string;
  members: Member[];
  createdAt: string;
}

export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';
export type ExpenseCategory = 'FOOD' | 'GROCERIES' | 'TRANSPORT' | 'LODGING' | 'LEISURE' | 'BILLS' | 'OTHER';

export interface Expense {
  id: number;
  description: string;
  amount: number;
  payer: Member;
  splitType: SplitType;
  category: ExpenseCategory;
  spentAt: string;
  shares: { memberId: number; memberName: string; amount: number }[];
  foreign: { currency: string; amount: number; exchangeRate: number } | null;
}

export interface CreateExpense {
  description: string;
  amount: number;
  payerId: number;
  splitType: SplitType;
  category: ExpenseCategory;
  spentAt: string | null;
  shares: { memberId: number; value: number | null }[];
  currency?: string | null;
  exchangeRate?: number | null;
}

export interface ReceiptItem {
  description: string;
  unitPrice: number;
  quantity: number;
  memberIds: number[];
}

export interface ReceiptSplit {
  description: string;
  payerId: number;
  category: ExpenseCategory;
  spentAt: string | null;
  items: ReceiptItem[];
  serviceChargePercent: number | null;
  discount: number | null;
}

export interface MemberBill {
  memberId: number;
  name: string;
  subtotal: number;
  serviceCharge: number;
  discount: number;
  total: number;
}

export interface ReceiptPreview {
  subtotal: number;
  serviceCharge: number;
  discount: number;
  total: number;
  members: MemberBill[];
}

export interface Balance {
  memberId: number;
  memberName: string;
  paid: number;
  owed: number;
  sent: number;
  received: number;
  balance: number;
}

export interface Transfer {
  from: Member;
  to: Member;
  amount: number;
}

export interface Settlement {
  id: number;
  from: Member;
  to: Member;
  amount: number;
  paidAt: string;
}

export interface Activity {
  id: number;
  type: string;
  summary: string;
  amount: number | null;
  occurredAt: string;
}

export interface ActivityFeed {
  items: Activity[];
  nextCursor: number | null;
}

export interface SpendingReport {
  total: number;
  expenseCount: number;
  averageExpense: number;
  months: { month: string; total: number; expenseCount: number }[];
  categories: { category: ExpenseCategory; total: number; expenseCount: number; percentage: number }[];
  members: { memberId: number; memberName: string; paid: number; consumed: number; percentage: number }[];
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FOOD: 'Alimentação',
  GROCERIES: 'Mercado',
  TRANSPORT: 'Transporte',
  LODGING: 'Hospedagem',
  LEISURE: 'Lazer',
  BILLS: 'Contas',
  OTHER: 'Outros',
};

export const SPLIT_LABELS: Record<SplitType, string> = {
  EQUAL: 'Igual',
  EXACT: 'Valores exatos',
  PERCENTAGE: 'Porcentagem',
  SHARES: 'Cotas',
};
