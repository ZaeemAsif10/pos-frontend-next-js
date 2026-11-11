import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface AccountItem {
  id: number;
  tenant_id: number;
  code: string;
  name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  sub_type?: string;
  parent_id?: number;
  parent_name?: string;
  currency: string;
  is_system: boolean;
  is_active: boolean;
  description?: string;
  current_balance: number;
  created_at: string;
}

export interface AccountTreeNode {
  id: number;
  code: string;
  name: string;
  account_type: string;
  sub_type?: string;
  parent_id?: number;
  currency: string;
  is_system: boolean;
  is_active: boolean;
  current_balance: number;
  children: AccountTreeNode[];
}

export interface AccountCreatePayload {
  code: string;
  name: string;
  account_type: string;
  sub_type?: string;
  parent_id?: number;
  currency?: string;
  description?: string;
}

export interface AccountUpdatePayload {
  name?: string;
  account_type?: string;
  sub_type?: string;
  parent_id?: number;
  currency?: string;
  is_active?: boolean;
  description?: string;
}

export interface AccountBrief {
  id: number;
  code: string;
  name: string;
  account_type: string;
}

export interface TenantAccountingSettingsResponse {
  id: number;
  tenant_id: number;
  base_currency: string;
  financial_year_start_month: number;
  auto_posting_enabled: boolean;
  default_sales_income_account_id?: number;
  default_sales_income_account?: AccountBrief;
  default_ar_account_id?: number;
  default_ar_account?: AccountBrief;
  default_ap_account_id?: number;
  default_ap_account?: AccountBrief;
  default_cash_account_id?: number;
  default_cash_account?: AccountBrief;
  default_bank_account_id?: number;
  default_bank_account?: AccountBrief;
  default_sales_tax_account_id?: number;
  default_sales_tax_account?: AccountBrief;
  default_discount_account_id?: number;
  default_discount_account?: AccountBrief;
  default_cogs_account_id?: number;
  default_cogs_account?: AccountBrief;
  default_inventory_asset_account_id?: number;
  default_inventory_asset_account?: AccountBrief;
  payment_method_mappings: Record<string, number | null>;
  updated_at: string;
}

export interface TenantAccountingSettingsUpdatePayload {
  base_currency?: string;
  financial_year_start_month?: number;
  default_sales_income_account_id?: number;
  default_ar_account_id?: number;
  default_ap_account_id?: number;
  default_cash_account_id?: number;
  default_bank_account_id?: number;
  default_sales_tax_account_id?: number;
  default_discount_account_id?: number;
  default_cogs_account_id?: number;
  default_inventory_asset_account_id?: number;
  payment_method_mappings?: Record<string, number | null>;
  auto_posting_enabled?: boolean;
}

export interface JournalEntryLineItem {
  id: number;
  account_id: number;
  account_code?: string;
  account_name?: string;
  branch_id?: number;
  branch_name?: string;
  debit: number;
  credit: number;
  foreign_amount?: number;
  foreign_currency?: string;
  narration?: string;
  customer_id?: number;
  customer_name?: string;
  supplier_id?: number;
  supplier_name?: string;
}

export interface JournalEntryItem {
  id: number;
  tenant_id: number;
  branch_id?: number;
  branch_name?: string;
  entry_number: string;
  entry_date: string;
  source_type: string;
  source_id?: number;
  reference_no?: string;
  narration?: string;
  currency: string;
  exchange_rate: number;
  status: string;
  total_debit: number;
  total_credit: number;
  created_by_id?: number;
  created_by_name?: string;
  created_at: string;
  lines: JournalEntryLineItem[];
}

