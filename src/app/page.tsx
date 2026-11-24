"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconBuildingStore,
  IconReceipt2,
  IconBox,
  IconUsers,
  IconBrandWhatsapp,
  IconShieldCheck,
  IconArrowRight,
  IconCheck,
  IconSparkles,
  IconTruckDelivery,
  IconCalculator,
  IconDeviceDesktop,
  IconChevronDown,
  IconQrcode,
  IconFileSpreadsheet,
  IconArrowsExchange,
  IconCreditCard,
  IconBuildingBank,
  IconClock,
  IconCash,
  IconDiscount2,
  IconPackages,
  IconAlertCircle,
  IconFileInvoice,
  IconArrowBackUp,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { planService, PublicPlan } from "@/services/plan.service";

const DEFAULT_LANDING_PLANS: PublicPlan[] = [
  {
    id: 1,
    slug: "free_trial",
    name: "Free Trial",
    badge_label: "14-Day Evaluation",
    description: "Full access to test every feature for your shop or trading business.",
    price_monthly: 0,
    price_yearly: 0,
    trial_days: 14,
    is_highlighted: false,
    sort_order: 1,
    features: [
      "1 Shop / Main Branch",
      "2 Staff User Accounts",
      "Fast Thermal POS & Barcode Billing",
      "Customer Khata Ledger with Balance",
      "Standard Sales Reports",
      "No Credit Card Required",
    ],
  },
  {
    id: 2,
    slug: "basic",
    name: "Basic Retail",
    badge_label: "Small Retailers",
    description: "Ideal for retail marts, pharmacies, mobile shops, and single counter stores.",
    price_monthly: 3500,
    price_yearly: 2800,
    trial_days: 14,
    is_highlighted: false,
    sort_order: 2,
    features: [
      "1 Retail Shop / Counter",
      "3 Staff User Roles (Admin / Cashier)",
      "Unlimited Products & Sales Invoices",
      "WhatsApp Invoice & Receipt Sharing",
      "Daily Cash Register (Roznamcha)",
      "Daily Operational Expense Vouchers",
      "Customer Khata & Recovery Tracking",
    ],
  },
  {
    id: 3,
    slug: "standard",
    name: "Standard Wholesale",
    badge_label: "Most Popular",
    description: "Engineered for wholesale traders, stockists, and multi-godown distributors.",
    price_monthly: 7500,
    price_yearly: 6000,
    trial_days: 14,
    is_highlighted: true,
    sort_order: 3,
    features: [
      "2 Warehouses / Godowns & Shops",
      "10 Staff Accounts with RBAC Matrix",
      "Multi-Tier Wholesale & Special Pricing",
      "Purchases & Goods Received (GRN)",
      "Purchase Returns & Debit Notes",
      "Customer Aging Ledger (30/60/90 Days)",
      "Salesman Order Route & Dispatch",
      "Double-Entry General Journal (JVs)",
      "Automated Trial Balance & P&L",
    ],
  },
  {
    id: 4,
    slug: "enterprise",
    name: "Enterprise ERP",
    badge_label: "Chains & Distributors",
    description: "For national distribution networks, retail supermarket chains, and large traders.",
    price_monthly: 15000,
    price_yearly: 12000,
    trial_days: 14,
    is_highlighted: false,
    sort_order: 4,
    features: [
      "Unlimited Shops, Branches & Godowns",
      "Unlimited Staff Accounts & Audit Trails",
      "Inter-Branch Stock Transfers & Audits",
      "FBR Digital Tax QR Code Integration",
      "Bank Reconciliation Statement (BRS)",
      "Multi-Channel Payment Status Engine",
      "Custom Financial Statement Exports",
      "Priority WhatsApp & Dedicated Support",
    ],
  },
];

type ShowcaseTab = "pos" | "invoices" | "purchases" | "accounting";

