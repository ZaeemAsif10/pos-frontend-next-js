"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  IconSettingsAutomation,
  IconCheck,
  IconRefresh,
  IconDeviceFloppy,
  IconReceipt,
  IconCash,
  IconTruckDelivery,
  IconInfoCircle,
  IconShieldCheck,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  accountingService,
  type AccountItem,
  type TenantAccountingSettingsResponse,
} from "@/services/accounting.service";

export default function AccountingMappingsPage() {
  const [settings, setSettings] = useState<TenantAccountingSettingsResponse | null>(null);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State
  const [autoPosting, setAutoPosting] = useState<boolean>(true);
  const [salesAcc, setSalesAcc] = useState<string>("");
  const [arAcc, setArAcc] = useState<string>("");
  const [apAcc, setApAcc] = useState<string>("");
  const [cashAcc, setCashAcc] = useState<string>("");
  const [bankAcc, setBankAcc] = useState<string>("");
  const [taxAcc, setTaxAcc] = useState<string>("");
  const [discountAcc, setDiscountAcc] = useState<string>("");
  const [cogsAcc, setCogsAcc] = useState<string>("");
  const [inventoryAcc, setInventoryAcc] = useState<string>("");

  // Payment method specific mappings
  const [pmCash, setPmCash] = useState<string>("");
  const [pmBank, setPmBank] = useState<string>("");
  const [pmRaast, setPmRaast] = useState<string>("");
  const [pmCard, setPmCard] = useState<string>("");
  const [pmCheque, setPmCheque] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accList, sett] = await Promise.all([
        accountingService.listAccounts({ active_only: true }),
        accountingService.getSettings(),
      ]);

      setAccounts(accList);
      setSettings(sett);

      setAutoPosting(sett.auto_posting_enabled ?? true);
      setSalesAcc(sett.default_sales_income_account_id?.toString() || "");
      setArAcc(sett.default_ar_account_id?.toString() || "");
      setApAcc(sett.default_ap_account_id?.toString() || "");
      setCashAcc(sett.default_cash_account_id?.toString() || "");
      setBankAcc(sett.default_bank_account_id?.toString() || "");
      setTaxAcc(sett.default_sales_tax_account_id?.toString() || "");
      setDiscountAcc(sett.default_discount_account_id?.toString() || "");
      setCogsAcc(sett.default_cogs_account_id?.toString() || "");
      setInventoryAcc(sett.default_inventory_asset_account_id?.toString() || "");

      const pm = sett.payment_method_mappings || {};
      setPmCash(pm["cash"] ? pm["cash"]!.toString() : sett.default_cash_account_id?.toString() || "");
      setPmBank(pm["bank_transfer"] ? pm["bank_transfer"]!.toString() : sett.default_bank_account_id?.toString() || "");
      setPmRaast(pm["raast"] ? pm["raast"]!.toString() : sett.default_bank_account_id?.toString() || "");
      setPmCard(pm["card"] ? pm["card"]!.toString() : sett.default_bank_account_id?.toString() || "");
      setPmCheque(pm["cheque"] ? pm["cheque"]!.toString() : sett.default_cash_account_id?.toString() || "");
    } catch (err: any) {
      toast.error(err?.message || "Failed to load accounting settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await accountingService.updateSettings({
        auto_posting_enabled: autoPosting,
        default_sales_income_account_id: salesAcc ? parseInt(salesAcc) : undefined,
        default_ar_account_id: arAcc ? parseInt(arAcc) : undefined,
        default_ap_account_id: apAcc ? parseInt(apAcc) : undefined,
        default_cash_account_id: cashAcc ? parseInt(cashAcc) : undefined,
        default_bank_account_id: bankAcc ? parseInt(bankAcc) : undefined,
        default_sales_tax_account_id: taxAcc ? parseInt(taxAcc) : undefined,
        default_discount_account_id: discountAcc ? parseInt(discountAcc) : undefined,
        default_cogs_account_id: cogsAcc ? parseInt(cogsAcc) : undefined,
        default_inventory_asset_account_id: inventoryAcc ? parseInt(inventoryAcc) : undefined,
        payment_method_mappings: {
          cash: pmCash ? parseInt(pmCash) : null,
          bank_transfer: pmBank ? parseInt(pmBank) : null,
          raast: pmRaast ? parseInt(pmRaast) : null,
          card: pmCard ? parseInt(pmCard) : null,
          cheque: pmCheque ? parseInt(pmCheque) : null,
        },
      });

      setSettings(updated);
      toast.success("Account mappings saved successfully! Auto-posting will use these accounts.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save account mappings.");
    } finally {
      setSaving(false);
    }
  };

  // Group accounts for easy dropdowns
  const assetAccounts = accounts.filter((a) => a.account_type === "asset");
  const liabilityAccounts = accounts.filter((a) => a.account_type === "liability");
  const revenueAccounts = accounts.filter((a) => a.account_type === "revenue");
  const expenseAccounts = accounts.filter((a) => a.account_type === "expense");

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <IconSettingsAutomation className="h-6 w-6 text-primary" />
            Account Mappings & Posting Configuration
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure automated General Ledger accounts for POS billing, customer receipts, and supplier payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading || saving}
            className="h-9 gap-1 text-xs"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Reload</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={loading || saving}
            className="h-9 gap-1.5 text-xs font-semibold shadow-2xs"
          >
            <IconDeviceFloppy className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Mappings"}</span>
          </Button>
        </div>
      </div>

      {/* Info Banner: Zero-Touch Automation */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
        <IconShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <p className="font-semibold text-foreground">Zero-Touch Accounting Activated</p>
          <p className="text-muted-foreground mt-0.5">
            Counter cashiers and sales clerks do not need to choose debit/credit heads. When an invoice is finalized or recovery is received, the system automatically posts balanced double-entry vouchers to these pre-configured heads.
          </p>
        </div>
      </div>

      {/* Global Master Switch */}
      <Card className="shadow-2xs">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-semibold text-foreground">Automatic Double-Entry Posting Engine</Label>
            <p className="text-xs text-muted-foreground">
              When enabled, checkout and payment events instantly generate General Journal Vouchers (JVs).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={autoPosting ? "default" : "secondary"} className="text-xs">
              {autoPosting ? "Enabled" : "Disabled"}
            </Badge>
            <Switch checked={autoPosting} onCheckedChange={setAutoPosting} />
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Sales & POS Billing Mappings */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <IconReceipt className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base font-bold">Sales & Invoicing Heads</CardTitle>
              <CardDescription className="text-xs">
                Determines which revenue, debtor, tax, and discount accounts are affected on POS checkout.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Default Sales Revenue Account (Income)</Label>
            <Select value={salesAcc} onValueChange={setSalesAcc}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Sales Income Account" />
              </SelectTrigger>
              <SelectContent>
                {revenueAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Credited with gross sales revenue at checkout.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Accounts Receivable (Customer Khata)</Label>
            <Select value={arAcc} onValueChange={setArAcc}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Accounts Receivable" />
              </SelectTrigger>
              <SelectContent>
                {assetAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Debited when a customer purchases on credit (balance due).</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Sales Tax Output Payable (FBR / PRA)</Label>
            <Select value={taxAcc} onValueChange={setTaxAcc}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Sales Tax Account" />
              </SelectTrigger>
              <SelectContent>
                {liabilityAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Credited when sales tax is charged on taxable invoices.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Sales Discounts Allowed (Contra-Revenue)</Label>
            <Select value={discountAcc} onValueChange={setDiscountAcc}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Discounts Account" />
              </SelectTrigger>
              <SelectContent>
                {revenueAccounts.concat(expenseAccounts).map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Tracks customer discounts given during checkout.</p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Payment Channels to Asset Account Mappings */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <IconCash className="h-5 w-5 text-emerald-600" />
            <div>
              <CardTitle className="text-base font-bold">Payment Methods & Tender Accounts</CardTitle>
              <CardDescription className="text-xs">
                Maps each payment channel (Cash, Bank, Raast, Card) to its specific cash drawer or bank ledger head.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">💵 Counter Cash / Cash Drawer</Label>
            <Select value={pmCash} onValueChange={setPmCash}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Cash Account" />
              </SelectTrigger>
              <SelectContent>
                {assetAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Debited whenever physical cash is paid on the counter.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">🏦 Bank Transfers (Online / IBFT)</Label>
            <Select value={pmBank} onValueChange={setPmBank}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Bank Account" />
              </SelectTrigger>
              <SelectContent>
                {assetAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Debited when payments are deposited directly into company bank.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">⚡ Raast Instant Payments</Label>
            <Select value={pmRaast} onValueChange={setPmRaast}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Raast Account" />
              </SelectTrigger>
              <SelectContent>
                {assetAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Debited for QR or Raast ID instant customer transfers.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">💳 Card Machine / POS Terminal</Label>
            <Select value={pmCard} onValueChange={setPmCard}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Merchant Card Account" />
              </SelectTrigger>
              <SelectContent>
                {assetAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Debited for debit/credit card merchant settlements.</p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Suppliers & Cost of Goods Sold */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <IconTruckDelivery className="h-5 w-5 text-rose-600" />
            <div>
              <CardTitle className="text-base font-bold">Purchases, Suppliers & Inventory</CardTitle>
              <CardDescription className="text-xs">
                Determines trade payables, stock assets, and cost of goods sold.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Accounts Payable (Supplier Khata)</Label>
            <Select value={apAcc} onValueChange={setApAcc}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Accounts Payable" />
              </SelectTrigger>
              <SelectContent>
                {liabilityAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Debited on supplier payout (CPV) and credited on purchase bills.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Merchandise Inventory (Stock Asset)</Label>
            <Select value={inventoryAcc} onValueChange={setInventoryAcc}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Inventory Asset" />
              </SelectTrigger>
              <SelectContent>
                {assetAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Tracks the balance sheet asset value of on-hand merchandise.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Cost of Goods Sold (COGS)</Label>
            <Select value={cogsAcc} onValueChange={setCogsAcc}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select COGS Account" />
              </SelectTrigger>
              <SelectContent>
                {expenseAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Expense head reflecting the procurement cost of products sold.</p>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          size="lg"
          onClick={handleSave}
          disabled={loading || saving}
          className="gap-2 text-xs font-semibold shadow-md px-6"
        >
          <IconCheck className="h-4 w-4" />
          <span>{saving ? "Saving Changes..." : "Save Account Mappings"}</span>
        </Button>
      </div>
    </div>
  );
}
