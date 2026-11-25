"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconBuildingStore,
  IconReceipt2,
  IconBrandWhatsapp,
  IconShieldCheck,
  IconArrowRight,
  IconCheck,
  IconBuildingBank,
  IconPackages,
  IconArrowBackUp,
  IconCash,
  IconPlus,
  IconMinus,
  IconScale,
  IconReportAnalytics,
  IconRoute,
  IconUserShield,
  IconArrowsExchange,
  IconFileInvoice,
  IconPrinter,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
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

type ShowcaseTab = "pos" | "khata" | "purchases" | "statements";
type JournalEventKey = "sale" | "purchase" | "expense";

interface DemoProduct {
  id: string;
  name: string;
  sku: string;
  unit: string;
  price: number;
  cost: number;
  stock: number;
}

const DEMO_POS_PRODUCTS: DemoProduct[] = [
  { id: "oil", name: "Dalda Cooking Oil 5L Can", sku: "DLD-OIL-5L", unit: "Can", price: 2850, cost: 2620, stock: 42 },
  { id: "tea", name: "Tapal Danedar Tea 450g", sku: "TPL-TEA-450", unit: "Pack", price: 650, cost: 580, stock: 85 },
  { id: "milk", name: "Nestle MilkPak 1L (Carton of 12)", sku: "NST-MLK-CTN", unit: "Carton", price: 3480, cost: 3240, stock: 19 },
  { id: "rice", name: "Super Kernel Basmati Rice 5kg", sku: "BSR-5KG", unit: "Bag", price: 1950, cost: 1750, stock: 30 },
];

interface LiveFeedEvent {
  id: string;
  ref: string;
  detail: string;
  amount: string;
  isPositive?: boolean;
  salesDelta?: number;
}

const LIVE_FEED_POOL: LiveFeedEvent[] = [
  { id: "tx-1", ref: "INV-2026-0842", detail: "Al-Fatah Mart, Cash", amount: "Rs. 24,190", salesDelta: 0 },
  { id: "tx-2", ref: "PUR-2026-0118", detail: "Dalda Foods GRN, Bank + Khata", amount: "Rs. 85,000", salesDelta: 0 },
  { id: "tx-3", ref: "CRV-2026-0094", detail: "Bismillah Karyana Wasooli", amount: "+ Rs. 35,000", isPositive: true, salesDelta: 0 },
  { id: "tx-4", ref: "INV-2026-0843", detail: "Save Mart Counter, Raast", amount: "Rs. 12,850", salesDelta: 12850 },
  { id: "tx-5", ref: "CPV-2026-0031", detail: "Shop Electricity Voucher", amount: "Rs. 14,500", salesDelta: 0 },
  { id: "tx-6", ref: "INV-2026-0844", detail: "Rahman Traders, Party Khata", amount: "Rs. 41,200", salesDelta: 41200 },
];

const JOURNAL_EXAMPLES: Record<
  JournalEventKey,
  {
    title: string;
    trigger: string;
    voucherNo: string;
    source: string;
    lines: { code: string; account: string; debit: number; credit: number }[];
    impact: string;
  }
> = {
  sale: {
    title: "POS Counter Sale",
    trigger: "Cashier prints an 80mm receipt for Rs. 7,500 (Cost: Rs. 6,400)",
    voucherNo: "JV-202611-0148",
    source: "Auto-posted from POS Invoice",
    lines: [
      { code: "1010", account: "Cash in Hand (Main Counter)", debit: 7500, credit: 0 },
      { code: "4010", account: "Sales Revenue (Gross)", debit: 0, credit: 7500 },
      { code: "5010", account: "Cost of Goods Sold (COGS)", debit: 6400, credit: 0 },
      { code: "1040", account: "Merchandise Inventory", debit: 0, credit: 6400 },
    ],
    impact: "Cash Drawer +Rs. 7,500, Stock deducted, Gross Profit +Rs. 1,100 on P&L",
  },
  purchase: {
    title: "Purchase GRN (Partial Paid)",
    trigger: "Godown receives Rs. 85,000 stock: Rs. 50,000 via Bank, Rs. 35,000 on Khata",
    voucherNo: "JV-202611-0149",
    source: "Auto-posted from Purchase GRN",
    lines: [
      { code: "1040", account: "Merchandise Inventory", debit: 85000, credit: 0 },
      { code: "1020", account: "Meezan Bank Business Account", debit: 0, credit: 50000 },
      { code: "2010", account: "Supplier Accounts Payable (Khata)", debit: 0, credit: 35000 },
    ],
    impact: "Godown stock increased, Bank credited, Supplier Payable Khata updated",
  },
  expense: {
    title: "Shop Expense Voucher (CPV)",
    trigger: "Manager pays LESCO electricity bill of Rs. 14,500 from counter cash",
    voucherNo: "JV-202611-0150",
    source: "Auto-posted from Expense Voucher",
    lines: [
      { code: "6030", account: "Electricity & Utility Bills", debit: 14500, credit: 0 },
      { code: "1010", account: "Cash in Hand (Main Counter)", debit: 0, credit: 14500 },
    ],
    impact: "Daily Cash Register outflow logged, Net Profit updated live on P&L",
  },
};

/** Smooth numeric transition hook respecting prefers-reduced-motion */
function useAnimatedNumber(target: number, duration = 650): number {
  const [display, setDisplay] = React.useState(target);
  const previousRef = React.useRef(target);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      previousRef.current = target;
      setDisplay(target);
      return;
    }

    const from = previousRef.current;
    if (from === target) return;

    let rafId = 0;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(from + (target - from) * eased);
      setDisplay(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        previousRef.current = target;
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return display;
}

