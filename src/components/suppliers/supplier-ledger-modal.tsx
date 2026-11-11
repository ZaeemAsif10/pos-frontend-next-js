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
  IconBuildingBank,
  IconCreditCard,
} from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  type SupplierItem,
  type SupplierLedgerResponse,
} from "@/services/party.service";

export type ReceiptLanguage = "bilingual" | "ur" | "en";
type DateFilterPreset = "all" | "this_month" | "last_30" | "this_week";

interface SupplierLedgerModalProps {
  supplier: SupplierItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPaySupplier?: (supplier: SupplierItem) => void;
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
      title: "سپلائر کھاتہ اسٹیٹمنٹ",
      subtitle: "تصدیق شدہ کھاتہ تفصیل • وینڈر / مل اسٹیٹمنٹ",
      supplier: "سپلائر / مل",
      code: "کھاتہ نمبر",
      terms: "ادھار مدت",
      phone: "رابطہ فون",
      openingBal: "سابقہ واجب الادا",
      totalPurchases: "کل خریداری (بل)",
      totalPaid: "کل ادا شدہ رقم",
      closingBal: "موجودہ حتمی واجب الادا",
      dateCol: "تاریخ و وقت",
      refCol: "حوالہ نمبر",
      descCol: "تفصیل",
      paidCol: "ادائیگی (-رقم)",
      purchaseCol: "خریداری (+بل)",
      balCol: "واجب الادا بقایا",
      noTx: "اس مدت میں کوئی لین دین نہیں پایا گیا۔",
      footer: "ادائیگی کامیابی سے درج کی گئی۔",
      footerSub: "کمپیوٹرائزڈ کھاتہ اسٹیٹمنٹ",
      printed: "پرنٹ تاریخ:",
    };
  }
  if (lang === "bilingual") {
    return {
      title: "SUPPLIER LEDGER STATEMENT / سپلائر کھاتہ اسٹیٹمنٹ",
      subtitle: "Verified Mill & Vendor Statement • تصدیق شدہ کھاتہ تفصیل",
      supplier: "Supplier / سپلائر",
      code: "Supplier Code / کوڈ",
      terms: "Payment Terms / ادھار مدت",
      phone: "Phone / فون",
      openingBal: "Opening Balance / سابقہ واجب الادا",
      totalPurchases: "Total Purchases / کل خریداری",
      totalPaid: "Total Paid / کل ادا شدہ",
      closingBal: "Net Payable / حتمی واجب الادا",
      dateCol: "Date & Time / تاریخ",
      refCol: "Reference / حوالہ",
      descCol: "Description / تفصیل",
      paidCol: "Paid (-Payment)",
      purchaseCol: "Purchased (+Bill)",
      balCol: "Balance / بقایا",
      noTx: "No transactions found in this period / اس مدت میں کوئی لین دین نہیں",
      footer: "Thank you for your business! • شکریہ برائے بروقت لین دین۔",
      footerSub: "System Generated Commercial Statement",
      printed: "Printed:",
    };
  }
  // English default
  return {
    title: "SUPPLIER LEDGER STATEMENT",
    subtitle: "Verified Procurement & Vendor Account Statement",
    supplier: "Supplier / Mill",
    code: "Supplier Code",
    terms: "Payment Terms",
    phone: "Phone",
    openingBal: "Opening Balance",
    totalPurchases: "Total Purchases (Bills)",
    totalPaid: "Total Paid (Payments)",
    closingBal: "Net Closing Payable",
    dateCol: "Date & Time",
    refCol: "Reference",
    descCol: "Description",
    paidCol: "Paid (-Paid)",
    purchaseCol: "Purchase (+Bill)",
    balCol: "Running Balance",
    noTx: "No transactions found for the selected period.",
    footer: "Commercial Procurement Statement",
    footerSub: "This is a system generated statement of accounts.",
    printed: "Printed:",
  };
};

