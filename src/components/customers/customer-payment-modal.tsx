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
  type CustomerItem,
  type CustomerPaymentItem,
} from "@/services/party.service";

export type ReceiptLanguage = "bilingual" | "ur" | "en";
export type PaperWidth = "80mm" | "58mm";

interface CustomerPaymentModalProps {
  customer: CustomerItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (payment: CustomerPaymentItem) => void;
}

export function CustomerPaymentModal({
  customer,
  isOpen,
  onClose,
  onSuccess,
}: CustomerPaymentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [language, setLanguage] = useState<ReceiptLanguage>("en");
  const [paperWidth, setPaperWidth] = useState<PaperWidth>("80mm");
  const [loading, setLoading] = useState<boolean>(false);
  const [successPayment, setSuccessPayment] = useState<CustomerPaymentItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setPaymentMethod("cash");
      setReferenceNumber("");
      setNotes("");
      setSuccessPayment(null);
    }
  }, [isOpen, customer?.id]);

  if (!customer) return null;

  const currentBalance = Number(customer.current_balance) || 0;
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
      const res = await partyService.recordCustomerPayment(customer.id, {
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
      toast.error(err?.message || "Failed to record customer payment.");
    } finally {
      setLoading(false);
    }
  };

  const formatBalanceText = (val: number, lang: ReceiptLanguage) => {
    const absVal = Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2 });
    if (val < 0) {
      if (lang === "ur") return `PKR ${absVal} (ایڈوانس / جمع)`;
      if (lang === "en") return `PKR ${absVal} (Advance / Credit)`;
      return `PKR ${absVal} (Advance / ایڈوانس)`;
    }
    return `PKR ${absVal}`;
  };

  const handleSendWhatsApp = () => {
    if (!successPayment) return;
    const phone = customer.whatsapp_number || customer.phone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "").replace(/^0/, "92");
    const amountStr = Number(successPayment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 });
    const prevBalStr = formatBalanceText(Number(successPayment.previous_balance), language);
    const newBalStr = formatBalanceText(Number(successPayment.new_balance), language);
    const dateStr = new Date(successPayment.created_at).toLocaleDateString();

    let message = "";
    if (language === "en") {
      message = `*🧾 CASH RECEIPT VOUCHER*
*Voucher #:* ${successPayment.voucher_number}
*Date:* ${dateStr}
--------------------------------
*Customer:* ${customer.business_name}
*Account Code:* ${customer.code}
--------------------------------
*Received Amount:* PKR ${amountStr}
*Payment Method:* ${successPayment.payment_method.toUpperCase()}
${successPayment.reference_number ? `*Ref / Txn #:* ${successPayment.reference_number}\n` : ""}*Previous Balance:* ${prevBalStr}
*Remaining Balance:* ${newBalStr}
--------------------------------
Thank you for your payment!`;
    } else if (language === "ur") {
      message = `*🧾 رسید وصولی (CASH VOUCHER)*
*واؤچر نمبر:* ${successPayment.voucher_number}
*تاریخ:* ${dateStr}
--------------------------------
*گاہک / دکان:* ${customer.business_name}
*کھاتہ نمبر:* ${customer.code}
--------------------------------
*وصول شدہ رقم:* PKR ${amountStr}
*ادائیگی طریقہ:* ${successPayment.payment_method.toUpperCase()}
${successPayment.reference_number ? `*حوالہ نمبر:* ${successPayment.reference_number}\n` : ""}*سابقہ بقایا:* ${prevBalStr}
*نیا بقایا:* ${newBalStr}
--------------------------------
شکریہ برائے بروقت ادائیگی۔`;
    } else {
      // Bilingual
      message = `*🧾 CASH RECEIPT VOUCHER (رسید وصولی)*
*Voucher #:* ${successPayment.voucher_number}
*Date:* ${dateStr}
--------------------------------
*Customer / گاہک:* ${customer.business_name}
*Code / کوڈ:* ${customer.code}
--------------------------------
*Received Amount (وصول):* PKR ${amountStr}
*Payment Method:* ${successPayment.payment_method.toUpperCase()}
${successPayment.reference_number ? `*Ref / Txn #:* ${successPayment.reference_number}\n` : ""}*Previous Balance (سابقہ بقایا):* ${prevBalStr}
*Remaining Balance (نیا بقایا):* ${newBalStr}
--------------------------------
Thank you for your business!
شکریہ برائے بروقت ادائیگی۔`;
    }

    const encoded = encodeURIComponent(message);
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, "_blank");
  };

  // Invisible iframe printing engine: opens print preview on main screen at 100% full size and sharpness
  const handlePrintSlip = () => {
    if (!successPayment) return;

    const existingFrame = document.getElementById("voucher-print-iframe");
    if (existingFrame) existingFrame.remove();

    const is80 = paperWidth === "80mm";
    const iframe = document.createElement("iframe");
    iframe.id = "voucher-print-iframe";
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
          ? "رسید وصولی"
          : language === "bilingual"
          ? "CASH RECEIPT VOUCHER"
          : "CASH RECEIPT VOUCHER",
      subtitle:
        language === "ur"
          ? "ادھار وصولی سلپ"
          : language === "bilingual"
          ? "رسید وصولی"
          : "Payment Acknowledgment",
      customer:
        language === "ur"
          ? "گاہک / دکان:"
          : language === "bilingual"
          ? "Customer / گاہک:"
          : "Customer:",
      code:
        language === "ur"
          ? "کھاتہ نمبر:"
          : language === "bilingual"
          ? "Account Code / کوڈ:"
          : "Account Code:",
      contact:
        language === "ur"
          ? "رابطہ فون:"
          : language === "bilingual"
          ? "Contact / فون:"
          : "Contact:",
      boxTitle:
        language === "ur"
          ? "وصول شدہ رقم"
          : language === "bilingual"
          ? "AMOUNT RECEIVED / وصول شدہ رقم"
          : "AMOUNT RECEIVED",
      method:
        language === "ur"
          ? "طریقہ:"
          : language === "bilingual"
          ? "Method / طریقہ:"
          : "Method:",
      prevBal:
        language === "ur"
          ? "سابقہ بقایا:"
          : language === "bilingual"
          ? "Previous Balance / سابقہ بقایا:"
          : "Previous Balance:",
      newBal:
        language === "ur"
          ? "نیا بقایا:"
          : language === "bilingual"
          ? "Remaining Balance / نیا بقایا:"
          : "Remaining Balance:",
      ref:
        language === "ur"
          ? "حوالہ نمبر:"
          : language === "bilingual"
          ? "Ref / Cheque #:"
          : "Ref / Cheque #:",
      notes:
        language === "ur"
          ? "نوٹ:"
          : language === "bilingual"
          ? "Notes / تفصیل:"
          : "Notes:",
      footer:
        language === "ur"
          ? "شکریہ برائے بروقت ادائیگی۔"
          : language === "bilingual"
          ? "Thank you for your payment!<br/>شکریہ برائے بروقت ادائیگی۔"
          : "Thank you for your payment!",
      subFooter:
        language === "ur"
          ? "کمپیوٹرائزڈ رسید"
          : language === "bilingual"
          ? "Software Generated Slip"
          : "Software Generated Slip",
    };

    const prevBalFormatted = formatBalanceText(Number(successPayment.previous_balance), language);
    const newBalFormatted = formatBalanceText(Number(successPayment.new_balance), language);

    const isRtl = language === "ur";

    const html = `
      <!DOCTYPE html>
      <html dir="${isRtl ? "rtl" : "ltr"}">
      <head>
        <title>Receipt - ${successPayment.voucher_number}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: ${is80 ? "80mm" : "58mm"} auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            width: ${is80 ? "74mm" : "50mm"};
            margin: 0 auto;
            padding: ${is80 ? "10px 4px" : "6px 2px"};
            font-size: ${is80 ? "11px" : "9.5px"};
            line-height: 1.35;
            color: #000;
            background: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-bottom: 1px dashed #000; margin: ${is80 ? "7px" : "5px"} 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: ${is80 ? "4px" : "3px"}; align-items: baseline; }
          .voucher-title { font-size: ${is80 ? "15px" : "13px"}; font-weight: 800; letter-spacing: 0.5px; }
          .voucher-sub { font-size: ${is80 ? "11px" : "9px"}; font-weight: 600; margin-top: 1px; }
          .voucher-no { font-family: monospace; font-size: ${is80 ? "11px" : "9.5px"}; font-weight: bold; margin-top: 3px; }
          .voucher-date { font-size: ${is80 ? "9px" : "8px"}; color: #444; margin-top: 2px; }
          .amount-box { border: 1.5px solid #000; border-radius: 4px; padding: ${is80 ? "7px 4px" : "5px 3px"}; text-align: center; margin: ${is80 ? "8px" : "6px"} 0; }
          .amount-title { font-size: ${is80 ? "10px" : "8.5px"}; font-weight: 700; text-transform: uppercase; }
          .amount-val { font-size: ${is80 ? "17px" : "14px"}; font-weight: 800; font-family: monospace; margin: 2px 0; }
          .amount-method { font-size: ${is80 ? "10px" : "8.5px"}; }
          .footer { font-size: ${is80 ? "10px" : "8.5px"}; margin-top: 8px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="voucher-title">${t.title}</div>
          <div class="voucher-sub">${t.subtitle}</div>
          <div class="voucher-no">${successPayment.voucher_number}</div>
          <div class="voucher-date">${new Date(successPayment.created_at).toLocaleString()}</div>
        </div>

        <div class="divider"></div>

        <div class="row">
          <span>${t.customer}</span>
          <span class="bold">${customer.business_name}</span>
        </div>
        <div class="row">
          <span>${t.code}</span>
          <span style="font-family: monospace;">${customer.code}</span>
        </div>
        ${customer.phone ? `<div class="row"><span>${t.contact}</span><span>${customer.phone}</span></div>` : ""}

        <div class="divider"></div>

        <div class="amount-box">
          <div class="amount-title">${t.boxTitle}</div>
          <div class="amount-val">PKR ${Number(successPayment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div class="amount-method">${t.method} <b>${successPayment.payment_method.toUpperCase()}</b></div>
        </div>

        <div class="row">
          <span>${t.prevBal}</span>
          <span>${prevBalFormatted}</span>
        </div>
        <div class="row" style="font-size: 12px; padding-top: 2px;">
          <span class="bold">${t.newBal}</span>
          <span class="bold">${newBalFormatted}</span>
        </div>
        ${successPayment.reference_number ? `<div class="row"><span>${t.ref}</span><span>${successPayment.reference_number}</span></div>` : ""}
        ${successPayment.notes ? `<div style="margin-top: 4px; font-size: 9px;">${t.notes} ${successPayment.notes}</div>` : ""}

        <div class="divider"></div>

        <div class="footer">
          <div>${t.footer}</div>
          <div style="margin-top: 4px; font-size: 8px; color: #555;">${t.subFooter}</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 100);
          };
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleResetAndClose()}>
      <DialogContent className="sm:max-w-[650px] md:max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {successPayment ? (
          /* SUCCESS VOUCHER VIEW */
          <div className="py-2 space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <IconCheck className="h-6 w-6 stroke-[3]" />
              </div>
              <DialogTitle className="text-xl font-bold">Payment Received!</DialogTitle>
              <DialogDescription className="text-sm">
                Voucher <span className="font-mono font-bold text-foreground">{successPayment.voucher_number}</span> has been issued.
              </DialogDescription>
            </div>

            {/* Voucher Card Summary */}
            <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
              <div className="flex justify-between items-center text-sm pb-2 border-b">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-semibold text-foreground">{customer.business_name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Received Amount</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  PKR {Number(successPayment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Payment Mode</span>
                <span className="uppercase font-medium text-foreground">{successPayment.payment_method}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Previous Balance</span>
                <span>{formatBalanceText(Number(successPayment.previous_balance), language)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t">
                <span className="font-medium text-foreground">Remaining Balance</span>
                <span className="font-bold text-foreground">
                  {formatBalanceText(Number(successPayment.new_balance), language)}
                </span>
              </div>
            </div>

            {/* Paper Size Selector (80mm vs 58mm) */}
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-semibold flex items-center justify-between text-muted-foreground">
                <span>Paper Size</span>
                <span className="text-[11px] font-mono text-foreground font-medium">
                  {paperWidth === "80mm" ? "80mm Standard" : "58mm Compact"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={paperWidth === "80mm" ? "default" : "outline"}
                  className="text-xs font-medium h-8"
                  onClick={() => setPaperWidth("80mm")}
                >
                  🖨️ 80mm Standard
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={paperWidth === "58mm" ? "default" : "outline"}
                  className="text-xs font-medium h-8"
                  onClick={() => setPaperWidth("58mm")}
                >
                  📱 58mm Compact
                </Button>
              </div>
            </div>

            {/* Receipt Language Mode Selector */}
            <div className="space-y-1.5 pt-0.5">
              <div className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                <IconLanguage className="h-4 w-4 text-primary" />
                <span>Receipt Language Mode</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={language === "bilingual" ? "default" : "outline"}
                  className="text-xs font-medium h-8"
                  onClick={() => setLanguage("bilingual")}
                >
                  🌐 Bilingual
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={language === "ur" ? "default" : "outline"}
                  className="text-xs font-medium h-8"
                  onClick={() => setLanguage("ur")}
                >
                  🇵🇰 Urdu
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={language === "en" ? "default" : "outline"}
                  className="text-xs font-medium h-8"
                  onClick={() => setLanguage("en")}
                >
                  🇬🇧 English
                </Button>
              </div>
            </div>

            {/* Instant Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                className="w-full gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                onClick={handleSendWhatsApp}
              >
                <IconBrandWhatsapp className="h-4 w-4" />
                WhatsApp Slip
              </Button>
              <Button
                variant="outline"
                className="w-full gap-1.5"
                onClick={handlePrintSlip}
              >
                <IconPrinter className="h-4 w-4" />
                Print Voucher
              </Button>
            </div>

            <Button
              className="w-full mt-2"
              onClick={handleResetAndClose}
            >
              Done / Close
            </Button>
          </div>
        ) : (
          /* PAYMENT ENTRY FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <IconReceipt2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">Receive Khata Payment</DialogTitle>
                  <DialogDescription className="text-xs">
                    Payment voucher & customer balance adjustment
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Customer Header Info */}
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-foreground text-sm">{customer.business_name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{customer.code} • {customer.phone}</div>
                </div>
                <Badge
                  variant={currentBalance > 0 ? "destructive" : "secondary"}
                  className="font-mono text-xs"
                >
                  PKR {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </Badge>
              </div>
              {customer.credit_limit > 0 && (
                <div className="text-[11px] text-muted-foreground flex justify-between pt-1 border-t border-border/50">
                  <span>Credit Limit: PKR {customer.credit_limit.toLocaleString()}</span>
                  <span>{customer.is_credit_blocked ? "⚠️ Credit Blocked" : "Active Credit"}</span>
                </div>
              )}
            </div>

            {/* Quick Amount Chips */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-medium text-muted-foreground">Quick Amount Fill</Label>
                {currentBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(currentBalance)}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Full Balance
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentBalance > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5 font-mono"
                    onClick={() => handleQuickAmount(currentBalance)}
                  >
                    Full: {currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Button>
                )}
                {[5000, 10000, 25000, 50000].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2 font-mono"
                    onClick={() => handleQuickAmount(val)}
                  >
                    {val.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Amount Received Input */}
            <div className="space-y-1">
              <Label htmlFor="receivedAmount" className="text-xs font-semibold">
                Amount Received (PKR) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="receivedAmount"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  autoFocus
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-10 text-base font-semibold font-mono pr-12"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">
                  PKR
                </span>
              </div>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Current Balance:</span>
                <span className="font-mono">PKR {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-semibold text-foreground">
                <span>After Payment:</span>
                <span className={`font-mono ${remainingBalance <= 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-foreground"}`}>
                  PKR {remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {numAmount > currentBalance && currentBalance > 0 && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-1">
                  <IconAlertCircle className="h-3 w-3" />
                  Amount exceeds outstanding balance. Advance of PKR {(numAmount - currentBalance).toLocaleString()} will be recorded.
                </div>
              )}
            </div>

            {/* Payment Method & Reference */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="paymentMethod" className="text-xs font-medium">
                  Payment Method
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod" className="h-9 text-xs">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Cash in Hand</SelectItem>
                    <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                    <SelectItem value="cheque">📄 Cheque</SelectItem>
                    <SelectItem value="raast">⚡ Raast / Online</SelectItem>
                    <SelectItem value="easypaisa">📱 Easypaisa / JazzCash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="refNo" className="text-xs font-medium">
                  Ref / Cheque # (Optional)
                </Label>
                <Input
                  id="refNo"
                  placeholder="e.g. CHQ-4982 / TxnID"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label htmlFor="paymentNotes" className="text-xs font-medium text-muted-foreground">
                Remarks / Notes (Optional)
              </Label>
              <Input
                id="paymentNotes"
                placeholder="e.g. Received via salesman Farhan"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetAndClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading || numAmount <= 0}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    <IconCash className="h-4 w-4" />
                    Receive PKR {numAmount > 0 ? numAmount.toLocaleString() : "0"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