export interface PaginatedJournalEntriesResponse {
  items: JournalEntryItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface JournalEntryCreatePayload {
  branch_id?: number;
  entry_date?: string;
  reference_no?: string;
  narration?: string;
  currency?: string;
  exchange_rate?: number;
  lines: Array<{
    account_id: number;
    branch_id?: number;
    debit: number;
    credit: number;
    foreign_amount?: number;
    foreign_currency?: string;
    narration?: string;
    customer_id?: number;
    supplier_id?: number;
  }>;
}

export interface GeneralLedgerLine {
  id: number;
  entry_date: string;
  entry_number: string;
  source_type: string;
  reference_no?: string;
  narration?: string;
  branch_name?: string;
  debit: number;
  credit: number;
  running_balance: number;
}

export interface GeneralLedgerAccountReport {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  sub_type?: string;
  currency: string;
  opening_balance: number;
  total_debit: number;
  total_credit: number;
  closing_balance: number;
  lines: GeneralLedgerLine[];
}

export interface TrialBalanceItem {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  sub_type?: string;
  debit_balance: number;
  credit_balance: number;
}

export interface TrialBalanceResponse {
  as_of_date: string;
  branch_id?: number;
  branch_name?: string;
  items: TrialBalanceItem[];
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
}

export interface ProfitAndLossAccountLine {
  account_id: number;
  account_code: string;
  account_name: string;
  amount: number;
  percentage_of_revenue: number;
}

export interface ProfitAndLossResponse {
  from_date: string;
  to_date: string;
  branch_id?: number;
  branch_name: string;
  currency: string;
  gross_sales: number;
  sales_discounts: number;
  net_revenue: number;
  revenue_lines: ProfitAndLossAccountLine[];
  total_cogs: number;
  cogs_lines: ProfitAndLossAccountLine[];
  gross_profit: number;
  gross_profit_margin_pct: number;
  total_operating_expenses: number;
  expense_lines: ProfitAndLossAccountLine[];
  net_profit: number;
  net_profit_margin_pct: number;
  is_profitable: boolean;
}

export interface BalanceSheetAccountLine {
  account_id: number;
  account_code: string;
  account_name: string;
  sub_type?: string;
  balance: number;
}

export interface BalanceSheetResponse {
  as_of_date: string;
  branch_id?: number;
  branch_name: string;
  currency: string;
  current_assets: BalanceSheetAccountLine[];
  total_current_assets: number;
  non_current_assets: BalanceSheetAccountLine[];
  total_non_current_assets: number;
  total_assets: number;
  current_liabilities: BalanceSheetAccountLine[];
  total_current_liabilities: number;
  long_term_liabilities: BalanceSheetAccountLine[];
  total_long_term_liabilities: number;
  total_liabilities: number;
  equity_lines: BalanceSheetAccountLine[];
  total_equity_capital: number;
  retained_earnings: number;
  current_period_net_profit: number;
  total_equity: number;
  total_liabilities_and_equity: number;
  is_balanced: boolean;
  discrepancy: number;
}

class AccountingService {
  // Chart of Accounts
  async listAccounts(params?: {
    account_type?: string;
    search?: string;
    active_only?: boolean;
  }): Promise<AccountItem[]> {
    return apiClient<AccountItem[]>(API_ENDPOINTS.TENANT.ACCOUNTING_ACCOUNTS, {
      params,
    });
  }

  async getAccountTree(): Promise<AccountTreeNode[]> {
    return apiClient<AccountTreeNode[]>(API_ENDPOINTS.TENANT.ACCOUNTING_ACCOUNTS_TREE);
  }