export function SupplierLedgerModal({
  supplier,
  isOpen,
  onClose,
  onOpenPaySupplier,
}: SupplierLedgerModalProps) {
  const [ledger, setLedger] = useState<SupplierLedgerResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [preset, setPreset] = useState<DateFilterPreset>("all");
  const [language, setLanguage] = useState<ReceiptLanguage>("en");

  const loadLedgerData = async (targetPreset: DateFilterPreset, isInitial = false) => {
    if (!supplier) return;
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setIsFetching(true);
    }

    try {
      const range = computeDateRange(targetPreset);
      const data = await partyService.getSupplierLedger(supplier.id, range);
      setLedger(data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load supplier ledger statement.");
    } finally {
      setInitialLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen && supplier) {
      setPreset("all");
      loadLedgerData("all", true);
    }
  }, [isOpen, supplier?.id]);

  if (!supplier) return null;

  const handlePresetChange = (newPreset: DateFilterPreset) => {
    if (newPreset === preset && !isFetching) return;
    setPreset(newPreset);
    loadLedgerData(newPreset, false);
  };

  const summary = ledger?.summary;
  const entries = ledger?.entries || [];

  const handleSendWhatsAppStatement = () => {
    if (!ledger || !summary) return;
    const phone = supplier.phone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "").replace(/^0/, "92");
    const dateStr = new Date().toLocaleDateString();

    let txLines = "";
    const recent = entries.slice(-5);

    if (language === "ur") {
      recent.forEach((e) => {
        const dStr = new Date(e.date).toLocaleDateString();
        if (e.entry_type === "purchase") {
          txLines += `• ${dStr} | خریداری #${e.reference} | +PKR ${e.credit.toLocaleString()} (بقایا: PKR ${e.balance.toLocaleString()})\n`;
        } else {
          txLines += `• ${dStr} | ادائیگی #${e.reference} | -PKR ${e.debit.toLocaleString()} (بقایا: PKR ${e.balance.toLocaleString()})\n`;
        }
      });

      const message = `*📊 سپلائر کھاتہ اسٹیٹمنٹ (SUPPLIER STATEMENT)*
*سپلائر / مل:* ${supplier.company_name}
*کھاتہ نمبر:* ${supplier.code}
*تاریخ:* ${dateStr}
--------------------------------
*سابقہ واجب الادا:* PKR ${summary.opening_balance.toLocaleString()}
*کل خریداری (بل):* PKR ${summary.total_purchases.toLocaleString()}
*کل ادا شدہ رقم:* PKR ${summary.total_paid.toLocaleString()}
*حتمی واجب الادا رقم:* PKR ${summary.closing_balance.toLocaleString()}
--------------------------------
*حالیہ لین دین:*
${txLines || "اس مدت میں کوئی لین دین نہیں پایا گیا۔\n"}--------------------------------
کمپیوٹرائزڈ کھاتہ اسٹیٹمنٹ`;

      const encoded = encodeURIComponent(message);
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
      window.open(waUrl, "_blank");
    } else if (language === "bilingual") {
      recent.forEach((e) => {
        const dStr = new Date(e.date).toLocaleDateString();
        if (e.entry_type === "purchase") {
          txLines += `• ${dStr} | Purchase #${e.reference} | +PKR ${e.credit.toLocaleString()} (Bal: PKR ${e.balance.toLocaleString()})\n`;
        } else {
          txLines += `• ${dStr} | Payment #${e.reference} | -PKR ${e.debit.toLocaleString()} (Bal: PKR ${e.balance.toLocaleString()})\n`;
        }
      });

      const message = `*📊 SUPPLIER LEDGER STATEMENT (سپلائر کھاتہ)*
*Supplier / سپلائر:* ${supplier.company_name}
*Code / کوڈ:* ${supplier.code}
*Date:* ${dateStr}
--------------------------------
*Opening Balance (سابقہ):* PKR ${summary.opening_balance.toLocaleString()}
*Total Purchases (کل خریداری):* PKR ${summary.total_purchases.toLocaleString()}
*Total Paid (کل ادائیگی):* PKR ${summary.total_paid.toLocaleString()}
*Net Balance (حتمی واجب الادا):* PKR ${summary.closing_balance.toLocaleString()}
--------------------------------
*Recent Transactions / حالیہ لین دین:*
${txLines || "No transactions in this period.\n"}--------------------------------
Commercial Account Statement`;

      const encoded = encodeURIComponent(message);
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
      window.open(waUrl, "_blank");
    } else {
      // English
      recent.forEach((e) => {
        const dStr = new Date(e.date).toLocaleDateString();
        if (e.entry_type === "purchase") {
          txLines += `• ${dStr} | Bill #${e.reference} | +PKR ${e.credit.toLocaleString()} (Bal: PKR ${e.balance.toLocaleString()})\n`;
        } else {
          txLines += `• ${dStr} | CPV #${e.reference} | -PKR ${e.debit.toLocaleString()} (Bal: PKR ${e.balance.toLocaleString()})\n`;
        }
      });

      const message = `*📊 SUPPLIER STATEMENT OF ACCOUNT*
*Supplier:* ${supplier.company_name}
*Account Code:* ${supplier.code}
*Date:* ${dateStr}
--------------------------------
*Opening Balance:* PKR ${summary.opening_balance.toLocaleString()}
*Total Purchases:* PKR ${summary.total_purchases.toLocaleString()}
*Total Paid:* PKR ${summary.total_paid.toLocaleString()}
*Net Payable:* PKR ${summary.closing_balance.toLocaleString()}
--------------------------------
*Recent Entries:*
${txLines || "No transactions recorded in this period.\n"}--------------------------------
Thank you for your business.`;

      const encoded = encodeURIComponent(message);
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
      window.open(waUrl, "_blank");
    }
  };

  // Hidden DOM iframe A4 printing engine
  const handlePrintLedger = () => {
    if (!ledger || !summary) return;

    const existingFrame = document.getElementById("supplier-ledger-print-iframe");
    if (existingFrame) existingFrame.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "supplier-ledger-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "210mm";
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

    const labels = getLabels(language);
    const isRtl = language === "ur";

    const rowsHtml = entries
      .map(
        (e) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">
            ${new Date(e.date).toLocaleString()}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 11px;">
            ${e.reference}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">
            <strong>${e.description}</strong>
            ${e.notes ? `<div style="font-size: 10px; color: #6b7280;">${e.notes}</div>` : ""}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #16a34a; font-weight: 600; font-size: 11px;">
            ${e.debit > 0 ? `PKR ${e.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626; font-weight: 600; font-size: 11px;">
            ${e.credit > 0 ? `PKR ${e.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 700; font-size: 11px;">
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
        <title>Supplier Ledger - ${supplier.company_name}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 12mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: Arial, 'Noto Nastaliq Urdu', sans-serif;
            color: #111827;
            background: #fff;
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #111827;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .title { font-size: 20px; font-weight: bold; }
          .subtitle { font-size: 11px; color: #4b5563; margin-top: 2px; }
          .meta-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 10px 14px;
            border-radius: 6px;
            margin-bottom: 16px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 18px;
          }
          .summary-card {
            border: 1px solid #e5e7eb;
            padding: 8px 12px;
            border-radius: 6px;
            background: #fff;
          }
          .summary-label { font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
          .summary-val { font-size: 14px; font-weight: bold; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th {
            background: #f3f4f6;
            padding: 8px;
            font-size: 11px;
            font-weight: 700;
            text-align: left;
            border-bottom: 2px solid #d1d5db;
          }
          .footer-sig {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          .sig-box {
            border-top: 1px solid #9ca3af;
            width: 180px;
            text-align: center;
            padding-top: 4px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${labels.title}</div>
            <div class="subtitle">${labels.subtitle}</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #6b7280;">
            <div>${labels.printed} ${new Date().toLocaleString()}</div>
            <div style="font-weight: bold; color: #111827; margin-top: 2px;">PAPERLESS ERP & POS</div>
          </div>
        </div>

        <div class="meta-box">
          <div>
            <div><strong>${labels.supplier}:</strong> ${supplier.company_name}</div>
            <div style="margin-top: 3px;"><strong>${labels.code}:</strong> ${supplier.code}</div>
            ${supplier.contact_person ? `<div style="margin-top: 3px;"><strong>Contact Person:</strong> ${supplier.contact_person}</div>` : ""}
          </div>
          <div style="text-align: right;">
            <div><strong>${labels.phone}:</strong> ${supplier.phone || "N/A"}</div>
            <div style="margin-top: 3px;"><strong>${labels.terms}:</strong> ${supplier.payment_terms_days} Days Credit</div>
            ${
              supplier.bank_name
                ? `<div style="margin-top: 3px; font-size: 11px; color: #2563eb;"><strong>Bank:</strong> ${supplier.bank_name} (${supplier.bank_account_number || ""})</div>`
                : ""
            }
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">${labels.openingBal}</div>
            <div class="summary-val">PKR ${summary.opening_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">${labels.totalPurchases}</div>
            <div class="summary-val" style="color: #dc2626;">+PKR ${summary.total_purchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">${labels.totalPaid}</div>
            <div class="summary-val" style="color: #16a34a;">-PKR ${summary.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-card" style="background: #fef2f2; border-color: #fecaca;">
            <div class="summary-label" style="color: #991b1b;">${labels.closingBal}</div>
            <div class="summary-val" style="color: #991b1b;">PKR ${summary.closing_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 18%;">${labels.dateCol}</th>
              <th style="width: 15%;">${labels.refCol}</th>
              <th>${labels.descCol}</th>
              <th style="text-align: right; width: 15%;">${labels.paidCol}</th>
              <th style="text-align: right; width: 15%;">${labels.purchaseCol}</th>
              <th style="text-align: right; width: 16%;">${labels.balCol}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #6b7280;">${labels.noTx}</td></tr>`}
          </tbody>
        </table>

        <div class="footer-sig">
          <div class="sig-box">Prepared By (Accounts)</div>
          <div class="sig-box">Authorized Signatory</div>
          <div class="sig-box">Vendor / Mill Acknowledgment</div>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 8px;">
          ${labels.footerSub} • ${labels.footer}
        </div>
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
      <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <IconFileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
                  <span>{supplier.company_name}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {supplier.code}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs flex flex-wrap items-center gap-2 mt-0.5">
                  <span>Phone: {supplier.phone || "N/A"}</span>
                  <span>•</span>
                  <span>Credit Terms: {supplier.payment_terms_days} Days</span>
                  {supplier.bank_name && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {supplier.bank_name} ({supplier.bank_account_number || "A/C"})
                      </span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2">
              {onOpenPaySupplier && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenPaySupplier(supplier);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 h-8 text-xs font-semibold shadow-2xs"
                >
                  <IconCreditCard className="h-3.5 w-3.5" />
                  Pay Supplier
                </Button>
              )}
            </div>
          </div>

          {/* Controls Bar: Presets + Language + Print + WhatsApp */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t">
            {/* Period Filter Presets */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-md">
              <Button
                type="button"
                variant={preset === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePresetChange("all")}
                className="h-7 text-xs px-2.5 font-medium"
                disabled={isFetching}
              >
                All Time
              </Button>
              <Button
                type="button"
                variant={preset === "this_month" ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePresetChange("this_month")}
                className="h-7 text-xs px-2.5 font-medium"
                disabled={isFetching}
              >
                This Month
              </Button>
              <Button
                type="button"
                variant={preset === "last_30" ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePresetChange("last_30")}
                className="h-7 text-xs px-2.5 font-medium"
                disabled={isFetching}
              >
                Last 30 Days
              </Button>
              <Button
                type="button"
                variant={preset === "this_week" ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePresetChange("this_week")}
                className="h-7 text-xs px-2.5 font-medium"
                disabled={isFetching}
              >
                This Week
              </Button>

              {/* Refresh icon indicator */}
              <button
                type="button"
                onClick={() => loadLedgerData(preset, false)}
                disabled={isFetching}
                className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted ml-0.5"
                title="Refresh ledger"
              >
                <IconRefresh className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
              </button>
            </div>

            {/* Language & Print / WhatsApp Toolbar */}
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <div className="flex items-center border rounded-md p-0.5 bg-card">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`text-[11px] px-2 py-1 rounded font-medium transition-colors ${
                    language === "en"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🇬🇧 En
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("bilingual")}
                  className={`text-[11px] px-2 py-1 rounded font-medium transition-colors ${
                    language === "bilingual"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🌐 Bilingual
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("ur")}
                  className={`text-[11px] px-2 py-1 rounded font-medium transition-colors ${
                    language === "ur"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🇵🇰 Urdu
                </button>
              </div>

              {/* Print A4 Statement Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrintLedger}
                disabled={!ledger || initialLoading}
                className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                <IconPrinter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Print Statement</span>
              </Button>

              {/* WhatsApp Statement Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendWhatsAppStatement}
                disabled={!ledger || initialLoading}
                className="h-8 gap-1.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                <IconBrandWhatsapp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body: Smooth in-place transition */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {initialLoading ? (
            <div className="py-20 text-center space-y-2">
              <IconRefresh className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Loading supplier ledger statement...</p>
            </div>
          ) : (
            <div className={`space-y-4 transition-opacity duration-200 ${isFetching ? "opacity-75" : "opacity-100"}`}>
              {/* 4 Summary Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="shadow-2xs">
                  <CardContent className="p-3.5">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Opening Balance
                    </p>
                    <p className="text-lg font-bold text-foreground mt-1">
                      PKR {Number(summary?.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-2xs">
                  <CardContent className="p-3.5">
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <IconArrowUpRight className="h-3.5 w-3.5" />
                      Total Purchases (Bills)
                    </p>
                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                      +PKR {Number(summary?.total_purchases || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-2xs">
                  <CardContent className="p-3.5">
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <IconArrowDownLeft className="h-3.5 w-3.5" />
                      Total Paid (Payments)
                    </p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      -PKR {Number(summary?.total_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-2xs bg-rose-500/5 border-rose-500/20">
                  <CardContent className="p-3.5">
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      Net Closing Payable
                    </p>
                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                      PKR {Number(summary?.closing_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions Table */}
              <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[150px] text-xs font-semibold">Date & Time</TableHead>
                      <TableHead className="w-[140px] text-xs font-semibold">Reference</TableHead>
                      <TableHead className="text-xs font-semibold">Description</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Paid (-Payment)
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold text-rose-600 dark:text-rose-400">
                        Purchase (+Bill)
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold">
                        Running Balance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                          No transactions found for the selected period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      entries.map((entry) => {
                        const isPayment = entry.entry_type === "payment";
                        return (
                          <TableRow key={`${entry.entry_type}-${entry.id}`}>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {new Date(entry.date).toLocaleString([], {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="text-xs font-mono font-semibold">
                              <Badge
                                variant={isPayment ? "default" : "outline"}
                                className={
                                  isPayment
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-0 text-[10px]"
                                    : "text-[10px] text-rose-600 border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20"
                                }
                              >
                                {entry.reference}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="font-medium text-foreground">{entry.description}</div>
                              {entry.notes && (
                                <p className="text-[11px] text-muted-foreground">{entry.notes}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {entry.debit > 0
                                ? `- PKR ${Number(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                              {entry.credit > 0
                                ? `+ PKR ${Number(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold">
                              PKR {Number(entry.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-muted/30 flex items-center justify-between mt-auto">
          <p className="text-xs text-muted-foreground font-medium">
            Total {entries.length} transaction{entries.length === 1 ? "" : "s"} shown
          </p>
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-8 px-4 text-xs font-medium">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
