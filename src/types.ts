export type UserRole = 'super_admin' | 'admin' | 'member';

export const SUPER_ADMIN_EMAIL = 'david.calvin89@gmail.com';
export const SUPER_ADMIN_ID = 'usr-super-admin-david';
export const HOLDING_RND_ID = 'HOLDING_RND';

export type DateRangeFilter =
  | '7d'
  | '15d'
  | '30d'
  | '60d'
  | '90d'
  | '1y'
  | 'all_time'
  | 'custom';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  password?: string;
  avatar_url?: string;
  invite_token?: string;
  invite_expires_at?: number;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  card_accent_color: string; // Hex from pastel_accents
  is_archived?: boolean;
  created_by: string; // foreign key -> users.id
  created_at: string;
}

export type HppMode = 'direct' | 'itemized';

export interface HppComponentItem {
  item_name: string;
  cost: number;
}

export interface Product {
  id: string;
  business_id: string; // foreign key -> businesses.id
  sku: string; // auto-generated from business name + product sequence + product name
  name: string;
  hpp_mode: HppMode;
  hpp_components: HppComponentItem[]; // jsonb array of {item_name, cost}
  current_total_hpp: number;
  current_selling_price: number;
  is_active: boolean;
  updated_at: string;
}

export interface SalesTransaction {
  id: string;
  business_id: string; // foreign key -> businesses.id
  product_id: string; // foreign key -> products.id
  transaction_date: string; // YYYY-MM-DD (indexed)
  qty: number;
  hpp_snapshot: number; // locked HPP at time of entry
  selling_price_snapshot: number; // locked Selling Price at time of entry
  total_revenue: number;
  total_hpp: number;
  gross_profit: number;
  created_by: string; // foreign key -> users.id
  created_at: string;
}

export interface OperationalExpense {
  id: string;
  business_id: string; // foreign key -> businesses.id OR 'HOLDING_RND' for R&D / Corporate expenses
  transaction_date: string; // YYYY-MM-DD (indexed)
  expense_name: string;
  category: string;
  amount: number;
  notes: string;
  created_by: string; // foreign key -> users.id
  created_at: string;
}

export interface BankSettings {
  id: string;
  bank_name: string;
  opening_balance: number;
  opening_date: string; // YYYY-MM-DD
  updated_by: string;
  updated_at: string;
}

export interface BalanceAdjustment {
  id: string;
  adjustment_date: string; // YYYY-MM-DD
  system_balance_before: number;
  actual_bank_balance: number;
  difference_amount: number; // actual_bank_balance - system_balance_before
  reason: string;
  tag?: string;
  type?: 'addition' | 'deduction';
  created_by: string; // foreign key -> users.id
  created_at: string;
}

export interface DatabaseState {
  users: User[];
  businesses: Business[];
  products: Product[];
  sales_transactions: SalesTransaction[];
  operational_expenses: OperationalExpense[];
  bank_settings?: BankSettings;
  balance_adjustments?: BalanceAdjustment[];
}

export interface FinancialSummary {
  gross_revenue: number;
  total_hpp_cost: number;
  gross_profit: number;
  total_operational_expense: number;
  total_expenses: number; // total_hpp_cost + total_operational_expense
  net_profit_or_loss: number;
  profit_status: 'PROFIT' | 'LOSS';
  profit_margin_percent: number;
  sales_count: number;
  qty_sold: number;
}