/** Scroll-triggered reveal wrapper using IntersectionObserver */
function ScrollReveal({
  children,
  className,
  delayMs = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  direction?: "up" | "left" | "right" | "none";
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hiddenTransform =
    direction === "up"
      ? "translate-y-5"
      : direction === "left"
      ? "-translate-x-5"
      : direction === "right"
      ? "translate-x-5"
      : "";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100",
        visible ? "opacity-100 translate-x-0 translate-y-0" : cn("opacity-0", hiddenTransform),
        className
      )}
    >
      {children}
    </div>
  );
}

function AnimatedPrice({ value }: { value: number }) {
  const animated = useAnimatedNumber(value, 420);
  return <>Rs. {animated.toLocaleString()}</>;
}

export default function LandingHomePage() {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = React.useState<PublicPlan[]>(DEFAULT_LANDING_PLANS);
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "yearly">("yearly");
  const [activeTab, setActiveTab] = React.useState<ShowcaseTab>("pos");
  const [activeJournal, setActiveJournal] = React.useState<JournalEventKey>("sale");
  const [isScrolled, setIsScrolled] = React.useState(false);

  // Hero initial mount entrance + live workspace stream
  const [heroReady, setHeroReady] = React.useState(false);
  const [feedCursor, setFeedCursor] = React.useState(0);
  const [liveSalesTotal, setLiveSalesTotal] = React.useState(0);
  const [liveInvoicesCount, setLiveInvoicesCount] = React.useState(34);

  const animatedHeroSales = useAnimatedNumber(liveSalesTotal, 900);
  const animatedDrawer = useAnimatedNumber(heroReady ? 92400 : 0, 950);
  const animatedKhata = useAnimatedNumber(heroReady ? 598790 : 0, 1050);
  const animatedInventory = useAnimatedNumber(heroReady ? 2490480 : 0, 1150);

  // Interactive POS demo state
  const [demoCart, setDemoCart] = React.useState<Record<string, number>>({
    oil: 2,
    tea: 3,
  });
  const [demoPayment, setDemoPayment] = React.useState<"cash" | "raast" | "khata">("cash");

  React.useEffect(() => {
    setHeroReady(true);
    setLiveSalesTotal(184650);

    const onScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Subtle live workspace ticker on hero preview (disabled when reduced motion is preferred)
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = window.setInterval(() => {
      setFeedCursor((prev) => {
        const nextIdx = (prev + 1) % LIVE_FEED_POOL.length;
        const incoming = LIVE_FEED_POOL[nextIdx];
        if (incoming.salesDelta && incoming.salesDelta > 0) {
          setLiveSalesTotal((s) => (s > 320000 ? 184650 : s + incoming.salesDelta!));
          setLiveInvoicesCount((c) => (c > 48 ? 34 : c + 1));
        }
        return nextIdx;
      });
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

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

  const visibleFeed = React.useMemo(() => {
    const items: LiveFeedEvent[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = (feedCursor - i + LIVE_FEED_POOL.length) % LIVE_FEED_POOL.length;
      items.push(LIVE_FEED_POOL[idx]);
    }
    return items;
  }, [feedCursor]);

  const updateDemoQty = (id: string, delta: number) => {
    setDemoCart((prev) => {
      const nextQty = (prev[id] || 0) + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: Math.min(nextQty, 20) };
    });
  };

  const demoCartLines = DEMO_POS_PRODUCTS.filter((p) => (demoCart[p.id] || 0) > 0).map((p) => ({
    ...p,
    qty: demoCart[p.id],
    lineTotal: p.price * demoCart[p.id],
    lineCost: p.cost * demoCart[p.id],
  }));
  const demoSubtotal = demoCartLines.reduce((sum, item) => sum + item.lineTotal, 0);
  const demoCostTotal = demoCartLines.reduce((sum, item) => sum + item.lineCost, 0);
  const demoDiscount = demoSubtotal >= 5000 ? 150 : 0;
  const demoNetPayable = Math.max(0, demoSubtotal - demoDiscount);
  const animatedDemoPayable = useAnimatedNumber(demoNetPayable, 320);

  const selectedJournal = JOURNAL_EXAMPLES[activeJournal];
  const journalTotal = selectedJournal.lines.reduce((s, l) => s + l.debit, 0);

  return (
    <div className="min-h-screen scroll-smooth bg-[#F4F5F8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-[#2CA01C]/20 selection:text-[#2CA01C]">
      {/* Scoped keyframes for subtle directional panel & feed transitions */}
      <style>{`
        @keyframes paperlessPanelIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes paperlessFeedSlide {
          from { opacity: 0; transform: translateY(-8px); background-color: rgba(44, 160, 28, 0.08); }
          to { opacity: 1; transform: translateY(0); background-color: transparent; }
        }
        @keyframes paperlessRowCascade {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .paperless-panel-enter {
          animation: paperlessPanelIn 0.36s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .paperless-feed-enter {
          animation: paperlessFeedSlide 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .paperless-row-enter {
          animation: paperlessRowCascade 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .paperless-panel-enter,
          .paperless-feed-enter,
          .paperless-row-enter {
            animation: none !important;
          }
        }
      `}</style>

      {/* 1. Navigation Bar with Smooth Scroll Shadow */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-shadow duration-300",
          isScrolled && "shadow-sm"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <Link
              href="/"
              className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2CA01C] rounded-md"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#2CA01C] text-white transition-transform duration-200 group-hover:scale-105">
                <IconBuildingStore className="size-5" />
              </div>
              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight text-[#0B2265] dark:text-white">
                    Paperless
                  </span>
                  <span className="text-[11px] font-bold text-[#2CA01C] bg-[#2CA01C]/10 px-1.5 py-0.5 rounded">
                    ERP
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                  by MetricNests
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
              {[
                { href: "#showcase", label: "Interactive Demo" },
                { href: "#workflows", label: "Modules & POS" },
                { href: "#accounting", label: "Double-Entry Accounting" },
                { href: "#pricing", label: "Pricing" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="relative py-1 hover:text-[#0B2265] dark:hover:text-white transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#2CA01C] after:transition-all after:duration-200 hover:after:w-full"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                asChild
                size="sm"
                className="bg-[#2CA01C] hover:bg-[#248417] text-white font-semibold h-9 px-4 transition-transform active:scale-[0.98]"
              >
                <Link href="/dashboard">
                  Open Dashboard <IconArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0B2265] hover:bg-slate-100 dark:hover:bg-slate-800 h-9"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-[#2CA01C] hover:bg-[#248417] text-white font-semibold h-9 px-4 transition-transform active:scale-[0.98]"
                >
                  <Link href="/register">Start Free Trial</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Asymmetric Split Hero with Animated Live Workspace */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left: Staggered Hero Copy */}
            <div className="lg:col-span-6">
              <div
                className={cn(
                  "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                  heroReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <p className="text-sm font-semibold text-[#2CA01C] mb-3">
                  Cloud POS, Multi-Godown Inventory &amp; IFRS Accounting for Pakistan
                </p>

                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0B2265] dark:text-white leading-[1.1]">
                  One system for your counter, godown, khata, and balance sheet.
                </h1>
              </div>

              <p
                style={{ transitionDelay: "90ms" }}
                className={cn(
                  "mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                  heroReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                Bill customers in seconds on 80mm thermal printers, manage stock across branches and warehouses, send WhatsApp khata statements, and get live Trial Balance &amp; P&amp;L—with built-in FBR digital invoicing.
              </p>

              <div
                style={{ transitionDelay: "170ms" }}
                className={cn(
                  "mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                  heroReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <Button
                  asChild
                  size="lg"
                  className="group h-12 px-7 text-base bg-[#2CA01C] hover:bg-[#248417] text-white font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                >
                  <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                    {isAuthenticated ? "Open Business Dashboard" : "Start 14-Day Free Trial"}
                    <IconArrowRight className="size-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 text-base font-semibold border-slate-300 dark:border-slate-700 text-[#0B2265] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <a href="#showcase">Try Interactive Demo</a>
                </Button>
              </div>

              <div
                style={{ transitionDelay: "250ms" }}
                className={cn(
                  "mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 text-xs sm:text-sm transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                  heroReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <div>
                  <span className="font-bold text-[#0B2265] dark:text-white block">14 Days Free</span>
                  <span className="text-slate-500">No credit card needed</span>
                </div>
                <div>
                  <span className="font-bold text-[#0B2265] dark:text-white block">FBR &amp; PRA Ready</span>
                  <span className="text-slate-500">QR fiscalized receipts</span>
                </div>
                <div>
                  <span className="font-bold text-[#0B2265] dark:text-white block">Auto Double-Entry</span>
                  <span className="text-slate-500">Balanced Dr = Cr books</span>
                </div>
              </div>
            </div>

            {/* Right: Live Animated Paperless ERP Workspace Card */}
            <div
              style={{ transitionDelay: "140ms" }}
              className={cn(
                "lg:col-span-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                heroReady ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-6 scale-[0.98]"
              )}
            >
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F5F8] dark:bg-slate-950 p-3 sm:p-4 shadow-md transition-shadow duration-300 hover:shadow-lg">
                {/* Window Chrome */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded bg-[#2CA01C] text-white flex items-center justify-center">
                      <IconBuildingStore className="size-3.5" />
                    </div>
                    <span className="text-xs font-bold text-[#0B2265] dark:text-white">
                      Madina Traders (Main Branch + Lahore Godown)
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2CA01C] bg-[#2CA01C]/10 px-2 py-0.5 rounded">
                    <span className="relative flex size-2">
                      <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-[#2CA01C] opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-[#2CA01C]" />
                    </span>
                    FBR Live Sync
                  </span>
                </div>

                {/* Animated KPI Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 transition-colors hover:border-[#2CA01C]/50">
                    <span className="text-xs font-medium text-slate-500">Today&apos;s POS Sales</span>
                    <div className="text-xl font-bold text-[#0B2265] dark:text-white mt-1 tabular-nums">
                      Rs. {animatedHeroSales.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-[#2CA01C] font-medium mt-0.5 block tabular-nums">
                      {liveInvoicesCount} invoices fiscalized today
                    </span>
                  </div>

                  <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 transition-colors hover:border-[#2CA01C]/50">
                    <span className="text-xs font-medium text-slate-500">Cash Drawer Tender</span>
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      Rs. {animatedDrawer.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Shift #04 active, till balanced
                    </span>
                  </div>

                  <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 transition-colors hover:border-[#2CA01C]/50">
                    <span className="text-xs font-medium text-slate-500">Customer Khata (AR)</span>
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      Rs. {animatedKhata.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      18 active party accounts
                    </span>
                  </div>

                  <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 transition-colors hover:border-[#2CA01C]/50">
                    <span className="text-xs font-medium text-slate-500">Inventory Valuation</span>
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      Rs. {animatedInventory.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      312 SKUs across 2 godowns
                    </span>
                  </div>
                </div>

                {/* Live Animated Activity Stream */}
                <div className="mt-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Live Auto-Posted Vouchers
                    </span>
                    <span className="text-[11px] font-semibold text-[#2CA01C]">
                      Trial Balance: Balanced
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {visibleFeed.map((tx, idx) => (
                      <div
                        key={`${tx.id}-${idx === 0 ? feedCursor : idx}`}
                        className={cn(
                          "px-3.5 py-2.5 flex items-center justify-between gap-2",
                          idx === 0 && "paperless-feed-enter"
                        )}
                      >
                        <div className="truncate">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{tx.ref}</span>
                          <span className="text-slate-500 ml-2">{tx.detail}</span>
                        </div>
                        <span
                          className={cn(
                            "font-bold tabular-nums shrink-0",
                            tx.isPositive ? "text-[#2CA01C]" : "text-slate-900 dark:text-white"
                          )}
                        >
                          {tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Corporate Navy Anchor Strip with Staggered Scroll Reveal */}
      <section className="bg-[#0B2265] text-white border-b border-[#0B2265]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-white/15">
            {[
              {
                step: "Step 1: Procurement",
                title: "Purchase GRN & Godowns",
                desc: "Receive cartons into warehouses, track supplier bills, split payments, and issue debit notes on returns.",
              },
              {
                step: "Step 2: Billing",
                title: "Thermal POS & FBR QR",
                desc: "Scan barcodes, apply wholesale or retail tiers, print 80mm Urdu/English receipts, and manage register shifts.",
              },
              {
                step: "Step 3: Recovery",
                title: "Party Khata & WhatsApp",
                desc: "Monitor 30/60/90 day aging, enforce credit limits, record cash wasooli, and send ledgers on WhatsApp.",
              },
              {
                step: "Step 4: Accounts",
                title: "Live Double-Entry Books",
                desc: "Every sale, purchase, return, and expense auto-posts balanced Journal Vouchers into your P&L and Balance Sheet.",
              },
            ].map((pillar, idx) => (
              <ScrollReveal
                key={pillar.title}
                delayMs={idx * 90}
                className={cn(
                  idx === 0 ? "lg:pr-6" : idx === 3 ? "lg:pl-6" : "lg:px-6"
                )}
              >
                <div className="text-xs font-semibold text-[#5EE04C]">{pillar.step}</div>
                <h2 className="text-base font-bold mt-1">{pillar.title}</h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{pillar.desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Interactive Product Tour with Smooth Panel Transitions */}
      <section id="showcase" className="py-16 lg:py-24 bg-[#F4F5F8] dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#2CA01C]">Interactive Product Tour</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B2265] dark:text-white mt-1">
                See how Paperless runs your daily operations
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
                Click through the tabs below—try adding items in the POS counter to watch live totals and accounting entries update smoothly.
              </p>
            </div>
          </ScrollReveal>

          {/* Clean Tab Navigation */}
          <ScrollReveal delayMs={80} className="flex flex-wrap gap-2 mb-4">
            {[
              { id: "pos", label: "Thermal POS Counter", icon: IconReceipt2 },
              { id: "khata", label: "Khata & WhatsApp", icon: IconBrandWhatsapp },
              { id: "purchases", label: "Purchases & Godown GRN", icon: IconPackages },
              { id: "statements", label: "Live P&L & Balance Sheet", icon: IconReportAnalytics },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as ShowcaseTab)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2CA01C]",
                    isActive
                      ? "bg-[#2CA01C] text-white border-[#2CA01C] shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:text-[#0B2265] hover:-translate-y-0.5"
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </ScrollReveal>

          {/* Animated Tab Surface */}
          <ScrollReveal delayMs={140}>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {/* TAB 1: INTERACTIVE POS COUNTER */}
              {activeTab === "pos" && (
                <div key="tab-pos" className="paperless-panel-enter p-5 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-lg font-bold text-[#0B2265] dark:text-white">
                        Interactive POS Counter Simulator
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Add or adjust items below to preview live checkout, payment split, and auto-posted accounting.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2CA01C] bg-[#2CA01C]/10 px-3 py-1 rounded-md self-start sm:self-auto">
                      <IconCash className="size-4" /> Active Shift Drawer: Rs. 45,000
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
                    {/* Product Catalogue */}
                    <div className="lg:col-span-7 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/70 rounded-md">
                        <span>Branch Stock Catalogue</span>
                        <span>Rate / Action</span>
                      </div>

                      {DEMO_POS_PRODUCTS.map((item) => {
                        const qty = demoCart[item.id] || 0;
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "flex items-center justify-between gap-3 p-3 rounded-lg border transition-all duration-200",
                              qty > 0
                                ? "border-[#2CA01C]/50 bg-[#2CA01C]/[0.03]"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                            )}
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {item.name}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                                SKU: {item.sku} | In Stock: {item.stock - qty} {item.unit}s
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                Rs. {item.price.toLocaleString()}
                              </span>
                              {qty > 0 ? (
                                <div className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
                                  <button
                                    type="button"
                                    aria-label={`Decrease quantity of ${item.name}`}
                                    onClick={() => updateDemoQty(item.id, -1)}
                                    className="size-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-transform active:scale-90"
                                  >
                                    <IconMinus className="size-3.5" />
                                  </button>
                                  <span className="w-6 text-center text-xs font-bold tabular-nums">{qty}</span>
                                  <button
                                    type="button"
                                    aria-label={`Increase quantity of ${item.name}`}
                                    onClick={() => updateDemoQty(item.id, 1)}
                                    className="size-7 flex items-center justify-center rounded bg-[#2CA01C] text-white hover:bg-[#248417] transition-transform active:scale-90"
                                  >
                                    <IconPlus className="size-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updateDemoQty(item.id, 1)}
                                  className="h-8 px-3 rounded-md border border-[#2CA01C] text-[#2CA01C] hover:bg-[#2CA01C] hover:text-white text-xs font-semibold transition-all duration-150 active:scale-95"
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Live Receipt & Double-Entry Panel */}
                    <div className="lg:col-span-5 flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F4F5F8] dark:bg-slate-950 p-4">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                          <span className="text-sm font-bold text-[#0B2265] dark:text-white">Current Counter Bill</span>
                          <span className="text-xs font-semibold text-slate-500 tabular-nums">
                            {demoCartLines.reduce((s, l) => s + l.qty, 0)} items
                          </span>
                        </div>

                        {/* Payment Mode Selector */}
                        <div className="grid grid-cols-3 gap-1.5 mt-3">
                          {[
                            { id: "cash", label: "Cash Till" },
                            { id: "raast", label: "Raast / Bank" },
                            { id: "khata", label: "Party Khata" },
                          ].map((mode) => (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => setDemoPayment(mode.id as "cash" | "raast" | "khata")}
                              className={cn(
                                "py-1.5 px-2 rounded-md text-xs font-semibold border transition-all duration-150 active:scale-95",
                                demoPayment === mode.id
                                  ? "bg-[#0B2265] text-white border-[#0B2265]"
                                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                              )}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>

                        <div className="mt-4 space-y-2 text-xs">
                          <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Items Subtotal</span>
                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                              Rs. {demoSubtotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Trade Discount</span>
                            <span className="font-semibold text-[#2CA01C] tabular-nums">
                              {demoDiscount > 0 ? `- Rs. ${demoDiscount.toLocaleString()}` : "Rs. 0"}
                            </span>
                          </div>
                          <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Net Payable</span>
                            <span className="text-2xl font-bold text-[#0B2265] dark:text-[#2CA01C] tabular-nums">
                              Rs. {animatedDemoPayable.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Live Auto-Posted Double-Entry Preview */}
                        <div className="mt-4 p-3 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] transition-colors">
                          <div className="font-semibold text-[#0B2265] dark:text-white mb-1.5">
                            Auto-Posted Journal Preview:
                          </div>
                          <div className="space-y-1 text-slate-600 dark:text-slate-400 tabular-nums">
                            <div className="flex justify-between">
                              <span key={demoPayment} className="paperless-row-enter">
                                Dr.{" "}
                                {demoPayment === "cash"
                                  ? "1010 Cash Drawer"
                                  : demoPayment === "raast"
                                  ? "1020 Bank / Raast"
                                  : "1030 Customer Khata (AR)"}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-white">
                                Rs. {demoNetPayable.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cr. 4010 Sales Revenue</span>
                              <span className="font-semibold text-slate-900 dark:text-white">
                                Rs. {demoNetPayable.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                              <span>Dr. 5010 COGS / Cr. 1040 Inventory</span>
                              <span className="font-semibold text-[#2CA01C]">
                                Rs. {demoCostTotal.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button
                          asChild
                          className="w-full h-10 bg-[#2CA01C] hover:bg-[#248417] text-white font-semibold gap-2 transition-transform active:scale-[0.98]"
                        >
                          <Link href={isAuthenticated ? "/pos" : "/register"}>
                            <IconPrinter className="size-4" />
                            {isAuthenticated ? "Open Live POS Counter" : "Try Real POS Free for 14 Days"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KHATA & WHATSAPP */}
              {activeTab === "khata" && (
                <div key="tab-khata" className="paperless-panel-enter p-5 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-lg font-bold text-[#0B2265] dark:text-white">
                        Party Khata Ledger &amp; 1-Click WhatsApp Statements
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Track credit limits, 30/60/90 day aging buckets, and share English, Urdu, or Bilingual statements on WhatsApp.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#2CA01C] px-3 py-1.5 rounded-md self-start sm:self-auto">
                      <IconBrandWhatsapp className="size-4" /> Urdu + English Statements
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs text-slate-500">0–30 Days (Current)</span>
                      <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">Rs. 342,000</div>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs text-slate-500">31–60 Days</span>
                      <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">Rs. 164,500</div>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs text-slate-500">61–90+ Days Overdue</span>
                      <div className="text-base font-bold text-rose-600 mt-0.5 tabular-nums">Rs. 92,290</div>
                    </div>
                    <div className="p-3 rounded-lg border border-[#2CA01C]/30 bg-[#2CA01C]/5">
                      <span className="text-xs text-[#2CA01C] font-semibold">Wasooli This Month</span>
                      <div className="text-base font-bold text-[#0B2265] dark:text-white mt-0.5 tabular-nums">Rs. 815,000</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">Customer / Shop</th>
                          <th className="py-2.5 px-4 font-semibold">Route / Market</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Credit Limit</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Current Baqaya</th>
                          <th className="py-2.5 px-4 font-semibold text-center">WhatsApp Ledger</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">Bismillah Traders</td>
                          <td className="py-3 px-4 text-slate-500">Shah Alam Market, Lahore</td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-600">Rs. 250,000</td>
                          <td className="py-3 px-4 text-right font-bold text-rose-600 tabular-nums">Rs. 85,000</td>
                          <td className="py-3 px-4 text-center text-[#2CA01C] font-semibold">Sent (Bilingual)</td>
                        </tr>
                        <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">Madina General Store</td>
                          <td className="py-3 px-4 text-slate-500">Gulshan-e-Iqbal, Karachi</td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-600">Rs. 100,000</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">Rs. 37,190</td>
                          <td className="py-3 px-4 text-center text-[#2CA01C] font-semibold">Delivered</td>
                        </tr>
                        <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">Al-Fatah Supermarket</td>
                          <td className="py-3 px-4 text-slate-500">DHA Phase 1–6, Lahore</td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-600">Rs. 500,000</td>
                          <td className="py-3 px-4 text-right font-bold text-[#2CA01C] tabular-nums">Rs. 0 (Cleared)</td>
                          <td className="py-3 px-4 text-center text-slate-500">Ready</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: PURCHASES & GODOWN GRN */}
              {activeTab === "purchases" && (
                <div key="tab-purchases" className="paperless-panel-enter p-5 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-lg font-bold text-[#0B2265] dark:text-white">
                        Multi-Godown Purchases (GRN) &amp; Supplier Debit Notes
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Receive cartons into separate warehouses, split payments across Cash/Bank/Khata, and return damaged stock cleanly.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#0B2265] dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md self-start sm:self-auto">
                      Carton ↔ Piece Auto-Conversion
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2CA01C]/50">
                      <span className="text-xs font-semibold text-slate-500">1. Goods Received (GRN)</span>
                      <div className="text-base font-bold text-[#0B2265] dark:text-white mt-1">
                        PUR-202611-0042, Dalda Foods
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                        20 Cartons (240 Pieces) received into Main Godown with Supplier Bill Ref &amp; automatic unit cost update.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2CA01C]/50">
                      <span className="text-xs font-semibold text-slate-500">2. Payment Allocation</span>
                      <div className="text-base font-bold text-[#2CA01C] mt-1 tabular-nums">
                        Rs. 50,000 Paid / Rs. 35,000 Due
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                        Meezan Bank account credited for Rs. 50,000; remaining Rs. 35,000 posted to Supplier Payable (2010).
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2CA01C]/50">
                      <span className="text-xs font-semibold text-slate-500">3. Return &amp; Debit Note</span>
                      <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        2 Damaged Cans Returned
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                        Deducts exact warehouse stock and posts a reversing Debit Note reducing your Supplier Khata balance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: FINANCIAL STATEMENTS */}
              {activeTab === "statements" && (
                <div key="tab-statements" className="paperless-panel-enter p-5 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-lg font-bold text-[#0B2265] dark:text-white">
                        Live Profit &amp; Loss, Trial Balance &amp; Balance Sheet
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Consolidated across all branches or filtered by single shop—ready to print or export to CSV anytime.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2CA01C] bg-[#2CA01C]/10 px-3 py-1.5 rounded-md self-start sm:self-auto">
                      <IconScale className="size-4" /> Assets = Liabilities + Equity (Diff: Rs. 0.00)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors hover:border-slate-300">
                      <span className="text-xs font-medium text-slate-500">Net Operating Revenue</span>
                      <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">Rs. 1,480,000</div>
                      <span className="text-xs text-slate-500 mt-1 block">Account 4010</span>
                    </div>
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors hover:border-slate-300">
                      <span className="text-xs font-medium text-slate-500">Cost of Goods Sold</span>
                      <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">Rs. 1,120,000</div>
                      <span className="text-xs text-slate-500 mt-1 block">Account 5010 (75.6%)</span>
                    </div>
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors hover:border-slate-300">
                      <span className="text-xs font-medium text-slate-500">Operating Expenses</span>
                      <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">Rs. 64,500</div>
                      <span className="text-xs text-slate-500 mt-1 block">Rent, Utilities, Staff</span>
                    </div>
                    <div className="p-4 rounded-lg border border-[#2CA01C]/40 bg-[#2CA01C]/5">
                      <span className="text-xs font-semibold text-[#2CA01C]">Net Profit</span>
                      <div className="text-xl font-bold text-[#0B2265] dark:text-[#2CA01C] mt-1 tabular-nums">Rs. 295,500</div>
                      <span className="text-xs text-[#2CA01C] font-medium mt-1 block">19.9% Net Margin</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. Deep-Dive Business Workflows with Directional Scroll Reveals */}
      <section id="workflows" className="py-16 lg:py-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="max-w-2xl mb-14">
            <p className="text-sm font-semibold text-[#2CA01C]">Purpose-Built for Pakistani Trade</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B2265] dark:text-white mt-1">
              Every module reflects how real shops and godowns work
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
              No workarounds or foreign accounting jargon. From carton-to-piece stock conversions to Roznamcha cash drawers and Urdu thermal bills.
            </p>
          </ScrollReveal>

          {/* Editorial Showcase: POS & Daily Cash Register */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pb-16 border-b border-slate-200 dark:border-slate-800">
            <ScrollReveal direction="left" className="lg:col-span-5">
              <span className="text-xs font-semibold text-[#2CA01C]">Retail Counter &amp; Daily Cash Register</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#0B2265] dark:text-white mt-1.5">
                Close your counter shift with exact cash reconciliation
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                Cashiers open a shift with opening cash, scan barcodes for instant 80mm thermal receipts, and log petty cash expenses directly. At night, your Daily Cash Register (Roznamcha) shows exact cash in drawer versus bank and Raast transfers.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <IconCheck className="size-4 text-[#2CA01C] shrink-0 mt-1" />
                  <span>80mm &amp; 58mm thermal printing in English, Urdu, or Bilingual format</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <IconCheck className="size-4 text-[#2CA01C] shrink-0 mt-1" />
                  <span>Live branch stock enforcement prevents overselling out-of-stock SKUs</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <IconCheck className="size-4 text-[#2CA01C] shrink-0 mt-1" />
                  <span>FBR Tier-1 Digital Tax QR Code &amp; NTN/STRN on every invoice</span>
                </li>
              </ul>
            </ScrollReveal>

            <ScrollReveal direction="right" delayMs={120} className="lg:col-span-7">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F5F8] dark:bg-slate-950 p-5 transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-[#0B2265] dark:text-white">
                    Daily Cash Register (Roznamcha) — Today
                  </span>
                  <span className="text-xs font-semibold text-slate-500">All Branches Consolidated</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 transition-transform duration-200 hover:-translate-y-0.5">
                    <span className="text-[11px] text-slate-500">Opening Cash</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">Rs. 25,000</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 transition-transform duration-200 hover:-translate-y-0.5">
                    <span className="text-[11px] text-slate-500">Cash In (Sales + Wasooli)</span>
                    <div className="text-base font-bold text-[#2CA01C] mt-0.5 tabular-nums">+Rs. 142,800</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 transition-transform duration-200 hover:-translate-y-0.5">
                    <span className="text-[11px] text-slate-500">Cash Out (Payouts + CPV)</span>
                    <div className="text-base font-bold text-rose-600 mt-0.5 tabular-nums">-Rs. 38,500</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-[#0B2265]/20 p-3 transition-transform duration-200 hover:-translate-y-0.5">
                    <span className="text-[11px] text-slate-500">Closing Cash in Till</span>
                    <div className="text-base font-bold text-[#0B2265] dark:text-white mt-0.5 tabular-nums">Rs. 129,300</div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-500">Channel Breakdown:</span>
                  <div className="flex flex-wrap gap-2 tabular-nums">
                    <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                      Cash: Rs. 129,300
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                      Bank: Rs. 64,000
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                      Raast: Rs. 18,450
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                      Card: Rs. 12,200
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Hairline-Bordered Specification Grid with Staggered Reveal */}
          <div className="pt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-slate-200 dark:border-slate-800 divide-y md:divide-y-0 gap-y-10 gap-x-10">
            {[
              {
                icon: IconPackages,
                title: "Multi-Godown Stock & UOM",
                desc: "Buy in Cartons or Bags, sell in Pieces or Boxes. Track stock across retail shops and godowns with full bin-card movement history.",
              },
              {
                icon: IconArrowBackUp,
                title: "Purchase Returns & Debit Notes",
                desc: "Return damaged or expired stock partially or in full. Paperless deducts warehouse inventory and adjusts supplier payable ledgers automatically.",
              },
              {
                icon: IconArrowsExchange,
                title: "Inter-Branch Stock Transfers",
                desc: "Move stock from central godown to retail counters or delivery vans with numbered transfer slips and instant branch-level stock updates.",
              },
              {
                icon: IconUserShield,
                title: "Granular Staff Roles (RBAC)",
                desc: "Control exactly who can view profit margins, edit purchase bills, issue discounts, or post manual journal vouchers across your team.",
              },
              {
                icon: IconRoute,
                title: "Delivery Routes & Areas",
                desc: "Organize wholesale customers by market beat and delivery route so order bookers and recovery teams stay on schedule.",
              },
              {
                icon: IconBuildingBank,
                title: "Bank Reconciliation & Year-End",
                desc: "Match bank statements against recorded vouchers (BRS) and run guided fiscal year-end closing into Retained Earnings with full audit trail.",
              },
            ].map((spec, idx) => {
              const Icon = spec.icon;
              return (
                <ScrollReveal key={spec.title} delayMs={idx * 70} className="group pt-2">
                  <div className="flex items-center gap-2 text-[#0B2265] dark:text-white font-bold text-base">
                    <Icon className="size-5 text-[#2CA01C] transition-transform duration-200 group-hover:scale-110" />
                    {spec.title}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {spec.desc}
                  </p>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Dedicated Double-Entry Accounting Section with Cascading Voucher Rows */}
      <section id="accounting" className="py-16 lg:py-24 bg-[#F4F5F8] dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <ScrollReveal direction="left" className="lg:col-span-5">
              <p className="text-sm font-semibold text-[#2CA01C]">Zero-Touch Double-Entry Engine</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B2265] dark:text-white mt-1">
                IFRS-grade accounting without manual data entry
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                Your staff never need to understand debits and credits. Select a daily business event below to watch the exact Journal Voucher post automatically behind the scenes.
              </p>

              <div className="mt-6 space-y-2">
                {(["sale", "purchase", "expense"] as JournalEventKey[]).map((key) => {
                  const ev = JOURNAL_EXAMPLES[key];
                  const isActive = activeJournal === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveJournal(key)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-lg border transition-all duration-200 active:scale-[0.99]",
                        isActive
                          ? "bg-white dark:bg-slate-900 border-[#2CA01C] shadow-xs translate-x-1"
                          : "bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("text-sm font-bold", isActive ? "text-[#0B2265] dark:text-white" : "text-slate-700 dark:text-slate-300")}>
                          {ev.title}
                        </span>
                        {isActive && (
                          <span className="text-[11px] font-semibold text-[#2CA01C]">Active JV</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{ev.trigger}</p>
                    </button>
                  );
                })}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delayMs={120} className="lg:col-span-7">
              <div
                key={activeJournal}
                className="paperless-panel-enter rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <IconFileInvoice className="size-4 text-[#2CA01C]" />
                      <span className="text-sm font-bold text-[#0B2265] dark:text-white">
                        {selectedJournal.voucherNo}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{selectedJournal.source}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2CA01C] bg-[#2CA01C]/10 px-2.5 py-1 rounded">
                    <IconCheck className="size-3.5" /> Balanced (Dr = Cr)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <tr>
                        <th className="py-3 px-5 font-semibold">Code</th>
                        <th className="py-3 px-5 font-semibold">Account Head</th>
                        <th className="py-3 px-5 font-semibold text-right">Debit (PKR)</th>
                        <th className="py-3 px-5 font-semibold text-right">Credit (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                      {selectedJournal.lines.map((line, idx) => (
                        <tr
                          key={`${activeJournal}-${line.code}-${idx}`}
                          style={{ animationDelay: `${idx * 55}ms` }}
                          className="paperless-row-enter hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-5 font-medium text-slate-500">{line.code}</td>
                          <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">{line.account}</td>
                          <td className="py-3 px-5 text-right font-semibold text-slate-900 dark:text-white">
                            {line.debit > 0 ? line.debit.toLocaleString() : "—"}
                          </td>
                          <td className="py-3 px-5 text-right font-semibold text-slate-900 dark:text-white">
                            {line.credit > 0 ? line.credit.toLocaleString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800/60 border-t-2 border-slate-200 dark:border-slate-700 font-bold tabular-nums">
                      <tr>
                        <td colSpan={2} className="py-3 px-5 text-right text-slate-700 dark:text-slate-200">
                          Journal Totals
                        </td>
                        <td className="py-3 px-5 text-right text-[#0B2265] dark:text-white">
                          Rs. {journalTotal.toLocaleString()}
                        </td>
                        <td className="py-3 px-5 text-right text-[#0B2265] dark:text-white">
                          Rs. {journalTotal.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="px-5 py-3.5 bg-[#2CA01C]/[0.06] border-t border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200">
                  <span className="font-bold text-[#2CA01C] mr-1.5">Live Impact:</span>
                  {selectedJournal.impact}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 7. Transparent PKR Pricing Section with Animated Price Counter & Card Lift */}
      <section id="pricing" className="py-16 lg:py-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#2CA01C]">Transparent PKR Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B2265] dark:text-white mt-1">
                Plans built for single shops to multi-city chains
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
                Start with a full 14-day evaluation. Upgrade, downgrade, or cancel anytime with no hidden setup fees.
              </p>
            </div>

            {/* Annual vs Monthly Toggle */}
            <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-4 py-2 rounded-md text-xs font-semibold transition-all duration-200",
                  billingCycle === "monthly"
                    ? "bg-white dark:bg-slate-900 text-[#0B2265] dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-4 py-2 rounded-md text-xs font-semibold transition-all duration-200 flex items-center gap-1.5",
                  billingCycle === "yearly"
                    ? "bg-[#2CA01C] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                Annual
                <span
                  className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded font-bold transition-colors",
                    billingCycle === "yearly" ? "bg-white text-[#2CA01C]" : "bg-[#2CA01C]/10 text-[#2CA01C]"
                  )}
                >
                  Save 20%
                </span>
              </button>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan, pIdx) => {
              const isHighlight = plan.is_highlighted;
              const isFreeTrial = plan.price_monthly === 0;
              const effectivePrice = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;

              return (
                <ScrollReveal key={plan.id || plan.slug} delayMs={pIdx * 80} className="flex">
                  <div
                    className={cn(
                      "w-full flex flex-col justify-between rounded-xl border bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                      isHighlight
                        ? "border-2 border-[#2CA01C] shadow-md"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    )}
                  >
                    <div className={cn("h-1.5 w-full", isHighlight ? "bg-[#2CA01C]" : "bg-transparent")} />

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-500">
                          {plan.badge_label || (isFreeTrial ? "14-Day Evaluation" : "Business Plan")}
                        </span>
                        {isHighlight && (
                          <span className="text-[11px] font-bold bg-[#2CA01C]/10 text-[#2CA01C] px-2 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-[#0B2265] dark:text-white mt-1.5">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 min-h-[36px] leading-relaxed">
                        {plan.description}
                      </p>

                      <div className="my-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                            <AnimatedPrice value={effectivePrice} />
                          </span>
                          <span className="text-xs text-slate-500">
                            {isFreeTrial ? "/ 14 days" : "/ month"}
                          </span>
                        </div>
                        {!isFreeTrial && billingCycle === "yearly" && (
                          <span className="text-xs text-[#2CA01C] font-medium block mt-1">
                            Billed annually (20% off)
                          </span>
                        )}
                      </div>

                      <ul className="space-y-2.5 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 flex-1">
                        {(plan.features || []).map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <IconCheck className="size-4 shrink-0 text-[#2CA01C] mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button
                          asChild
                          variant={isHighlight ? "default" : "outline"}
                          className={cn(
                            "w-full font-semibold text-sm h-10 transition-all duration-200 active:scale-[0.98]",
                            isHighlight
                              ? "bg-[#2CA01C] hover:bg-[#248417] text-white"
                              : "border-[#0B2265] text-[#0B2265] hover:bg-[#0B2265] hover:text-white dark:border-slate-600 dark:text-slate-100"
                          )}
                        >
                          <Link href={`/register?plan=${plan.slug}`}>
                            {isFreeTrial ? "Start 14-Day Free Trial" : `Choose ${plan.name}`}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Final Conversion Band */}
      <section className="bg-[#0B2265] text-white py-16">
        <ScrollReveal className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to bring your shop, godown, and accounts into one workspace?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Built for high-volume retail and wholesale markets across Lahore, Karachi, Rawalpindi, Faisalabad, and Peshawar.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="group w-full sm:w-auto h-12 px-8 text-base bg-[#2CA01C] hover:bg-[#248417] text-white font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                {isAuthenticated ? "Go to Business Dashboard" : "Start 14-Day Free Trial"}
                <IconArrowRight className="size-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
            {!isAuthenticated && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-7 text-base font-semibold bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white transition-all duration-200 hover:-translate-y-0.5"
              >
                <Link href="/login">Sign In to Existing Account</Link>
              </Button>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* 9. Structured Corporate Footer */}
      <footer className="py-10 bg-white dark:bg-slate-900 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded bg-[#2CA01C] text-white flex items-center justify-center font-bold">
              P
            </div>
            <span className="font-bold text-[#0B2265] dark:text-white">Paperless ERP</span>
            <span>— POS, Multi-Godown Inventory &amp; IFRS Double-Entry Accounting</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <a href="#showcase" className="hover:text-[#0B2265] dark:hover:text-white transition-colors">
              Interactive Demo
            </a>
            <a href="#workflows" className="hover:text-[#0B2265] dark:hover:text-white transition-colors">
              Modules
            </a>
            <a href="#accounting" className="hover:text-[#0B2265] dark:hover:text-white transition-colors">
              Accounting
            </a>
            <a href="#pricing" className="hover:text-[#0B2265] dark:hover:text-white transition-colors">
              Pricing
            </a>
            <Link href="/login" className="hover:text-[#0B2265] dark:hover:text-white transition-colors">
              Sign In
            </Link>
            <span className="text-slate-400">© 2026 MetricNests</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
