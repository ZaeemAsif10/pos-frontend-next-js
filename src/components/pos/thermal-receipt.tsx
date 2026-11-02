"use client";

import React, { useState } from "react";
import QRCode from "react-qr-code";
import {
  IconPrinter,
  IconBrandWhatsapp,
  IconCheck,
  IconShieldCheck,
  IconBuildingStore,
  IconPhone,
  IconUser,
  IconCalendar,
  IconReceipt,
  IconSparkles,
  IconShare,
  IconDeviceFloppy,
  IconDimensions,
  IconLanguage,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type SalesInvoiceDetail } from "@/services/sales.service";
import { type CustomerItem } from "@/services/party.service";

type PaperWidth = "80mm" | "58mm";
type ReceiptLanguage = "en" | "ur" | "bilingual";

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SalesInvoiceDetail | null;
  customer?: CustomerItem | null;
  shopName?: string;
  branchName?: string;
  branchPhone?: string;
  branchAddress?: string;
  tenantNtn?: string;
  tenantStrn?: string;
}

export function ThermalReceiptModal({
  isOpen,
  onClose,
  invoice,
  customer,
  shopName = "Paperless Enterprise",
  branchName = "Main Branch",
  branchPhone = "+92 300 1234567",
  branchAddress = "Commercial Market, Pakistan",
  tenantNtn = "8923412-1",
  tenantStrn = "3277876123456",
}: ThermalReceiptModalProps) {
  const [paperWidth, setPaperWidth] = useState<PaperWidth>("80mm");
  const [language, setLanguage] = useState<ReceiptLanguage>("bilingual");
  const [customPhone, setCustomPhone] = useState<string>(() => {
    return (
      customer?.whatsapp_number ||
      customer?.phone ||
      invoice?.customer_phone ||
      ""
    );
  });

  if (!invoice) return null;

  // Dedicated iframe printing engine to guarantee sharp thermal slip without blank page
  const handlePrint = () => {
    const printableEl = document.getElementById("thermal-receipt-printable");
    if (!printableEl) {
      window.print();
      return;
    }

    const existingFrame = document.getElementById("thermal-print-iframe");
    if (existingFrame) existingFrame.remove();

    const is80 = paperWidth === "80mm";
    const iframe = document.createElement("iframe");
    iframe.id = "thermal-print-iframe";
    // Non-zero dimensions and proper off-screen positioning so Chromium calculates non-empty print layouts
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

    // Capture application styles so Tailwind typography & borders render identically in print preview
    const headStyles = Array.from(
      document.querySelectorAll("link[rel='stylesheet'], style")
    )
      .map((el) => el.outerHTML)
      .join("\n");

    const receiptContent = printableEl.outerHTML;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${invoice.invoice_number}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${headStyles}
          <style>
            @page {
              size: ${is80 ? "80mm 297mm" : "58mm 210mm"};
              margin: 0;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Courier New', Courier, monospace, system-ui, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .printable-wrapper {
              width: ${is80 ? "76mm" : "54mm"};
              margin: 0 auto;
              padding: 2mm 1mm;
              background: #ffffff !important;
            }
            * {
              box-sizing: border-box;
              color: #000000 !important;
            }
            svg {
              display: block;
              margin: 0 auto;
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="printable-wrapper">
            ${receiptContent}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Iframe print fallback:", e);
        window.print();
      } finally {
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      }
    }, 300);
  };

  // WhatsApp formatted receipt text
  const handleWhatsAppShare = () => {
    const phone =
      customPhone ||
      customer?.whatsapp_number ||
      customer?.phone ||
      invoice.customer_phone ||
      "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    const itemsSummary = invoice.items
      .map(
        (it) =>
          `• ${it.product_name} (${it.quantity}x @ Rs ${it.unit_price}) = Rs ${it.total_amount}`
      )
      .join("\n");

    const message =
      `*🧾 ${shopName} - SALES INVOICE*\n` +
      `Branch: ${branchName}\n` +
      `Invoice #: ${invoice.invoice_number}\n` +
      `Date: ${new Date(invoice.created_at || Date.now()).toLocaleString("en-PK")}\n\n` +
      `*Items:*\n${itemsSummary}\n\n` +
      `*Subtotal:* Rs ${invoice.subtotal.toLocaleString()}\n` +
      (invoice.discount_amount > 0
        ? `*Discount:* Rs ${invoice.discount_amount.toLocaleString()}\n`
        : "") +
      `*Total Amount:* Rs ${invoice.total_amount.toLocaleString()}\n` +
      `*Paid Amount:* Rs ${invoice.paid_amount.toLocaleString()}\n` +
      (invoice.change_amount > 0
        ? `*Change Returned:* Rs ${invoice.change_amount.toLocaleString()}\n`
        : "") +
      (customer && customer.current_balance
        ? `\n*Account Outstanding Balance:* Rs ${customer.current_balance.toLocaleString()}\n`
        : "") +
      `\nFBR Invoice #: ${invoice.fbr_invoice_number || "FBR-VERIFIED"}\n` +
      `Thank you for shopping with us! 🙏`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith("92") ? cleanPhone : "92" + cleanPhone.replace(/^0/, "")}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  const is80mm = paperWidth === "80mm";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl w-[96vw] max-h-[92vh] overflow-y-auto p-5 sm:p-7">
        <DialogHeader className="space-y-1 pb-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <IconReceipt className="h-6 w-6 text-primary" />
              Thermal POS Receipt Studio
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                Invoice: {invoice.invoice_number}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs flex items-center gap-1 font-semibold"
              >
                <IconShieldCheck className="h-3.5 w-3.5" />
                FBR Fiscalized
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* 2-COLUMN STUDIO WORKSPACE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-3">
          {/* LEFT COLUMN: REALISTIC THERMAL SLIP PREVIEW */}
          <div className="md:col-span-6 lg:col-span-5 flex flex-col items-center justify-start bg-muted/40 rounded-xl p-5 border border-dashed">
            <div className="w-full flex items-center justify-between pb-2 mb-3 text-xs text-muted-foreground border-b">
              <span className="font-semibold flex items-center gap-1.5">
                <IconDimensions className="h-3.5 w-3.5 text-primary" />
                Live Paper Slip Preview ({paperWidth})
              </span>
              <span className="text-[11px] font-mono">
                {language.toUpperCase()} MODE
              </span>
            </div>

            <div
              id="thermal-receipt-printable"
              className={`bg-white text-zinc-950 font-mono text-[11px] leading-tight p-4 shadow-md border rounded-xs transition-all duration-200 ${
                is80mm ? "w-[335px]" : "w-[250px]"
              }`}
            >
              {/* Business Header */}
              <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-zinc-400">
                <div className="font-bold text-sm tracking-wide uppercase">
                  {shopName}
                </div>
                <div className="text-[10px] text-zinc-600">{branchName}</div>
                <div className="text-[10px] text-zinc-600">{branchAddress}</div>
                <div className="text-[10px] text-zinc-600">
                  Tel: {branchPhone}
                </div>
                <div className="text-[9px] text-zinc-500 pt-0.5">
                  NTN: {tenantNtn} | STRN: {tenantStrn}
                </div>
              </div>

              {/* Urdu Title Banner */}
              {(language === "ur" || language === "bilingual") && (
                <div className="text-center font-bold text-xs py-1 border-b border-zinc-200">
                  رسید برائے فروخت
                </div>
              )}

              {/* Invoice Meta */}
              <div className="py-2 text-[10px] space-y-0.5 border-b border-dashed border-zinc-400">
                <div className="flex justify-between">
                  <span>
                    Inv #: <b>{invoice.invoice_number}</b>
                  </span>
                  <span>
                    {new Date(
                      invoice.created_at || Date.now()
                    ).toLocaleDateString("en-PK")}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Cashier: {invoice.cashier_name || "Admin"}</span>
                  <span>
                    {new Date(
                      invoice.created_at || Date.now()
                    ).toLocaleTimeString("en-PK", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {invoice.customer_name && (
                  <div className="pt-1 flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold text-right truncate max-w-[170px]">
                      {invoice.customer_name}
                    </span>
                  </div>
                )}
                {invoice.customer_phone && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Phone:</span>
                    <span>{invoice.customer_phone}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="py-2 border-b border-dashed border-zinc-400">
                <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-zinc-300">
                  <span className="col-span-6">
                    {language === "ur" ? "آئٹم" : "Item"}
                  </span>
                  <span className="col-span-2 text-center">
                    {language === "ur" ? "تعداد" : "Qty"}
                  </span>
                  <span className="col-span-2 text-right">
                    {language === "ur" ? "قیمت" : "Rate"}
                  </span>
                  <span className="col-span-2 text-right">
                    {language === "ur" ? "کل" : "Total"}
                  </span>
                </div>

                <div className="divide-y divide-zinc-100">
                  {invoice.items.map((item, idx) => (
                    <div key={idx} className="py-1 text-[10.5px]">
                      <div className="font-semibold text-zinc-900 truncate">
                        {item.product_name}
                      </div>
                      <div className="grid grid-cols-12 text-[10px] text-zinc-600 pt-0.5">
                        <span className="col-span-6 text-[9px] text-zinc-400 font-mono">
                          {item.sku || ""}
                        </span>
                        <span className="col-span-2 text-center font-bold text-zinc-800">
                          {item.quantity}
                        </span>
                        <span className="col-span-2 text-right">
                          {Math.round(item.unit_price)}
                        </span>
                        <span className="col-span-2 text-right font-bold text-zinc-950 font-mono">
                          {Math.round(item.total_amount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="py-2 text-[11px] space-y-1 border-b border-dashed border-zinc-400">
                <div className="flex justify-between">
                  <span>
                    {language === "bilingual"
                      ? "Subtotal / ذیلی میزان"
                      : language === "ur"
                        ? "ذیلی میزان"
                        : "Subtotal"}
                    :
                  </span>
                  <span>Rs {invoice.subtotal.toLocaleString()}</span>
                </div>

                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-zinc-700">
                    <span>
                      {language === "bilingual"
                        ? "Discount / رعایت"
                        : language === "ur"
                          ? "رعایت"
                          : "Discount"}
                      :
                    </span>
                    <span>- Rs {invoice.discount_amount.toLocaleString()}</span>
                  </div>
                )}

                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between text-zinc-700">
                    <span>Sales Tax (FBR):</span>
                    <span>+ Rs {invoice.tax_amount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold pt-1 border-t border-zinc-300">
                  <span>
                    {language === "bilingual"
                      ? "TOTAL / کل رقم"
                      : language === "ur"
                        ? "کل رقم"
                        : "TOTAL DUE"}
                    :
                  </span>
                  <span className="font-mono text-base">
                    Rs {invoice.total_amount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-[10px] pt-0.5">
                  <span>
                    Paid ({invoice.payment_method?.toUpperCase()}):
                  </span>
                  <span>Rs {invoice.paid_amount.toLocaleString()}</span>
                </div>

                {invoice.change_amount > 0 && (
                  <div className="flex justify-between text-[10px] text-zinc-600">
                    <span>Change Returned:</span>
                    <span>Rs {invoice.change_amount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Customer Khata Ledger Statement (if credit / registered customer) */}
              {customer && (
                <div className="py-1.5 my-1 bg-zinc-50 border border-zinc-200 rounded-xs px-2 text-[10px] space-y-0.5">
                  <div className="font-bold flex justify-between border-b border-zinc-200 pb-0.5">
                    <span>
                      {language === "ur"
                        ? "کھاتہ تفصیل"
                        : "Customer Ledger Balance"}
                    </span>
                    <span>{customer.business_name}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 pt-0.5">
                    <span>
                      {language === "ur" ? "سابقہ بقایا" : "Previous Balance"}:
                    </span>
                    <span>
                      Rs{" "}
                      {(
                        (customer.current_balance || 0) -
                        (invoice.total_amount - invoice.paid_amount)
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>
                      {language === "ur" ? "موجودہ بل" : "Current Bill"}:
                    </span>
                    <span>Rs {invoice.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-zinc-950 pt-0.5 border-t border-dashed border-zinc-300">
                    <span>
                      {language === "ur"
                        ? "کل واجب الادا"
                        : "Net Total Payable"}
                      :
                    </span>
                    <span className="font-mono">
                      Rs {(customer.current_balance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* FBR DIGITAL VERIFICATION SECTION */}
              <div className="border border-dashed border-zinc-600 rounded-sm p-2 text-center my-2 space-y-1.5 bg-zinc-50/50">
                <div className="flex items-center justify-center gap-1 font-bold text-[9px] uppercase tracking-wide">
                  <IconShieldCheck className="h-3.5 w-3.5 text-zinc-800" />
                  <span>FBR Digital Invoice POS</span>
                </div>
                <div className="text-[9px] font-mono font-bold text-zinc-900 tracking-wider">
                  {invoice.fbr_invoice_number ||
                    `FBR-PK-${invoice.id.toString().padStart(8, "0")}`}
                </div>

                {/* Scannable QR */}
                <div className="flex justify-center py-1">
                  <div className="bg-white p-1 border inline-block">
                    <QRCode
                      value={
                        invoice.fbr_qr_code ||
                        `FBR:${invoice.fbr_invoice_number || invoice.invoice_number}|Rs:${invoice.total_amount}|Date:${invoice.created_at}`
                      }
                      size={is80mm ? 90 : 75}
                      level="M"
                    />
                  </div>
                </div>
                <div className="text-[8px] text-zinc-500">
                  Scan via Tax Asaan App to verify invoice.
                </div>
              </div>

              {/* Footer Notice */}
              <div className="text-center pt-2 text-[9px] text-zinc-500 space-y-0.5">
                <div>خریداری کا شکریہ! اپنا بل سنبھال کر رکھیں۔</div>
                <div>Software: Paperless Business OS</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PRINTER CONTROLS & INSTANT ACTIONS */}
          <div className="md:col-span-6 lg:col-span-7 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Paper Roll Size Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <IconDimensions className="h-4 w-4 text-primary" />
                  Thermal Paper Roll Width
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperWidth("80mm")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      paperWidth === "80mm"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>80mm Standard</span>
                      {paperWidth === "80mm" && (
                        <IconCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground pt-0.5">
                      Standard wholesale counter & heavy-duty POS thermal roll
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaperWidth("58mm")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      paperWidth === "58mm"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>58mm Compact</span>
                      {paperWidth === "58mm" && (
                        <IconCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground pt-0.5">
                      Mobile bluetooth receipt printer / compact register
                    </div>
                  </button>
                </div>
              </div>

              {/* Receipt Language Mode */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <IconLanguage className="h-4 w-4 text-primary" />
                  Receipt Language Mode
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={language === "bilingual" ? "default" : "outline"}
                    className="text-xs font-medium"
                    onClick={() => setLanguage("bilingual")}
                  >
                    🌐 Bilingual
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={language === "ur" ? "default" : "outline"}
                    className="text-xs font-medium"
                    onClick={() => setLanguage("ur")}
                  >
                    🇵🇰 اردو
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={language === "en" ? "default" : "outline"}
                    className="text-xs font-medium"
                    onClick={() => setLanguage("en")}
                  >
                    🇬🇧 English
                  </Button>
                </div>
              </div>

              {/* WhatsApp Slip Dispatcher */}
              <Card className="border border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    <IconBrandWhatsapp className="h-4 w-4" />
                    <span>WhatsApp Digital Slip to Customer</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="0300-1234567"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="text-xs font-mono bg-background"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-emerald-600 border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 shrink-0 gap-1.5 text-xs font-semibold"
                      onClick={handleWhatsAppShare}
                    >
                      <IconShare className="h-3.5 w-3.5" />
                      Send Slip
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Pre-formats itemized Urdu/English bill & account balance.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-2 border-t">
              <Button
                size="lg"
                className="w-full gap-2 bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 text-sm font-bold shadow-md"
                onClick={handlePrint}
              >
                <IconPrinter className="h-5 w-5" />
                Print Thermal Receipt ({paperWidth})
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={onClose}
              >
                Done / Start New Sale
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ThermalReceiptModal;
