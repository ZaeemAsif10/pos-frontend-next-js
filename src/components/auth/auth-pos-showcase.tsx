"use client";

import * as React from "react";
import {
  IconBarcode,
  IconBrandWhatsapp,
  IconCash,
  IconCheck,
  IconPackages,
  IconPrinter,
  IconReceipt2,
  IconScale,
  IconShieldCheck,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface PosSaleScenario {
  id: string;
  tenderKey: "cash" | "raast" | "khata";
  tenderLabel: string;
  party: string;
  tierBadge: string;
  invoiceNo: string;
  fbrCode: string;
  total: number;
  receiptPaidLabel: string;
  whatsappTag: string;
  syncStock: string;
  syncLedger: string;
  voucherNo: string;
  qrRows: string[];
  items: {
    name: string;
    sku: string;
    rate: string;
    qty: string;
    amount: string;
  }[];
}

const POS_SCENARIOS: PosSaleScenario[] = [
  {
    id: "cash-wholesale",
    tenderKey: "cash",
    tenderLabel: "Cash",
    party: "Rahman Traders",
    tierBadge: "Wholesale Rate",
    invoiceNo: "#INV-0842",
    fbrCode: "#948210-LHR",
    total: 24190,
    receiptPaidLabel: "Paid Cash",
    whatsappTag: "Sent PDF",
    syncStock: "Godown #2 Stock",
    syncLedger: "Roznamcha Cash",
    voucherNo: "JV-0842",
    qrRows: [
      "1111111010101111111",
      "1000001001001000001",
      "1011101011101011101",
      "1011101000101011101",
      "1011101010001011101",
      "1000001001101000001",
      "1111111010101111111",
      "0000000011000000000",
      "1101011101110101101",
      "0110100010001010010",
      "1011011011101101111",
      "0000000010101001010",
      "1111111001101110101",
      "1000001010010001110",
      "1011101011101111001",
      "1011101001010100110",
      "1011101010111011101",
      "1000001001100101010",
      "1111111011011010111",
    ],
    items: [
      {
        name: "Dalda Cooking Oil 1L × 12",
        sku: "CTN-8961",
        rate: "Rs. 6,240 ctn",
        qty: "2 CTN",
        amount: "12,480",
      },
      {
        name: "Tapal Danedar 900g Family",
        sku: "SKU-4410",
        rate: "Rs. 1,550 pc",
        qty: "6 PCS",
        amount: "9,300",
      },
      {
        name: "Guard Basmati Supreme 5kg",
        sku: "SKU-1092",
        rate: "Rs. 2,410 bag",
        qty: "1 BAG",
        amount: "2,410",
      },
    ],
  },
  {
    id: "raast-retail",
    tenderKey: "raast",
    tenderLabel: "Raast QR",
    party: "Al-Fatah Superstore",
    tierBadge: "Retail Counter",
    invoiceNo: "#INV-0843",
    fbrCode: "#948211-LHR",
    total: 19920,
    receiptPaidLabel: "Paid Raast",
    whatsappTag: "Sent PDF",
    syncStock: "Main Shop Stock",
    syncLedger: "Meezan Raast Bank",
    voucherNo: "JV-0843",
    qrRows: [
      "1111111001101111111",
      "1000001010101000001",
      "1011101001001011101",
      "1011101011101011101",
      "1011101001101011101",
      "1000001010001000001",
      "1111111010101111111",
      "0000000001100000000",
      "1011001110101101011",
      "0101110001010010100",
      "1110101101110111010",
      "0000000011010010111",
      "1111111010011011010",
      "1000001001100110101",
      "1011101010111001110",
      "1011101011001110011",
      "1011101000101011100",
      "1000001011010100111",
      "1111111001101101010",
    ],
    items: [
      {
        name: "Olper's Full Cream 1L × 12",
        sku: "CTN-3302",
        rate: "Rs. 3,720 ctn",
        qty: "3 CTN",
        amount: "11,160",
      },
      {
        name: "Mezan Canola Oil 5L Tin",
        sku: "SKU-7784",
        rate: "Rs. 2,820 tin",
        qty: "2 TIN",
        amount: "5,640",
      },
      {
        name: "National Mixed Pickle 1kg",
        sku: "SKU-2190",
        rate: "Rs. 780 pc",
        qty: "4 PCS",
        amount: "3,120",
      },
    ],
  },
  {
    id: "khata-distributor",
    tenderKey: "khata",
    tenderLabel: "Party Khata",
    party: "Madina Cash & Carry",
    tierBadge: "Distributor Tier",
    invoiceNo: "#INV-0844",
    fbrCode: "#948212-LHR",
    total: 34420,
    receiptPaidLabel: "Khata Due",
    whatsappTag: "Ledger Sent",
    syncStock: "Godown #1 Stock",
    syncLedger: "Party Receivable",
    voucherNo: "JV-0844",
    qrRows: [
      "1111111011001111111",
      "1000001000101000001",
      "1011101010101011101",
      "1011101011001011101",
      "1011101000101011101",
      "1000001011101000001",
      "1111111010101111111",
      "0000000010100000000",
      "1110110011011010110",
      "0011001100100101101",
      "1010111010111010011",
      "0000000001101101100",
      "1111111011010110011",
      "1000001000111001101",
      "1011101011100110110",
      "1011101001011001101",
      "1011101010101110010",
      "1000001011001011101",
      "1111111000110100111",
    ],
    items: [
      {
        name: "Vital Tea 475g Pouch × 12",
        sku: "CTN-5520",
        rate: "Rs. 16,900 ctn",
        qty: "1 CTN",
        amount: "16,900",
      },
      {
        name: "Surf Excel Matic 2kg Pack",
        sku: "SKU-6014",
        rate: "Rs. 1,350 pc",
        qty: "8 PCS",
        amount: "10,800",
      },
      {
        name: "Shan Biryani Masala × 24",
        sku: "BOX-1180",
        rate: "Rs. 3,360 box",
        qty: "2 BOX",
        amount: "6,720",
      },
    ],
  },
];

function useAnimatedTotal(target: number, duration = 420) {
  const [display, setDisplay] = React.useState(target);
  const previousRef = React.useRef(target);

  React.useEffect(() => {
    const startValue = previousRef.current;
    if (startValue === target) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      previousRef.current = target;
      setDisplay(target);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth cubic ease-out (no bounce)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);
      setDisplay(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        previousRef.current = target;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return display;
}

function FbrQrMatrix({ rows }: { rows: string[] }) {
  return (
    <svg
      viewBox="0 0 19 19"
      className="size-12 shrink-0 text-slate-900"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {rows.map((row, y) =>
        row
          .split("")
          .map((bit, x) =>
            bit === "1" ? (
              <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
            ) : null
          )
      )}
    </svg>
  );
}

function ThermalBarcode() {
  const widths = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 2, 2];
  let cursor = 0;

  return (
    <svg
      viewBox="0 0 58 14"
      className="h-3.5 w-full text-slate-800"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {widths.map((w, idx) => {
        const x = cursor;
        cursor += w + (idx % 2 === 0 ? 1 : 1.4);
        return idx % 2 === 0 ? (
          <rect key={idx} x={x} y={0} width={w} height={14} fill="currentColor" />
        ) : null;
      })}
    </svg>
  );
}

export function AuthPosShowcase() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);

  const scenario = POS_SCENARIOS[activeIndex];
  const animatedTotal = useAnimatedTotal(scenario.total);

  // Auto-cycle POS checkout scenarios every 4.6s unless hovered or reduced-motion
  React.useEffect(() => {
    if (isPaused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % POS_SCENARIOS.length);
    }, 4600);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  // Brief scanner pulse whenever a new invoice loads
  React.useEffect(() => {
    setIsScanning(true);
    const timer = window.setTimeout(() => setIsScanning(false), 950);
    return () => window.clearTimeout(timer);
  }, [activeIndex]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative flex w-full flex-col justify-between overflow-hidden rounded-[26px] bg-[#0F2E18] px-7 py-7 xl:px-10 xl:py-9 text-white ring-1 ring-[#2CA01C]/25"
    >
      <style>{`
        @keyframes posGlowDriftA {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-22px, 18px, 0) scale(1.07); }
        }
        @keyframes posGlowDriftB {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(24px, -16px, 0) scale(1.06); }
        }
        @keyframes posItemSlideIn {
          0% { opacity: 0; transform: translate3d(0, 8px, 0); background-color: rgba(44, 160, 28, 0.09); }
          55% { opacity: 1; transform: translate3d(0, 0, 0); background-color: rgba(44, 160, 28, 0.05); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); background-color: transparent; }
        }
        @keyframes posReceiptFeed {
          0% { opacity: 0.45; transform: translate3d(0, 14px, 0) rotate(1.4deg); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) rotate(1.4deg); }
        }
        @keyframes posReceiptFloat {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(1.4deg); }
          50% { transform: translate3d(0, -5px, 0) rotate(0.8deg); }
        }
        @keyframes posQrLaser {
          0% { transform: translateY(0px); opacity: 0; }
          20% { opacity: 0.95; }
          80% { opacity: 0.95; }
          100% { transform: translateY(46px); opacity: 0; }
        }
        @keyframes posChargeSheen {
          0% { transform: translateX(-130%) skewX(-18deg); }
          100% { transform: translateX(260%) skewX(-18deg); }
        }
        @keyframes posCycleProgress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pos-anim-glow-a,
          .pos-anim-glow-b,
          .pos-anim-item,
          .pos-anim-receipt,
          .pos-anim-float,
          .pos-anim-laser,
          .pos-anim-sheen,
          .pos-anim-progress {
            animation: none !important;
          }
        }
      `}</style>

      {/* Rich Tonal Botanical Illumination with Smooth Drift */}
      <div
        aria-hidden="true"
        style={{ animation: "posGlowDriftA 11s ease-in-out infinite" }}
        className="pos-anim-glow-a pointer-events-none absolute -top-28 -right-24 size-[420px] rounded-full bg-[#2CA01C]/24 blur-3xl"
      />
      <div
        aria-hidden="true"
        style={{ animation: "posGlowDriftB 13s ease-in-out infinite" }}
        className="pos-anim-glow-b pointer-events-none absolute -bottom-32 -left-20 size-[380px] rounded-full bg-[#1F6A2E]/38 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      {/* Top Status Strip */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#163F22] px-3 py-1 text-xs font-medium text-[#E4F4E6] ring-1 ring-white/15">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-[#4ADE80]" />
          </span>
          <span>Cloud POS, Godown &amp; Accounting</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2CA01C]/25 px-2.5 py-1 text-[11px] font-semibold text-[#B9F4C2] ring-1 ring-[#2CA01C]/40">
          <IconShieldCheck className="size-3.5" />
          <span>FBR Digital Ready</span>
        </div>
      </div>

      {/* Centerpiece: Headline + Live Animated POS Counter & 80mm Thermal Receipt */}
      <div className="relative z-10 my-auto py-3 space-y-5">
        <div className="max-w-lg space-y-2">
          <h2 className="text-2xl xl:text-[28px] font-bold tracking-tight text-white leading-[1.2]">
            High-speed POS billing built for retail counters &amp; wholesale godowns.
          </h2>
          <p className="text-[13px] xl:text-sm text-[#C7E2CA] leading-relaxed">
            Scan cartons or single units, print 80mm thermal receipts, send WhatsApp khata bills, and post balanced accounts in one click.
          </p>
        </div>

        {/* Staggered POS Register + Printed 80mm Receipt Composition */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-12 items-end">
            {/* Main Live POS Register Screen (Cols 1-8) */}
            <div className="col-span-8 z-10 rounded-xl bg-white text-slate-900 shadow-[0_20px_50px_rgba(5,20,10,0.42)] ring-1 ring-black/5 overflow-hidden">
              {/* POS Window Header */}
              <div className="relative flex items-center justify-between bg-[#142619] px-3.5 py-2.5 text-white">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-[#2CA01C] text-white">
                    <IconReceipt2 className="size-3.5" />
                  </span>
                  <span className="truncate text-xs font-semibold">
                    Counter #01 — Al-Madina Mart
                  </span>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors duration-300",
                    isScanning
                      ? "bg-[#2CA01C]/35 text-white ring-1 ring-[#4ADE80]/50"
                      : "bg-white/10 text-[#9AE6A6]"
                  )}
                >
                  <IconBarcode className={cn("size-3", isScanning && "motion-safe:animate-pulse")} />
                  <span>{isScanning ? "Scanning SKU..." : "Scanner Ready"}</span>
                </span>

                {/* Subtle Auto-Cycle Progress Line */}
                {!isPaused && (
                  <div
                    key={`prog-${scenario.id}`}
                    style={{ animation: "posCycleProgress 4.6s linear forwards" }}
                    className="pos-anim-progress pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left bg-[#4ADE80]/80"
                  />
                )}
              </div>

              {/* Active Party & Tier Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-[#F6FAF6] px-3.5 py-1.5 text-[11px]">
                <span className="font-medium text-slate-700 truncate">
                  Party:{" "}
                  <strong
                    key={`party-${scenario.id}`}
                    className="font-semibold text-slate-900 transition-opacity duration-300"
                  >
                    {scenario.party}
                  </strong>
                </span>
                <span className="shrink-0 rounded bg-[#2CA01C]/12 px-1.5 py-0.5 text-[10px] font-bold text-[#1F7A14]">
                  {scenario.tierBadge}
                </span>
              </div>

              {/* Scanned Line Items with Staggered Barcode Scan Reveal */}
              <div key={`items-${scenario.id}`} className="divide-y divide-slate-100 text-xs">
                {scenario.items.map((item, idx) => (
                  <div
                    key={item.sku}
                    style={{
                      animation: `posItemSlideIn 520ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * 85}ms both`,
                    }}
                    className="pos-anim-item flex items-center justify-between px-3.5 py-2 gap-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900">{item.name}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 tabular-nums">
                        <span>{item.sku}</span>
                        <span className="text-slate-300">/</span>
                        <span>{item.rate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 tabular-nums">
                        {item.qty}
                      </span>
                      <span className="font-bold text-slate-900 tabular-nums w-[68px] text-right">
                        {item.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Tender Mode Pills + Animated Charge Action */}
              <div className="border-t border-slate-200/80 bg-slate-50 p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-1.5 text-[10px]">
                  <div className="flex items-center gap-1">
                    {POS_SCENARIOS.map((mode, idx) => {
                      const active = idx === activeIndex;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setActiveIndex(idx)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-2 py-0.5 transition-all duration-200",
                            active
                              ? "bg-[#2CA01C]/14 font-bold text-[#1E7A14] ring-1 ring-[#2CA01C]/35 shadow-2xs"
                              : "bg-white font-medium text-slate-500 ring-1 ring-slate-200 hover:text-slate-800"
                          )}
                        >
                          {mode.tenderKey === "cash" && <IconCash className="size-3" />}
                          <span>{mode.tenderLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-slate-500 font-medium tabular-nums">3 Items</span>
                </div>

                <div className="relative overflow-hidden flex items-center justify-between rounded-lg bg-[#2CA01C] px-3 py-2 text-white shadow-xs">
                  {/* Subtle Charge Shimmer Sweep on Bill Print */}
                  <span
                    key={`sheen-${scenario.id}`}
                    aria-hidden="true"
                    style={{ animation: "posChargeSheen 1.1s cubic-bezier(0.22, 1, 0.36, 1) 220ms both" }}
                    className="pos-anim-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  />
                  <span className="relative z-10 inline-flex items-center gap-1.5 text-xs font-semibold">
                    <IconPrinter className="size-3.5" />
                    <span>Charge &amp; Print</span>
                    <kbd className="rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-semibold">
                      F9
                    </kbd>
                  </span>
                  <span className="relative z-10 text-sm font-bold tabular-nums">
                    Rs. {animatedTotal.toLocaleString("en-PK")}
                  </span>
                </div>
              </div>
            </div>

            {/* Overlapping Tactile 80mm Thermal Receipt Slip with Paper Feed & Gentle Float */}
            <div
              style={{ animation: "posReceiptFloat 5.5s ease-in-out infinite" }}
              className="pos-anim-float col-span-4 -ml-3 mb-1.5 z-20 transition-transform duration-300 hover:!rotate-0"
            >
              <div
                key={`receipt-${scenario.id}`}
                style={{ animation: "posReceiptFeed 460ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
                className="pos-anim-receipt"
              >
                {/* Serrated Thermal Paper Tear Top */}
                <svg
                  viewBox="0 0 120 6"
                  preserveAspectRatio="none"
                  className="block h-1.5 w-full text-white drop-shadow-xs"
                  aria-hidden="true"
                >
                  <polygon
                    fill="currentColor"
                    points="0,6 4,0 8,6 12,0 16,6 20,0 24,6 28,0 32,6 36,0 40,6 44,0 48,6 52,0 56,6 60,0 64,6 68,0 72,6 76,0 80,6 84,0 88,6 92,0 96,6 100,0 104,6 108,0 112,6 116,0 120,6"
                  />
                </svg>

                <div className="rounded-b-lg bg-white px-3 pt-2 pb-3 text-slate-900 shadow-[0_24px_48px_rgba(3,16,8,0.55)] ring-1 ring-slate-900/10">
                  <div className="text-center">
                    <div className="text-[11px] font-extrabold tracking-tight text-slate-900">
                      AL-MADINA MART
                    </div>
                    <div className="text-[9.5px] text-slate-500 tabular-nums">
                      80mm Thermal {scenario.invoiceNo}
                    </div>
                  </div>

                  <div className="my-2 border-t border-dashed border-slate-300" />

                  <div className="space-y-1 text-[10px] tabular-nums">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>{scenario.total.toLocaleString("en-PK")}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>POS Tax</span>
                      <span>Incl.</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-0.5">
                      <span>{scenario.receiptPaidLabel}</span>
                      <span className="text-[#1F7A14]">
                        Rs. {scenario.total.toLocaleString("en-PK")}
                      </span>
                    </div>
                  </div>

                  <div className="my-2 border-t border-dashed border-slate-300" />

                  {/* FBR QR Matrix + Verification Scan Sweep */}
                  <div className="flex items-center gap-2">
                    <div className="relative overflow-hidden rounded-[2px]">
                      <FbrQrMatrix rows={scenario.qrRows} />
                      <span
                        key={`laser-${scenario.id}`}
                        aria-hidden="true"
                        style={{ animation: "posQrLaser 1.15s ease-in-out 260ms 1 both" }}
                        className="pos-anim-laser pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[#2CA01C] shadow-[0_0_6px_#2CA01C]"
                      />
                    </div>
                    <div className="min-w-0 leading-tight">
                      <div className="text-[10px] font-bold text-[#2CA01C]">FBR Verified</div>
                      <div className="text-[9px] text-slate-500 tabular-nums truncate mt-0.5">
                        {scenario.fbrCode}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 rounded bg-[#2CA01C]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#1E7A14]">
                        <IconBrandWhatsapp className="size-2.5 shrink-0" />
                        <span>{scenario.whatsappTag}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-1.5 border-t border-slate-100">
                    <ThermalBarcode />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instant Back-Office Auto-Posting Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#163F22] px-3.5 py-2.5 text-xs text-[#E3F3E5] ring-1 ring-white/14">
            <div className="flex items-center gap-2">
              <span
                key={`chk-${scenario.id}`}
                className="flex size-5 items-center justify-center rounded-full bg-[#2CA01C] text-white motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-300"
              >
                <IconCheck className="size-3.5" />
              </span>
              <span className="font-medium">
                Auto-Synced: <strong className="text-white">{scenario.syncStock}</strong> &amp;{" "}
                <strong className="text-white">{scenario.syncLedger}</strong>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A9F0B4] tabular-nums">
              <IconScale className="size-3.5" />
              <span>{scenario.voucherNo} (Dr = Cr)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Capability Strip */}
      <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-white/14 pt-4 text-xs">
        <div className="flex items-center gap-2 text-[#D8ECD9]">
          <IconReceipt2 className="size-4 shrink-0 text-[#5CE073]" />
          <span className="font-medium leading-tight">Urdu &amp; English POS</span>
        </div>
        <div className="flex items-center gap-2 text-[#D8ECD9]">
          <IconPackages className="size-4 shrink-0 text-[#5CE073]" />
          <span className="font-medium leading-tight">Multi-Godown GRN</span>
        </div>
        <div className="flex items-center gap-2 text-[#D8ECD9]">
          <IconBrandWhatsapp className="size-4 shrink-0 text-[#5CE073]" />
          <span className="font-medium leading-tight">WhatsApp Party Khata</span>
        </div>
      </div>
    </div>
  );
}

