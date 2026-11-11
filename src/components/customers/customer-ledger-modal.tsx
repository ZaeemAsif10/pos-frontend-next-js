"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  IconFileText,
  IconBrandWhatsapp,
  IconPrinter,
  IconCash,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconRefresh,
  IconLanguage,
} from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  partyService,
  type CustomerItem,
  type CustomerLedgerResponse,
} from "@/services/party.service";

export type ReceiptLanguage = "bilingual" | "ur" | "en";
type DateFilterPreset = "all" | "this_month" | "last_30" | "this_week";

interface CustomerLedgerModalProps {
  customer: CustomerItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReceivePayment?: (customer: CustomerItem) => void;
}

const computeDateRange = (presetVal: DateFilterPreset) => {
  const now = new Date();
  if (presetVal === "this_week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return { from_date: start.toISOString(), to_date: now.toISOString() };
  }
  if (presetVal === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from_date: start.toISOString(), to_date: now.toISOString() };
  }
  if (presetVal === "last_30") {
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    return { from_date: start.toISOString(), to_date: now.toISOString() };
  }
  return {};
};

const getLabels = (lang: ReceiptLanguage) => {
  if (lang === "ur") {
    return {
      title: "کھاتہ اسٹیٹمنٹ",
      subtitle: "تصدیق شدہ کھاتہ تفصیل • کسٹمر اسٹیٹمنٹ",
      customer: "گاہک / دکان",
      code: "کھاتہ نمبر",
      creditLimit: "ادھار حد",
      phone: "رابطہ فون",
      openingBal: "سابقہ بقایا",
      totalDebit: "کل خریداری (ڈیبٹ)",
      totalCredit: "کل وصولی (کریڈٹ)",
      closingBal: "موجودہ حتمی بقایا",
      dateCol: "تاریخ و وقت",
      refCol: "حوالہ نمبر",
      descCol: "تفصیل",
      debitCol: "خریداری (+بل)",
      creditCol: "وصولی (-ادائیگی)",
      balCol: "بقایا رقم",
      noTx: "اس مدت میں کوئی لین دین نہیں پایا گیا۔",
      footer: "شکریہ برائے بروقت ادائیگی۔",
      footerSub: "کمپیوٹرائزڈ کھاتہ اسٹیٹمنٹ",
      printed: "پرنٹ تاریخ:",
    };
  }
  if (lang === "bilingual") {
    return {
      title: "CUSTOMER LEDGER STATEMENT / کھاتہ اسٹیٹمنٹ",
      subtitle: "Verified Account Statement • تصدیق شدہ کھاتہ تفصیل",
      customer: "Customer / گاہک",
      code: "Account Code / کوڈ",
      creditLimit: "Credit Limit / حد",
      phone: "Phone / فون",
      openingBal: "Opening Balance / سابقہ بقایا",
      totalDebit: "Total Invoiced / کل بل",
      totalCredit: "Total Paid / کل وصولی",
      closingBal: "Net Balance / حتمی بقایا",
      dateCol: "Date & Time / تاریخ",
      refCol: "Reference / حوالہ",
      descCol: "Description / تفصیل",
      debitCol: "Debit (+Bill)",
      creditCol: "Credit (-Paid)",
      balCol: "Balance / بقایا",
      noTx: "No transactions found in this period / اس مدت میں کوئی لین دین نہیں",
      footer: "Thank you for your business! • شکریہ برائے بروقت ادائیگی۔",
      footerSub: "System Generated Statement",
      printed: "Printed:",
    };
  }
  // English default
  return {
    title: "CUSTOMER LEDGER STATEMENT",
    subtitle: "Verified Commercial Account Statement",
    customer: "Customer",
    code: "Account Code",
    creditLimit: "Credit Limit",
    phone: "Phone",
    openingBal: "Opening Balance",
    totalDebit: "Total Invoiced (Debits)",
    totalCredit: "Total Paid (Credits)",
    closingBal: "Net Closing Balance",
    dateCol: "Date & Time",
    refCol: "Reference",
    descCol: "Description",
    debitCol: "Debit (+Billed)",
    creditCol: "Credit (-Paid)",
    balCol: "Running Balance",
    noTx: "No transactions found for the selected period.",
    footer: "Thank you for your business!",
    footerSub: "This is a system generated statement of accounts.",
    printed: "Printed:",
  };
};