  async createAccount(payload: AccountCreatePayload): Promise<AccountItem> {
    return apiClient<AccountItem>(API_ENDPOINTS.TENANT.ACCOUNTING_ACCOUNTS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateAccount(id: number, payload: AccountUpdatePayload): Promise<AccountItem> {
    return apiClient<AccountItem>(API_ENDPOINTS.TENANT.ACCOUNTING_ACCOUNT_DETAIL(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteAccount(id: number): Promise<{ message: string }> {
    return apiClient<{ message: string }>(API_ENDPOINTS.TENANT.ACCOUNTING_ACCOUNT_DETAIL(id), {
      method: "DELETE",
    });
  }

  // Settings & Mappings (The 1 Screen)
  async getSettings(): Promise<TenantAccountingSettingsResponse> {
    return apiClient<TenantAccountingSettingsResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_SETTINGS);
  }

  async updateSettings(
    payload: TenantAccountingSettingsUpdatePayload
  ): Promise<TenantAccountingSettingsResponse> {
    return apiClient<TenantAccountingSettingsResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_SETTINGS, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  // Journal Vouchers
  async listJournalEntries(params?: {
    branch_id?: number;
    source_type?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedJournalEntriesResponse> {
    return apiClient<PaginatedJournalEntriesResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_JOURNAL, {
      params,
    });
  }

  async createJournalEntry(payload: JournalEntryCreatePayload): Promise<JournalEntryItem> {
    return apiClient<JournalEntryItem>(API_ENDPOINTS.TENANT.ACCOUNTING_JOURNAL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Reports
  async getGeneralLedger(
    accountId: number,
    params?: { from_date?: string; to_date?: string; branch_id?: number }
  ): Promise<GeneralLedgerAccountReport> {
    return apiClient<GeneralLedgerAccountReport>(API_ENDPOINTS.TENANT.ACCOUNTING_LEDGER(accountId), {
      params,
    });
  }

  async getTrialBalance(params?: {
    as_of_date?: string;
    branch_id?: number;
  }): Promise<TrialBalanceResponse> {
    return apiClient<TrialBalanceResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_TRIAL_BALANCE, {
      params,
    });
  }

  // Financial Statements (IFRS/GAAP)
  async getProfitAndLoss(params?: {
    from_date?: string;
    to_date?: string;
    branch_id?: number;
  }): Promise<ProfitAndLossResponse> {
    return apiClient<ProfitAndLossResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_PROFIT_AND_LOSS, {
      params,
    });
  }

  async getBalanceSheet(params?: {
    as_of_date?: string;
    branch_id?: number;
  }): Promise<BalanceSheetResponse> {
    return apiClient<BalanceSheetResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_BALANCE_SHEET, {
      params,
    });
  }

  // Expense Vouchers (Direct CPV)
  async getExpenseVouchers(params?: {
    branch_id?: number;
    expense_account_id?: number;
    payment_method?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedExpenseVouchersResponse> {
    return apiClient<PaginatedExpenseVouchersResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_EXPENSES, {
      params,
    });
  }

  async getExpenseSummary(params?: { branch_id?: number }): Promise<ExpenseSummaryResponse> {
    return apiClient<ExpenseSummaryResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_EXPENSES_SUMMARY, {
      params,
    });
  }

  async getExpenseVoucher(id: number): Promise<ExpenseVoucherItem> {
    return apiClient<ExpenseVoucherItem>(API_ENDPOINTS.TENANT.ACCOUNTING_EXPENSE_DETAIL(id));
  }

  async createExpenseVoucher(payload: ExpenseVoucherCreatePayload): Promise<ExpenseVoucherItem> {
    return apiClient<ExpenseVoucherItem>(API_ENDPOINTS.TENANT.ACCOUNTING_EXPENSES, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async deleteExpenseVoucher(id: number): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>(API_ENDPOINTS.TENANT.ACCOUNTING_EXPENSE_DETAIL(id), {
      method: "DELETE",
    });
  }

  // Fiscal Year-End Closing (Phase 7.2)
  async previewFiscalYearClosing(params: {
    closing_date: string;
    branch_id?: number;
  }): Promise<YearEndClosingPreviewResponse> {
    return apiClient<YearEndClosingPreviewResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_CLOSING_PREVIEW, {
      params,
    });
  }

  async executeFiscalYearClosing(
    payload: YearEndClosingExecutePayload
  ): Promise<YearEndClosingExecuteResponse> {
    return apiClient<YearEndClosingExecuteResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_CLOSING_EXECUTE, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Bank Reconciliation (BRS - Phase 8)
  async getReconcilableBankAccounts(): Promise<BankReconcilableAccountItem[]> {
    return apiClient<BankReconcilableAccountItem[]>(API_ENDPOINTS.TENANT.ACCOUNTING_RECONCILIATION_ACCOUNTS);
  }

  async listBankReconciliations(params?: {
    account_id?: number;
    status?: string;
  }): Promise<BankReconciliationSummary[]> {
    return apiClient<BankReconciliationSummary[]>(API_ENDPOINTS.TENANT.ACCOUNTING_RECONCILIATIONS, {
      params,
    });
  }

  async createBankReconciliation(
    payload: BankReconciliationCreatePayload
  ): Promise<BankReconciliationDetailResponse> {
    return apiClient<BankReconciliationDetailResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_RECONCILIATIONS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getBankReconciliationDetails(
    id: number
  ): Promise<BankReconciliationDetailResponse> {
    return apiClient<BankReconciliationDetailResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_RECONCILIATION_DETAIL(id));
  }

  async matchBankReconciliationItems(
    id: number,
    payload: BankReconciliationMatchPayload
  ): Promise<BankReconciliationDetailResponse> {
    return apiClient<BankReconciliationDetailResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_RECONCILIATION_MATCH(id), {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async completeBankReconciliation(
    id: number,
    payload: BankReconciliationCompletePayload
  ): Promise<BankReconciliationDetailResponse> {
    return apiClient<BankReconciliationDetailResponse>(API_ENDPOINTS.TENANT.ACCOUNTING_RECONCILIATION_COMPLETE(id), {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

export interface YearEndClosingAccountLine {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  current_balance: number;
  closing_action: string;
  amount: number;
}

export interface YearEndClosingPreviewResponse {
  closing_date: string;
  financial_year_start: string;
  financial_year_end: string;
  branch_id?: number | null;
  branch_name?: string | null;
  total_revenue_to_close: number;
  total_expenses_to_close: number;
  net_profit: number;
  is_profitable: boolean;
  retained_earnings_account_id: number;
  retained_earnings_account_code: string;
  retained_earnings_account_name: string;
  retained_earnings_before: number;
  retained_earnings_after: number;
  lines: YearEndClosingAccountLine[];
  can_close: boolean;
  already_closed: boolean;
  existing_jv_number?: string | null;
  message?: string | null;
}

export interface YearEndClosingExecutePayload {
  closing_date: string;
  branch_id?: number | null;
  notes?: string | null;
}

export interface YearEndClosingExecuteResponse {
  message: string;
  journal_entry_id: number;
  journal_entry_number: string;
  closing_date: string;
  net_profit_transferred: number;
  total_revenue_closed: number;
  total_expenses_closed: number;
  retained_earnings_new_balance: number;
}

// Export Types for Expense Vouchers
export interface ExpenseVoucherItem {
  id: number;
  tenant_id: number;
  branch_id?: number | null;
  branch_name?: string | null;
  voucher_number: string;
  expense_date: string;
  expense_account_id: number;
  expense_account_code: string;
  expense_account_name: string;
  paid_from_account_id: number;
  paid_from_account_code: string;
  paid_from_account_name: string;
  amount: number;
  payment_method: string;
  payee_name: string;
  reference_no?: string | null;
  narration?: string | null;
  attachment_url?: string | null;
  status: string;
  journal_entry_id?: number | null;
  journal_entry_number?: string | null;
  created_by_name?: string | null;
  created_at: string;
}

export interface ExpenseVoucherCreatePayload {
  branch_id?: number | null;
  expense_account_id: number;
  paid_from_account_id?: number | null;
  amount: number;
  payment_method?: string;
  payee_name: string;
  expense_date?: string | null;
  reference_no?: string | null;
  narration?: string | null;
  attachment_url?: string | null;
}

export interface PaginatedExpenseVouchersResponse {
  items: ExpenseVoucherItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ExpenseCategoryBreakdownItem {
  account_id: number;
  account_code: string;
  account_name: string;
  amount: number;
  count: number;
}

export interface ExpenseSummaryResponse {
  today_total: number;
  month_total: number;
  cash_total: number;
  bank_total: number;
  category_breakdown: ExpenseCategoryBreakdownItem[];
}

export interface BankReconcilableAccountItem {
  id: number;
  code: string;
  name: string;
  currency: string;
  current_balance: number;
  unreconciled_count: number;
}

export interface BankReconciliationCreatePayload {
  account_id: number;
  statement_date: string;
  statement_start_date?: string | null;
  statement_ending_balance: number;
  branch_id?: number | null;
  notes?: string | null;
}

export interface BankReconciliationTransactionItem {
  journal_entry_line_id: number;
  journal_entry_id: number;
  entry_number: string;
  entry_date: string;
  source_type: string;
  reference_no?: string | null;
  narration?: string | null;
  debit: number;
  credit: number;
  is_matched: boolean;
  matched_at?: string | null;
}

export interface BankReconciliationSummary {
  id: number;
  reconciliation_number: string;
  account_id: number;
  account_code: string;
  account_name: string;
  branch_id?: number | null;
  statement_date: string;
  statement_start_date?: string | null;
  statement_ending_balance: number;
  book_balance: number;
  cleared_deposits: number;
  cleared_payments: number;
  reconciled_balance: number;
  difference: number;
  status: string;
  notes?: string | null;
  reconciled_by_name?: string | null;
  reconciled_at?: string | null;
  created_at: string;
}

export interface BankReconciliationDetailResponse {
  reconciliation: BankReconciliationSummary;
  deposits_in_transit: number;
  outstanding_payments: number;
  adjusted_book_balance: number;
  is_balanced: boolean;
  transactions: BankReconciliationTransactionItem[];
}

export interface BankReconciliationMatchPayload {
  matched_line_ids: number[];
  unmatched_line_ids: number[];
}

export interface BankReconciliationCompletePayload {
  notes?: string | null;
}

export const accountingService = new AccountingService();