export default function LandingHomePage() {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = React.useState<PublicPlan[]>(DEFAULT_LANDING_PLANS);
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "yearly">("yearly");
  const [activeTab, setActiveTab] = React.useState<ShowcaseTab>("pos");

  React.useEffect(() => {
    planService
      .getPublicPlans()
      .then((data) => {
        if (data && data.length > 0) {
          setPlans(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load public plans:", err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F5F8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-[#2CA01C]/20 selection:text-[#2CA01C]">
      {/* 1. QuickBooks-Style Enterprise Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#2CA01C] text-white shadow-sm">
                <IconBuildingStore className="size-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight text-[#0B2265] dark:text-white">
                    Paperless
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2CA01C]/10 text-[#2CA01C] px-1.5 py-0.5 rounded">
                    ERP
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium -mt-1">
                  by MetricNests
                </span>
              </div>
            </Link>

            {/* Navigation Mega-Links */}
            <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <a href="#showcase" className="hover:text-[#0B2265] dark:hover:text-white transition-colors">
                Product Tour
              </a>
              <a href="#features" className="hover:text-[#0B2265] dark:hover:text-white transition-colors">
                Modules &amp; POS
              </a>
              <a href="#accounting" className="hover:text-[#0B2265] dark:hover:text-white transition-colors">
                Double-Entry Accounting
              </a>
              <a href="#pricing" className="hover:text-[#0B2265] dark:hover:text-white transition-colors">
                Plans &amp; Pricing
              </a>
            </nav>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild size="sm" className="bg-[#2CA01C] hover:bg-[#248417] text-white font-semibold shadow-xs">
                <Link href="/dashboard">
                  Business Dashboard <IconArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0B2265] hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="bg-[#2CA01C] hover:bg-[#248417] text-white font-semibold shadow-xs px-4">
                  <Link href="/register">
                    Start Free Trial
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Solid High-Contrast Headline & Value Proposition */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-6 shadow-xs">
              <span className="flex size-2 rounded-full bg-[#2CA01C]"></span>
              All-in-One Cloud POS, Multi-Godown Stock &amp; IFRS Accounting for Pakistan
            </div>

            {/* Solid Headline (No AI Gradients) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0B2265] dark:text-white leading-[1.12]">
              Smart Point of Sale &amp; Automated Accounting for Growing Businesses.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Run fast retail billing, manage multi-godown purchases, track customer khata on WhatsApp,
              and automate your balance sheet—with full FBR digital tax compliance.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-[#2CA01C] hover:bg-[#248417] text-white font-bold shadow-sm">
                <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                  {isAuthenticated ? "Go to Business Dashboard" : "Start 14-Day Free Trial"}
                  <IconArrowRight className="size-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-7 text-base font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                <a href="#showcase">Explore Interactive Tour</a>
              </Button>
            </div>

            {/* Trust Micro-Badges */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <IconCheck className="size-4 text-[#2CA01C]" /> No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <IconCheck className="size-4 text-[#2CA01C]" /> Instant 1-Minute Setup
              </span>
              <span className="flex items-center gap-1.5">
                <IconCheck className="size-4 text-[#2CA01C]" /> FBR &amp; PRA Compliant
              </span>
            </div>
          </div>

          {/* 3. QuickBooks-Style Interactive Product Showcase (Real Paperless UI Tabs) */}
          <div id="showcase" className="mt-12 max-w-5xl mx-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F5F8] dark:bg-slate-950 p-2 sm:p-4 shadow-sm">
            {/* Tabs Bar */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("pos")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  activeTab === "pos"
                    ? "bg-[#2CA01C] text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                )}
              >
                <IconReceipt2 className="size-4" />
                1. Thermal POS Counter
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("invoices")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  activeTab === "invoices"
                    ? "bg-[#2CA01C] text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                )}
              >
                <IconBrandWhatsapp className="size-4" />
                2. Invoices &amp; Khata on WhatsApp
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("purchases")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  activeTab === "purchases"
                    ? "bg-[#2CA01C] text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                )}
              >
                <IconPackages className="size-4" />
                3. Purchases &amp; Godown GRN
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("accounting")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  activeTab === "accounting"
                    ? "bg-[#2CA01C] text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                )}
              >
                <IconBuildingBank className="size-4" />
                4. Automated Accounting &amp; P&amp;L
              </button>
            </div>

            {/* Tab 1 Content: POS Counter Showcase */}
            {activeTab === "pos" && (
              <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-lg mt-3 border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2CA01C]">
                      Fast Retail Billing
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      High-Speed Thermal POS with Barcode Support
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      80mm &amp; 58mm thermal print, multi-tender split payments (Cash, Raast, Card), and barcode scanning.
                    </p>
                  </div>
                  <Badge variant="outline" className="border-[#2CA01C]/40 text-[#2CA01C] bg-[#2CA01C]/10 font-bold">
                    Shift Active: Cash Drawer Rs. 45,000
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {/* Mock Cart List */}
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded">
                      <span>Item / Barcode</span>
                      <span>Qty &times; Price</span>
                      <span>Total</span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-2 rounded border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">Dalda Cooking Oil 5L</span>
                        <span className="text-[10px] text-slate-400 font-mono">8964000123456</span>
                      </div>
                      <span className="font-mono text-slate-600">2 &times; Rs. 2,850</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">Rs. 5,700</span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-2 rounded border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">Tapal Danedar Tea 450g</span>
                        <span className="text-[10px] text-slate-400 font-mono">8964000789012</span>
                      </div>
                      <span className="font-mono text-slate-600">3 &times; Rs. 650</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">Rs. 1,950</span>
                    </div>
                  </div>

                  {/* Mock Checkout Summary Box */}
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Items Subtotal:</span>
                        <span className="font-mono font-semibold">Rs. 7,650</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Discount:</span>
                        <span className="font-mono font-semibold text-[#2CA01C]">- Rs. 150</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Sales Tax (FBR):</span>
                        <span className="font-mono font-semibold">Rs. 0.00</span>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-baseline">
                        <span className="font-bold text-slate-800 dark:text-slate-100">Net Payable:</span>
                        <span className="text-xl font-bold font-mono text-[#0B2265] dark:text-[#2CA01C]">Rs. 7,500</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t space-y-1.5">
                      <div className="w-full py-2 bg-[#2CA01C] text-white text-xs font-bold rounded text-center shadow-xs">
                        Print 80mm Receipt &amp; Save
                      </div>
                      <span className="text-[10px] text-slate-400 text-center block">
                        Auto-deducts inventory &amp; updates Day Book
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2 Content: Invoices & WhatsApp Khata */}
            {activeTab === "invoices" && (
              <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-lg mt-3 border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2CA01C]">
                      Party Khata &amp; Invoicing
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Customer Ledger with 1-Click WhatsApp Delivery
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Automated 30/60/90 days aging analysis, credit limit protection, and instant PDF statement sharing.
                    </p>
                  </div>
                  <Button size="sm" className="bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold gap-1.5">
                    <IconBrandWhatsapp className="size-4" /> Share Khata Statement
                  </Button>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Customer / Party</th>
                        <th className="py-2.5 px-3 text-right">Total Bill</th>
                        <th className="py-2.5 px-3 text-right">Paid</th>
                        <th className="py-2.5 px-3 text-right">Khata Due</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-semibold">INV-2026-0842</td>
                        <td className="py-2.5 px-3 font-medium">Bismillah Traders (Anarkali)</td>
                        <td className="py-2.5 px-3 text-right font-mono">Rs. 185,000</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#2CA01C]">Rs. 100,000</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">Rs. 85,000</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            Partial Due
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[#25D366] font-semibold text-[11px] cursor-pointer hover:underline">
                            Delivered ✓
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-semibold">INV-2026-0841</td>
                        <td className="py-2.5 px-3 font-medium">Madina Karyana Store</td>
                        <td className="py-2.5 px-3 text-right font-mono">Rs. 42,000</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#2CA01C]">Rs. 42,000</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">Rs. 0</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2CA01C]/10 text-[#2CA01C]">
                            Paid
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[#25D366] font-semibold text-[11px]">Sent ✓</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3 Content: Purchases & Godown GRN */}
            {activeTab === "purchases" && (
              <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-lg mt-3 border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2CA01C]">
                      Stock Procurement &amp; Vendor Management
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Warehouse GRN &amp; Automatic Debit Notes
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Receive inventory directly into godowns, allocate payments from cash/bank, and return damaged items with 1 click.
                    </p>
                  </div>
                  <Badge variant="outline" className="border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-500/10 font-bold">
                    Connected: 2 Godowns / 1 Main Shop
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                  <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500 block">Receiving Godown:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Main Godown (Lahore)</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Vendor: Dalda Foods Limited</span>
                  </div>

                  <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500 block">Payment Split:</span>
                    <span className="font-mono font-bold text-[#2CA01C] block text-sm">Rs. 50,000 Paid (Meezan Bank)</span>
                    <span className="font-mono text-rose-600 font-semibold block text-[11px]">Rs. 35,000 on Vendor Khata</span>
                  </div>

                  <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-500 block">Purchase Return / Debit Note:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400 block text-sm">2 Cans Returned</span>
                    <span className="text-[10px] text-slate-500 block mt-1">Auto-credited back to Vendor Khata</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4 Content: Automated Accounting & P&L */}
            {activeTab === "accounting" && (
              <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-lg mt-3 border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2CA01C]">
                      Perpetual Double-Entry Suite (IFRS Standard)
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Zero-Touch General Journal &amp; Live Balance Sheet
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Every sale, purchase, expense voucher, and return automatically posts balanced debit and credit entries.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#2CA01C] bg-[#2CA01C]/10 px-2.5 py-1 rounded">
                    <IconCheck className="size-4" /> Trial Balance Dr = Cr Verified (Diff: Rs. 0.00)
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-left">
                  <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800">
                    <span className="text-[11px] text-slate-500 font-medium">Monthly Gross Sales</span>
                    <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">Rs. 1,480,000</p>
                    <span className="text-[10px] text-[#2CA01C] font-semibold">Cr. Revenue 4010</span>
                  </div>
                  <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800">
                    <span className="text-[11px] text-slate-500 font-medium">Cost of Goods Sold (COGS)</span>
                    <p className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300 mt-1">Rs. 1,120,000</p>
                    <span className="text-[10px] text-slate-500 font-semibold">Dr. COGS 5010</span>
                  </div>
                  <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800">
                    <span className="text-[11px] text-slate-500 font-medium">Shop Expenses (CPV)</span>
                    <p className="text-lg font-bold font-mono text-rose-600 mt-1">Rs. 64,500</p>
                    <span className="text-[10px] text-rose-600 font-semibold">Rent, Bills, Tea</span>
                  </div>
                  <div className="p-3 rounded-lg border bg-[#2CA01C]/10 border-[#2CA01C]/30">
                    <span className="text-[11px] text-[#2CA01C] font-bold">Net Operational Profit</span>
                    <p className="text-lg font-bold font-mono text-[#0B2265] dark:text-[#2CA01C] mt-1">Rs. 295,500</p>
                    <span className="text-[10px] text-slate-500">Live P&amp;L Margin</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Enterprise Feature Modules (Authentic Pakistani Business Workflows) */}
      <section id="features" className="py-16 md:py-24 border-b border-slate-200/80 dark:border-slate-800 bg-[#F4F5F8] dark:bg-slate-950">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2CA01C]">
              Enterprise Trade Infrastructure
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#0B2265] dark:text-white sm:text-4xl mt-1">
              Built Specifically for How Trade Operates in Pakistan
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
              No generic templates. Every single module handles real Pakistani market workflows: credit khata, godown bilty, and thermal receipts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. POS */}
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-xs hover:border-[#2CA01C]/60 transition-colors">
              <div className="size-10 rounded-lg bg-[#2CA01C]/10 text-[#2CA01C] flex items-center justify-center mb-4">
                <IconReceipt2 className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">High-Speed POS &amp; Thermal Billing</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Barcode scan support, 80mm &amp; 58mm thermal receipts in Urdu and English, cash drawer shift tracking, and quick multi-item checkout.
              </p>
            </Card>

            {/* 2. Warehouses */}
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-xs hover:border-[#2CA01C]/60 transition-colors">
              <div className="size-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <IconPackages className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Godown Stock &amp; Bilty Receiving</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Receive stock into separate warehouses, record supplier bilty numbers, track carton quantities, and handle inter-branch transfers effortlessly.
              </p>
            </Card>

            {/* 3. Customer Khata & WhatsApp */}
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-xs hover:border-[#2CA01C]/60 transition-colors">
              <div className="size-10 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center mb-4">
                <IconBrandWhatsapp className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Party Khata &amp; WhatsApp Statements</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Full customer balance ledgers with aging reports (0-30, 31-60, 61-90 days), credit limits, and 1-click WhatsApp PDF statement dispatch.
              </p>
            </Card>

            {/* 4. Purchases & Returns */}
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-xs hover:border-[#2CA01C]/60 transition-colors">
              <div className="size-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <IconArrowBackUp className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Purchases &amp; Supplier Debit Notes</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Log purchase bills with cash/bank splits. Return damaged or excess items with automated debit note generation and supplier balance relief.
              </p>
            </Card>

            {/* 5. Daily Cash Register */}
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-xs hover:border-[#2CA01C]/60 transition-colors">
              <div className="size-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <IconCash className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daily Cash Register (Roznamcha)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Instant daily cash book showing opening cash, sales cash inflows, supplier payouts, petty cash expenses, and closing cash drawer balance.
              </p>
            </Card>

            {/* 6. FBR Digital Tax */}
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-xs hover:border-[#2CA01C]/60 transition-colors">
              <div className="size-10 rounded-lg bg-[#0B2265]/10 text-[#0B2265] dark:text-blue-300 flex items-center justify-center mb-4">
                <IconShieldCheck className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">FBR Digital Tax QR Compliance</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Standard Sales Tax, Further Tax (3%), NTN/STRN handling, and instant QR code generation compliant with official revenue authorities.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. QuickBooks-Style Transparent Pricing Matrix */}
      <section id="pricing" className="py-16 md:py-24 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2CA01C]">
              Transparent PKR Pricing
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#0B2265] dark:text-white sm:text-4xl mt-1">
              Choose the Plan That Matches Your Business Scale
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
              Start with a 14-day unrestricted evaluation. Upgrade or cancel anytime with zero lock-in contracts.
            </p>

            {/* Annual vs Monthly Toggle (QuickBooks Style) */}
            <div className="mt-6 inline-flex items-center gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                  billingCycle === "monthly"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5",
                  billingCycle === "yearly"
                    ? "bg-[#2CA01C] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                Annual Billing
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded font-extrabold uppercase",
                  billingCycle === "yearly" ? "bg-white text-[#2CA01C]" : "bg-[#2CA01C]/10 text-[#2CA01C]"
                )}>
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => {
              const isHighlight = plan.is_highlighted;
              const isFreeTrial = plan.price_monthly === 0;
              const effectivePrice = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;

              return (
                <Card
                  key={plan.id || plan.slug}
                  className={cn(
                    "flex flex-col justify-between p-6 rounded-lg transition-all border bg-white dark:bg-slate-900",
                    isHighlight
                      ? "border-2 border-[#2CA01C] shadow-md relative ring-1 ring-[#2CA01C]/20"
                      : "border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300"
                  )}
                >
                  {isHighlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2CA01C] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                      {plan.badge_label || "Most Popular"}
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {plan.badge_label || (isFreeTrial ? "14-Day Free Trial" : "Business Plan")}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 min-h-[36px] leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                          Rs. {effectivePrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">
                          {isFreeTrial ? " / 14 days" : " / month"}
                        </span>
                      </div>
                      {!isFreeTrial && billingCycle === "yearly" && (
                        <span className="text-[11px] text-[#2CA01C] font-semibold block mt-1">
                          Billed annually (Save 20%)
                        </span>
                      )}
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {(plan.features || []).map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <IconCheck className="size-4 shrink-0 text-[#2CA01C] mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      asChild
                      className={cn(
                        "w-full font-bold text-xs h-10 shadow-xs",
                        isHighlight
                          ? "bg-[#2CA01C] hover:bg-[#248417] text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700"
                      )}
                    >
                      <Link href={`/register?plan=${plan.slug}`}>
                        {isFreeTrial ? "Start 14-Day Free Trial" : `Choose ${plan.name}`}
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Major Pakistani Wholesale & Retail Markets */}
      <section className="py-14 border-b border-slate-200/80 dark:border-slate-800 bg-[#F4F5F8] dark:bg-slate-950">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Engineered for High-Volume Trade Across Pakistan
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="px-3.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              Shah Alam Market, Lahore
            </span>
            <span className="px-3.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              Bolton Market, Karachi
            </span>
            <span className="px-3.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              Raja Bazaar, Rawalpindi
            </span>
            <span className="px-3.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              Ghanta Ghar, Faisalabad
            </span>
            <span className="px-3.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              Karkhano Market, Peshawar
            </span>
          </div>
        </div>
      </section>

      {/* 7. Enterprise Corporate Footer */}
      <footer className="py-10 bg-white dark:bg-slate-900 text-xs text-slate-500 border-t border-slate-200/80 dark:border-slate-800">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded bg-[#2CA01C] text-white flex items-center justify-center font-bold">
              P
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Paperless ERP
            </span>
            <span>· All-in-One POS, Warehouse &amp; Double-Entry Accounting Platform</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-slate-900 dark:hover:text-white">
              Free Trial
            </Link>
            <a href="#pricing" className="hover:text-slate-900 dark:hover:text-white">
              Pricing
            </a>
            <span className="text-slate-400">© 2026 MetricNests. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