export function CustomerLedgerModal({
  customer,
  isOpen,
  onClose,
  onOpenReceivePayment,
}: CustomerLedgerModalProps) {
  const [ledger, setLedger] = useState<CustomerLedgerResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [preset, setPreset] = useState<DateFilterPreset>("all");
  const [language, setLanguage] = useState<ReceiptLanguage>("en");

  const loadLedgerData = async (targetPreset: DateFilterPreset, isInitial = false) => {
    if (!customer) return;
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setIsFetching(true);
    }

    try {
      const range = computeDateRange(targetPreset);
      const data = await partyService.getCustomerLedger(customer.id, range);
      setLedger(data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load customer ledger statement.");
    } finally {
      setInitialLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      setPreset("all");
      loadLedgerData("all", true);
    }
  }, [isOpen, customer?.id]);

  if (!customer) return null;

  const handlePresetChange = (newPreset: DateFilterPreset) => {
    if (newPreset === preset && !isFetching) return;
    setPreset(newPreset);
    loadLedgerData(newPreset, false);
  };

  const summary = ledger?.summary;
  const entries = ledger?.entries || [];

  const handleSendWhatsAppStatement = () => {
    if (!ledger || !summary) return;
    const phone = customer.whatsapp_number || customer.phone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "").replace(/^0/, "92");
    const dateStr = new Date().toLocaleDateString();

    let txLines = "";
    const recent = entries.slice(-5);

    if (language === "ur") {
      recent.forEach((e) => {
        const dStr = new Date(e.date).toLocaleDateString();
        if (e.entry_type === "invoice") {
          txLines += `• ${dStr} | بل #${e.reference} | +PKR ${e.debit.toLocaleString()} (بقایا: PKR ${e.balance.toLocaleString()})\n`;
        } else {
          txLines += `• ${dStr} | وصولی #${e.reference} | -PKR ${e.credit.toLocaleString()} (بقایا: PKR ${e.balance.toLocaleString()})\n`;
        }
      });

      const message = `*📊 کھاتہ اسٹیٹمنٹ (LEDGER STATEMENT)*
*گاہک / دکان:* ${customer.business_name}
*کھاتہ نمبر:* ${customer.code}
*تاریخ:* ${dateStr}
--------------------------------
*سابقہ بقایا:* PKR ${summary.opening_balance.toLocaleString()}
*کل خریداری (بل):* PKR ${summary.total_debit.toLocaleString()}
*کل وصولی:* PKR ${summary.total_credit.toLocaleString()}
*حتمی بقایا رقم:* PKR ${summary.closing_balance.toLocaleString()}
--------------------------------
*حالیہ لین دین:*
${txLines || "اس مدت میں کوئی لین دین نہیں پایا گیا۔\n"}--------------------------------
شکریہ برائے بروقت ادائیگی۔`;

      const encoded = encodeURIComponent(message);
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
      window.open(waUrl, "_blank");
      return;
    }

    if (language === "bilingual") {
      recent.forEach((e) => {
        const dStr = new Date(e.date).toLocaleDateString();
        if (e.entry_type === "invoice") {
          txLines += `• ${dStr} | Inv #${e.reference} | +PKR ${e.debit.toLocaleString()} (Bal: PKR ${e.balance.toLocaleString()})\n`;
        } else {
          txLines += `• ${dStr} | CRV #${e.reference} | -PKR ${e.credit.toLocaleString()} (Bal: PKR ${e.balance.toLocaleString()})\n`;
        }
      });

      const message = `*📊 KHATA STATEMENT / کھاتہ تفصیل*
*Customer / گاہک:* ${customer.business_name}
*Code / کوڈ:* ${customer.code}
*Date / تاریخ:* ${dateStr}
--------------------------------
*Opening Balance (سابقہ):* PKR ${summary.opening_balance.toLocaleString()}
*Total Purchases (بل):* PKR ${summary.total_debit.toLocaleString()}
*Total Payments (وصولی):* PKR ${summary.total_credit.toLocaleString()}
*NET BALANCE (بقایا):* PKR ${summary.closing_balance.toLocaleString()}
--------------------------------
*Recent Activity:*
${txLines || "No recent transactions.\n"}--------------------------------
Thank you for your business!
شکریہ برائے بروقت ادائیگی۔`;

      const encoded = encodeURIComponent(message);
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
      window.open(waUrl, "_blank");
      return;
    }

    // Pure English
    recent.forEach((e) => {
      const dStr = new Date(e.date).toLocaleDateString();
      if (e.entry_type === "invoice") {
        txLines += `• ${dStr} | Inv #${e.reference} | +PKR ${e.debit.toLocaleString()} (Bal: PKR ${e.balance.toLocaleString()})\n`;
      } else {
        txLines += `• ${dStr} | CRV #${e.reference} | -PKR ${e.credit.toLocaleString()} (Bal: PKR ${e.balance.toLocaleString()})\n`;
      }
    });

    const message = `*📊 CUSTOMER LEDGER STATEMENT*
*Customer:* ${customer.business_name}
*Account Code:* ${customer.code}
*Statement Date:* ${dateStr}
--------------------------------
*Opening Balance:* PKR ${summary.opening_balance.toLocaleString()}
*Total Invoiced:* PKR ${summary.total_debit.toLocaleString()}
*Total Recovered:* PKR ${summary.total_credit.toLocaleString()}
*NET CLOSING BALANCE:* PKR ${summary.closing_balance.toLocaleString()}
--------------------------------
*Recent Activity:*
${txLines || "No transactions in this period.\n"}--------------------------------
Thank you for your business!`;

    const encoded = encodeURIComponent(message);
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, "_blank");
  };

  const handlePrintLedger = () => {
    if (!ledger || !summary) return;

    const existingFrame = document.getElementById("ledger-print-iframe");
    if (existingFrame) existingFrame.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "ledger-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100vh";
    iframe.style.border = "0";
    iframe.style.zIndex = "-99999";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const t = getLabels(language);
    const isRtl = language === "ur";

    const rowsHtml = entries
      .map(
        (e) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">
          ${new Date(e.date).toLocaleDateString()} ${new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-family: monospace; font-weight: 600;">
          ${e.reference}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">
          ${e.description} ${e.notes ? `<span style="color: #6b7280; font-size: 10px;">(${e.notes})</span>` : ""}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-align: ${isRtl ? "left" : "right"}; font-family: monospace;">
          ${e.debit > 0 ? "PKR " + e.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-align: ${isRtl ? "left" : "right"}; font-family: monospace; color: #059669;">
          ${e.credit > 0 ? "PKR " + e.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-align: ${isRtl ? "left" : "right"}; font-family: monospace; font-weight: bold;">
          PKR ${e.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html dir="${isRtl ? "rtl" : "ltr"}">
      <head>
        <title>Customer Ledger - ${customer.business_name}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #111827;
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 14px; }
          .title { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          .subtitle { font-size: 11px; color: #4b5563; margin-top: 2px; }
          .customer-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
          .kpi-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; background: #fff; }
          .kpi-label { font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
          .kpi-val { font-size: 14px; font-weight: 800; font-family: monospace; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #f3f4f6; text-align: ${isRtl ? "right" : "left"}; padding: 8px; font-size: 10px; text-transform: uppercase; font-weight: 700; border-bottom: 2px solid #d1d5db; }
          .footer { margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 8px; display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${t.title}</div>
            <div class="subtitle">${t.subtitle}</div>
          </div>
          <div style="text-align: ${isRtl ? "left" : "right"};">
            <div style="font-weight: 700;">Paperless Enterprise</div>
            <div style="font-size: 10px; color: #6b7280;">${t.printed} ${new Date().toLocaleString()}</div>
          </div>
        </div>

        <div class="customer-box">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <div>
              <span style="font-size: 14px; font-weight: bold;">${customer.business_name}</span>
              <span style="font-family: monospace; font-size: 11px; color: #4b5563; margin-left: 8px;">(${customer.code})</span>
            </div>
            <div>
              <span style="font-size: 11px; color: #4b5563;">${t.creditLimit}:</span>
              <span style="font-weight: 600; font-family: monospace;">PKR ${customer.credit_limit.toLocaleString()}</span>
            </div>
          </div>
          <div style="font-size: 11px; color: #4b5563; margin-top: 4px;">
            ${t.phone}: ${customer.phone} ${customer.city ? `• ${customer.city}` : ""}
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">${t.openingBal}</div>
            <div class="kpi-val">PKR ${summary.opening_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${t.totalDebit}</div>
            <div class="kpi-val">PKR ${summary.total_debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${t.totalCredit}</div>
            <div class="kpi-val" style="color: #059669;">PKR ${summary.total_credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi-card" style="border-color: #f59e0b; background: #fffbeb;">
            <div class="kpi-label" style="color: #b45309;">${t.closingBal}</div>
            <div class="kpi-val" style="color: #b45309;">PKR ${summary.closing_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 120px;">${t.dateCol}</th>
              <th style="width: 110px;">${t.refCol}</th>
              <th>${t.descCol}</th>
              <th style="width: 110px; text-align: ${isRtl ? "left" : "right"};">${t.debitCol}</th>
              <th style="width: 110px; text-align: ${isRtl ? "left" : "right"};">${t.creditCol}</th>
              <th style="width: 120px; text-align: ${isRtl ? "left" : "right"};">${t.balCol}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #6b7280;">${t.noTx}</td></tr>`}
          </tbody>
        </table>

        <div class="footer">
          <div>${t.footerSub}</div>
          <div>${t.footer}</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 150);
          }
        </script>
      </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <IconFileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <span>Customer Ledger Statement</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {customer.code}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {customer.business_name} • {customer.phone}
                </DialogDescription>
              </div>
            </div>

            {/* Quick Action in Header */}
            {onOpenReceivePayment && (
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold"
                onClick={() => {
                  onClose();
                  onOpenReceivePayment(customer);
                }}
              >
                <IconCash className="h-4 w-4" />
                Receive Payment
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Date Filter Chips & Refresh (Seamless without full modal reload) */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground mr-1">Period:</span>
            <Button
              type="button"
              size="sm"
              variant={preset === "all" ? "default" : "outline"}
              className="h-7 text-xs px-2.5 transition-all"
              onClick={() => handlePresetChange("all")}
            >
              All Time
            </Button>
            <Button
              type="button"
              size="sm"
              variant={preset === "this_month" ? "default" : "outline"}
              className="h-7 text-xs px-2.5 transition-all"
              onClick={() => handlePresetChange("this_month")}
            >
              This Month
            </Button>
            <Button
              type="button"
              size="sm"
              variant={preset === "last_30" ? "default" : "outline"}
              className="h-7 text-xs px-2.5 transition-all"
              onClick={() => handlePresetChange("last_30")}
            >
              Last 30 Days
            </Button>
            <Button
              type="button"
              size="sm"
              variant={preset === "this_week" ? "default" : "outline"}
              className="h-7 text-xs px-2.5 transition-all"
              onClick={() => handlePresetChange("this_week")}
            >
              This Week
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => loadLedgerData(preset, false)}
            disabled={isFetching}
          >
            <IconRefresh className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* KPI Summary Cards (Values transition smoothly without collapsing) */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 transition-opacity duration-200 ${isFetching ? "opacity-75" : "opacity-100"}`}>
          <Card className="border bg-muted/30">
            <CardContent className="p-3">
              <div className="text-[11px] text-muted-foreground uppercase font-semibold">Opening Balance</div>
              <div className="text-base font-bold font-mono mt-0.5">
                PKR {summary ? summary.opening_balance.toLocaleString(undefined, { minimumFractionDigits: 0 }) : "0"}
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-muted/30">
            <CardContent className="p-3">
              <div className="text-[11px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
                <IconArrowUpRight className="h-3.5 w-3.5 text-blue-500" />
                Total Billed (Debits)
              </div>
              <div className="text-base font-bold font-mono mt-0.5 text-foreground">
                PKR {summary ? summary.total_debit.toLocaleString(undefined, { minimumFractionDigits: 0 }) : "0"}
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-muted/30">
            <CardContent className="p-3">
              <div className="text-[11px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
                <IconArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
                Total Paid (Credits)
              </div>
              <div className="text-base font-bold font-mono mt-0.5 text-emerald-600 dark:text-emerald-400">
                PKR {summary ? summary.total_credit.toLocaleString(undefined, { minimumFractionDigits: 0 }) : "0"}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-3">
              <div className="text-[11px] text-amber-700 dark:text-amber-400 uppercase font-semibold">
                Net Closing Baqaya
              </div>
              <div className="text-base font-bold font-mono mt-0.5 text-amber-700 dark:text-amber-400">
                PKR {summary ? summary.closing_balance.toLocaleString(undefined, { minimumFractionDigits: 0 }) : "0"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ledger Transactions Table */}
        <div className={`flex-1 overflow-auto rounded-lg border my-2 transition-opacity duration-200 ${isFetching ? "opacity-75" : "opacity-100"}`}>
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                <TableHead className="w-[130px] text-xs">Date</TableHead>
                <TableHead className="w-[120px] text-xs">Reference</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-right text-xs w-[120px]">Debit (+Billed)</TableHead>
                <TableHead className="text-right text-xs w-[120px]">Credit (-Paid)</TableHead>
                <TableHead className="text-right text-xs w-[130px]">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <IconRefresh className="h-4 w-4 animate-spin text-primary" />
                      Loading ledger statement...
                    </div>
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                    No transactions found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const isInv = entry.entry_type === "invoice";
                  return (
                    <TableRow key={`${entry.entry_type}-${entry.id}`}>
                      <TableCell className="text-xs font-mono">
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold">
                        <Badge
                          variant={isInv ? "secondary" : "outline"}
                          className={`text-[10px] font-mono ${
                            !isInv ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : ""
                          }`}
                        >
                          {entry.reference}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">{entry.description}</div>
                        {entry.notes && (
                          <div className="text-[11px] text-muted-foreground">{entry.notes}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-medium">
                        {entry.debit > 0 ? `PKR ${entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {entry.credit > 0 ? `PKR ${entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-bold">
                        PKR ${entry.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Actions with Receipt Language Mode */}
        <DialogFooter className="pt-2 border-t flex flex-col sm:flex-row sm:justify-between items-center gap-2 w-full">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Language Mode Selector */}
            <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
              <Button
                type="button"
                size="sm"
                variant={language === "bilingual" ? "default" : "ghost"}
                className="h-7 text-xs px-2"
                onClick={() => setLanguage("bilingual")}
              >
                🌐 Bilingual
              </Button>
              <Button
                type="button"
                size="sm"
                variant={language === "ur" ? "default" : "ghost"}
                className="h-7 text-xs px-2"
                onClick={() => setLanguage("ur")}
              >
                🇵🇰 Urdu
              </Button>
              <Button
                type="button"
                size="sm"
                variant={language === "en" ? "default" : "ghost"}
                className="h-7 text-xs px-2"
                onClick={() => setLanguage("en")}
              >
                🇬🇧 English
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendWhatsAppStatement}
              disabled={!ledger || initialLoading}
              className="h-8 gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs"
            >
              <IconBrandWhatsapp className="h-4 w-4" />
              WhatsApp Statement
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintLedger}
              disabled={!ledger || initialLoading}
              className="h-8 gap-1.5 text-xs"
            >
              <IconPrinter className="h-4 w-4" />
              Print Ledger (A4)
            </Button>
          </div>

          <Button type="button" size="sm" onClick={onClose} className="h-8 text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
