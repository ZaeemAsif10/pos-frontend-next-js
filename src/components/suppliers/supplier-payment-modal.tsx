"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import {
  IconCheck,
  IconReceipt2,
  IconBrandWhatsapp,
  IconPrinter,
  IconCash,
  IconBuildingBank,
  IconCreditCard,
  IconArrowRight,
  IconAlertCircle,
  IconLanguage,
  IconBuildingFactory2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  partyService,
  type SupplierItem,
  type SupplierPaymentItem,
} from "@/services/party.service";

export type ReceiptLanguage = "bilingual" | "ur" | "en";
export type PaperWidth = "80mm" | "58mm";

interface SupplierPaymentModalProps {
  supplier: SupplierItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (payment: SupplierPaymentItem) => void;
}

export function SupplierPaymentModal({
  supplier,
  isOpen,
  onClose,
  onSuccess,
}: SupplierPaymentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [language, setLanguage] = useState<ReceiptLanguage>("en");
  const [paperWidth, setPaperWidth] = useState<PaperWidth>("80mm");
  const [loading, setLoading] = useState<boolean>(false);
  const [successPayment, setSuccessPayment] = useState<SupplierPaymentItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setPaymentMethod("cash");
      setReferenceNumber("");
      setNotes("");
      setSuccessPayment(null);
    }
  }, [isOpen, supplier?.id]);

  if (!supplier) return null;

  const currentBalance = Number(supplier.current_balance) || 0;
  const numAmount = parseFloat(amount) || 0;
  const remainingBalance = Math.round((currentBalance - numAmount) * 100) / 100;

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleResetAndClose = () => {
    setAmount("");
    setPaymentMethod("cash");
    setReferenceNumber("");
    setNotes("");
    setSuccessPayment(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await partyService.recordSupplierPayment(supplier.id, {
        amount: numAmount,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || null,
        notes: notes.trim() || null,
      });

      setSuccessPayment(res);
      toast.success(
        `Payment of PKR ${numAmount.toLocaleString()} recorded! Voucher #${res.voucher_number}`
      );
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to record supplier payment.");
    } finally {
      setLoading(false);
    }
  };

  const formatBalanceText = (val: number, lang: ReceiptLanguage) => {
    const absVal = Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2 });
    if (val < 0) {
      if (lang === "ur") return `PKR ${absVal} (ایڈوانس ادا شدہ)`;
      if (lang === "en") return `PKR ${absVal} (Advance Paid)`;
      return `PKR ${absVal} (Advance Paid / ایڈوانس)`;
    }
    return `PKR ${absVal}`;
  };

  const handleSendWhatsApp = () => {
    if (!successPayment) return;
    const phone = supplier.phone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "").replace(/^0/, "92");
    const amountStr = Number(successPayment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 });
    const prevBalStr = formatBalanceText(Number(successPayment.previous_balance), language);
    const newBalStr = formatBalanceText(Number(successPayment.new_balance), language);
    const dateStr = new Date(successPayment.created_at).toLocaleDateString();

    let message = "";
    if (language === "en") {
      message = `*🧾 CASH PAYMENT VOUCHER (CPV)*
*Voucher #:* ${successPayment.voucher_number}
*Date:* ${dateStr}
--------------------------------
*Supplier:* ${supplier.company_name}
*Supplier Code:* ${supplier.code}
--------------------------------
*Paid Amount:* PKR ${amountStr}
*Payment Method:* ${successPayment.payment_method.toUpperCase()}
${successPayment.reference_number ? `*Ref / Txn #:* ${successPayment.reference_number}\n` : ""}*Previous Payable:* ${prevBalStr}
*Remaining Payable:* ${newBalStr}
--------------------------------
Payment processed successfully.`;
    } else if (language === "ur") {
      message = `*🧾 واؤچر ادائیگی (CASH PAYMENT VOUCHER)*
*واؤچر نمبر:* ${successPayment.voucher_number}
*تاریخ:* ${dateStr}
--------------------------------
*سپلائر / مل:* ${supplier.company_name}
*کھاتہ نمبر:* ${supplier.code}
--------------------------------
*ادا شدہ رقم:* PKR ${amountStr}
*ادائیگی طریقہ:* ${successPayment.payment_method.toUpperCase()}
${successPayment.reference_number ? `*حوالہ نمبر:* ${successPayment.reference_number}\n` : ""}*سابقہ واجب الادا:* ${prevBalStr}
*بقیہ واجب الادا:* ${newBalStr}
--------------------------------
ادائیگی کامیابی سے منتقل کر دی گئی ہے۔`;
    } else {
      // Bilingual
      message = `*🧾 CASH PAYMENT VOUCHER (واؤچر ادائیگی)*
*Voucher #:* ${successPayment.voucher_number}
*Date:* ${dateStr}
--------------------------------
*Supplier / سپلائر:* ${supplier.company_name}
*Code / کوڈ:* ${supplier.code}
--------------------------------
*Paid Amount (ادا شدہ رقم):* PKR ${amountStr}
*Payment Method:* ${successPayment.payment_method.toUpperCase()}
${successPayment.reference_number ? `*Ref / Txn #:* ${successPayment.reference_number}\n` : ""}*Previous Payable (سابقہ واجب الادا):* ${prevBalStr}
*Remaining Payable (بقیہ واجب الادا):* ${newBalStr}
--------------------------------
Payment transferred successfully.
ادائیگی کامیابی سے منتقل کر دی گئی ہے۔`;
    }

    const encoded = encodeURIComponent(message);
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, "_blank");
  };

  // Invisible iframe printing engine
  const handlePrintSlip = () => {
    if (!successPayment) return;

    const existingFrame = document.getElementById("supplier-voucher-print-iframe");
    if (existingFrame) existingFrame.remove();

    const is80 = paperWidth === "80mm";
    const iframe = document.createElement("iframe");
    iframe.id = "supplier-voucher-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = is80 ? "80mm" : "58mm";
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

    // Language-specific text labels
    const t = {
      title:
        language === "ur"
          ? "واؤچر ادائیگی (CPV)"
          : language === "bilingual"
          ? "CASH PAYMENT VOUCHER"
          : "CASH PAYMENT VOUCHER",
      subtitle:
        language === "ur"
          ? "سپلائر / وینڈر ادائیگی سلپ"
          : language === "bilingual"
          ? "واؤچر ادائیگی (CPV)"
          : "Supplier / Vendor Payment Voucher",
      supplier:
        language === "ur"
          ? "سپلائر / مل:"
          : language === "bilingual"
          ? "Supplier / سپلائر:"
          : "Supplier:",
      code:
        language === "ur"
          ? "کھاتہ نمبر:"
          : language === "bilingual"
          ? "Supplier Code / کوڈ:"
          : "Supplier Code:",
      contact:
        language === "ur"
          ? "رابطہ فون:"
          : language === "bilingual"
          ? "Contact / فون:"
          : "Contact:",
      boxTitle:
        language === "ur"
          ? "ادا شدہ رقم"
          : language === "bilingual"
          ? "AMOUNT PAID / ادا شدہ رقم"
          : "AMOUNT PAID",
      method:
        language === "ur"
          ? "طریقہ:"
          : language === "bilingual"
          ? "Method / طریقہ:"
          : "Method:",
      prevBal:
        language === "ur"
          ? "سابقہ واجب الادا:"
          : language === "bilingual"
          ? "Previous Payable / سابقہ واجب الادا:"
          : "Previous Payable:",
      newBal:
        language === "ur"
          ? "بقیہ واجب الادا:"
          : language === "bilingual"
          ? "Remaining Payable / بقیہ واجب الادا:"
          : "Remaining Payable:",
      ref:
        language === "ur"
          ? "حوالہ نمبر:"
          : language === "bilingual"
          ? "Ref / Cheque #:"
          : "Ref / Cheque #:",
      bankInfo:
        language === "ur"
          ? "بینک اکاؤنٹ:"
          : language === "bilingual"
          ? "Bank Details / بینک:"
          : "Bank Details:",
      notes:
        language === "ur"
          ? "نوٹ:"
          : language === "bilingual"
          ? "Notes / تفصیل:"
          : "Notes:",
      footer:
        language === "ur"
          ? "ادائیگی کامیابی سے ریکارڈ کر لی گئی۔"
          : language === "bilingual"
          ? "Payment recorded successfully!<br/>ادائیگی کامیابی سے ریکارڈ کر لی گئی۔"
          : "Payment recorded successfully!",
      subFooter:
        language === "ur"
          ? "کمپیوٹرائزڈ واؤچر"
          : language === "bilingual"
          ? "Software Generated CPV"
          : "Software Generated CPV",
    };

    const prevBalFormatted = formatBalanceText(Number(successPayment.previous_balance), language);
    const newBalFormatted = formatBalanceText(Number(successPayment.new_balance), language);
    const isRtl = language === "ur";

    const html = `
      <!DOCTYPE html>
      <html dir="${isRtl ? "rtl" : "ltr"}">
      <head>
        <title>CPV - ${successPayment.voucher_number}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: ${is80 ? "80mm auto" : "58mm auto"};
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace, 'Noto Nastaliq Urdu', Arial, sans-serif;
            width: ${is80 ? "76mm" : "52mm"};
            margin: 0 auto;
            padding: ${is80 ? "4mm 2mm" : "3mm 1mm"};
            color: #000;
            background: #fff;
            font-size: ${is80 ? "11px" : "9.5px"};
            line-height: 1.35;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .divider {
            border-top: 1px dashed #000;
            margin: ${is80 ? "6px 0" : "4px 0"};
          }
          .divider-double {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            height: 2px;
            margin: ${is80 ? "6px 0" : "4px 0"};
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: ${is80 ? "3px" : "2px"};
          }
          .amount-box {
            border: 2px solid #000;
            padding: ${is80 ? "6px 4px" : "4px 2px"};
            margin: ${is80 ? "8px 0" : "5px 0"};
            text-align: center;
          }
          .amount-val {
            font-size: ${is80 ? "17px" : "14px"};
            font-weight: bold;
          }
          .voucher-title {
            font-size: ${is80 ? "14px" : "12px"};
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          .voucher-sub {
            font-size: ${is80 ? "10px" : "8.5px"};
            margin-top: 1px;
          }
          .signatures {
            margin-top: ${is80 ? "18px" : "12px"};
            display: flex;
            justify-content: space-between;
            font-size: ${is80 ? "9px" : "8px"};
          }
          .sig-line {
            border-top: 1px solid #000;
            width: ${is80 ? "28mm" : "20mm"};
            text-align: center;
            padding-top: 2px;
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="voucher-title">${t.title}</div>
          <div class="voucher-sub">${t.subtitle}</div>
        </div>

        <div class="divider"></div>

        <div class="row">
          <span>VOUCHER #:</span>
          <span class="font-bold">${successPayment.voucher_number}</span>
        </div>
        <div class="row">
          <span>DATE & TIME:</span>
          <span>${new Date(successPayment.created_at).toLocaleString()}</span>
        </div>
        ${
          successPayment.paid_by_name
            ? `
          <div class="row">
            <span>PAID BY:</span>
            <span>${successPayment.paid_by_name}</span>
          </div>
          `
            : ""
        }

        <div class="divider"></div>

        <div class="row">
          <span>${t.supplier}</span>
          <span class="font-bold text-right">${supplier.company_name}</span>
        </div>
        <div class="row">
          <span>${t.code}</span>
          <span>${supplier.code}</span>
        </div>
        ${
          supplier.phone
            ? `
          <div class="row">
            <span>${t.contact}</span>
            <span>${supplier.phone}</span>
          </div>
          `
            : ""
        }
        ${
          supplier.bank_name && supplier.bank_account_number
            ? `
          <div class="row">
            <span>${t.bankInfo}</span>
            <span class="text-right">${supplier.bank_name} (${supplier.bank_account_number})</span>
          </div>
          `
            : ""
        }

        <div class="amount-box">
          <div style="font-size: ${is80 ? "10px" : "8.5px"};">${t.boxTitle}</div>
          <div class="amount-val">PKR ${Number(successPayment.amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}</div>
          <div style="font-size: ${is80 ? "9.5px" : "8px"}; margin-top: 2px;">
            ${t.method} <strong>${successPayment.payment_method.toUpperCase()}</strong>
          </div>
        </div>

        ${
          successPayment.reference_number
            ? `
          <div class="row">
            <span>${t.ref}</span>
            <span class="font-bold">${successPayment.reference_number}</span>
          </div>
          `
            : ""
        }

        <div class="divider"></div>

        <div class="row">
          <span>${t.prevBal}</span>
          <span>${prevBalFormatted}</span>
        </div>
        <div class="row">
          <span>Amount Paid / ادا شدہ:</span>
          <span class="font-bold">- PKR ${Number(successPayment.amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}</span>
        </div>
        <div class="divider-double"></div>
        <div class="row font-bold" style="font-size: ${is80 ? "12px" : "10px"};">
          <span>${t.newBal}</span>
          <span>${newBalFormatted}</span>
        </div>

        ${
          successPayment.notes
            ? `
          <div class="divider"></div>
          <div style="font-size: ${is80 ? "9.5px" : "8px"};">
            <span>${t.notes}</span> <span>${successPayment.notes}</span>
          </div>
          `
            : ""
        }

        <div class="signatures">
          <div class="sig-line">Prepared By</div>
          <div class="sig-line">Supplier Signature</div>
        </div>

        <div class="divider"></div>

        <div class="text-center" style="font-size: ${is80 ? "9px" : "7.5px"};">
          <div>${t.footer}</div>
          <div style="margin-top: 2px; color: #555;">${t.subFooter}</div>
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleResetAndClose()}>
      <DialogContent className="sm:max-w-[650px] md:max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {!successPayment ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <IconCreditCard className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg">
                    Pay Supplier
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Record cash, bank transfer, or cheque payment against vendor khata
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Supplier Header Info Card */}
              <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">
                      {supplier.company_name}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      Code: {supplier.code} • Phone: {supplier.phone || "N/A"}
                    </p>
                    {supplier.contact_person && (
                      <p className="text-xs text-muted-foreground">
                        Contact Person: {supplier.contact_person}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {supplier.payment_terms_days} Days Credit
                  </Badge>
                </div>

                {/* Bank details preview for quick EFT transfer */}
                {supplier.bank_name && (
                  <div className="pt-2 border-t border-border/60 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/5 p-2 rounded min-w-0">
                    <IconBuildingBank className="h-4 w-4 shrink-0" />
                    <div className="truncate min-w-0 flex-1">
                      <span className="font-semibold">{supplier.bank_name}: </span>
                      <span>A/C: {supplier.bank_account_number || "N/A"}</span>
                      {supplier.bank_iban && (
                        <span className="ml-1 font-mono text-[11px] text-muted-foreground">
                          (IBAN: {supplier.bank_iban})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs border-t border-border/40">
                  <span className="text-muted-foreground">Outstanding Payable:</span>
                  <span
                    className={`font-bold ${
                      currentBalance > 0
                        ? "text-rose-600 dark:text-rose-400 text-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    PKR {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="payment-amount" className="text-xs font-semibold">
                    Payment Amount (PKR) <span className="text-rose-500">*</span>
                  </Label>
                  {currentBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(currentBalance)}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Pay Full Dues
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">
                    PKR
                  </span>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-12 font-bold text-base"
                    required
                    autoFocus
                  />
                </div>

                {/* Quick Amount Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[5000, 10000, 25000, 50000, 100000].map((val) => (
                    <Button
                      key={val}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(val)}
                      className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                    >
                      +{val.toLocaleString()}
                    </Button>
                  ))}
                  {currentBalance > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(currentBalance)}
                      className="h-6 text-[11px] px-2 text-rose-600 border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20"
                    >
                      Full (PKR {currentBalance.toLocaleString()})
                    </Button>
                  )}
                </div>
              </div>

              {/* Dynamic Balance Preview Card */}
              <div className="rounded-lg border border-dashed p-3 bg-muted/20 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Current Payable:</span>
                  <span>PKR {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-medium text-rose-600 dark:text-rose-400">
                  <span>Paying Now:</span>
                  <span>- PKR {numAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-1.5 border-t flex justify-between font-bold text-sm">
                  <span>Remaining Balance:</span>
                  <span className={remainingBalance < 0 ? "text-blue-600" : "text-foreground"}>
                    {formatBalanceText(remainingBalance, "en")}
                  </span>
                </div>
              </div>

              {/* Payment Method & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="payment-method" className="text-xs">
                    Payment Method
                  </Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment-method" className="h-9 text-xs">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="cheque">📜 Cheque</SelectItem>
                      <SelectItem value="raast">⚡ Raast</SelectItem>
                      <SelectItem value="online">📱 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ref-num" className="text-xs">
                    Reference / Cheque #
                  </Label>
                  <Input
                    id="ref-num"
                    placeholder="e.g. CHQ-48201 / TXN-998"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="payment-notes" className="text-xs">
                  Notes / Remarks (Optional)
                </Label>
                <Input
                  id="payment-notes"
                  placeholder="e.g. Paid against Bill #PUR-2026-0012"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetAndClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || numAmount <= 0}
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    Confirm Payment of PKR {numAmount.toLocaleString()}
                    <IconArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* ==================================================================== */
          /* PAYMENT SUCCESS SCREEN WITH PRINT & WHATSAPP SHARING                 */
          /* ==================================================================== */
          <div className="py-4 space-y-4">
            <div className="text-center space-y-1.5">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <IconCheck className="h-6 w-6 stroke-[2.5]" />
              </div>
              <DialogTitle className="text-lg">Payment Voucher Issued!</DialogTitle>
              <DialogDescription className="text-xs">
                Payment has been successfully posted to supplier khata & cash drawer.
              </DialogDescription>
            </div>

            {/* Voucher Badge Details */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Voucher Number:</span>
                <Badge variant="secondary" className="font-mono text-xs font-bold">
                  {successPayment.voucher_number}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier:</span>
                <span className="font-semibold">{supplier.company_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                  PKR {Number(successPayment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="uppercase font-medium">{successPayment.payment_method}</span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="text-muted-foreground">Remaining Payable:</span>
                <span className="font-bold">
                  {formatBalanceText(Number(successPayment.new_balance), language)}
                </span>
              </div>
            </div>

            {/* Language & Paper Width Options */}
            <div className="rounded-lg border p-3 bg-card space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <IconLanguage className="h-4 w-4 text-primary" />
                  Print & Share Settings
                </span>
              </div>

              {/* Language Selector */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">
                  Print Language:
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    type="button"
                    variant={language === "en" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage("en")}
                    className="h-7 text-xs font-medium"
                  >
                    🇬🇧 English
                  </Button>
                  <Button
                    type="button"
                    variant={language === "bilingual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage("bilingual")}
                    className="h-7 text-xs font-medium"
                  >
                    🌐 Bilingual
                  </Button>
                  <Button
                    type="button"
                    variant={language === "ur" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage("ur")}
                    className="h-7 text-xs font-medium"
                  >
                    🇵🇰 Urdu
                  </Button>
                </div>
              </div>

              {/* Paper Roll Size Selector */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">
                  Paper Roll Size:
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    type="button"
                    variant={paperWidth === "80mm" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaperWidth("80mm")}
                    className="h-7 text-xs font-medium"
                  >
                    🖨️ 80mm Standard POS
                  </Button>
                  <Button
                    type="button"
                    variant={paperWidth === "58mm" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaperWidth("58mm")}
                    className="h-7 text-xs font-medium"
                  >
                    📱 58mm Compact POS
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Actions (Print, WhatsApp, Done) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintSlip}
                className="gap-2 h-10 border-primary/30 text-primary hover:bg-primary/10"
              >
                <IconPrinter className="h-4 w-4" />
                Print Voucher Slip
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendWhatsApp}
                className="gap-2 h-10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
              >
                <IconBrandWhatsapp className="h-4 w-4" />
                Send WhatsApp Slip
              </Button>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                onClick={handleResetAndClose}
                className="w-full"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
