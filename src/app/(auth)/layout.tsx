import Link from "next/link";
import { IconArrowLeft, IconBuildingStore } from "@tabler/icons-react";
import { AuthPosShowcase } from "@/components/auth/auth-pos-showcase";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[46fr_54fr] xl:grid-cols-2 bg-white dark:bg-slate-950">
      {/* Left Column: Clean Form Workspace */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-11 xl:p-14 overflow-y-auto bg-white dark:bg-slate-950">
        {/* Brand Header */}
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#2CA01C] text-white shadow-xs transition-transform duration-200 group-hover:scale-105">
              <IconBuildingStore className="size-5" />
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
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

          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-200 hover:border-[#2CA01C]/45 hover:bg-[#2CA01C]/8 hover:text-[#1F7A14] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#2CA01C]/50 dark:hover:text-white"
          >
            <IconArrowLeft className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Back to Website</span>
          </Link>
        </header>

        {/* Form Stage */}
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-lg">{children}</div>
        </div>

        {/* Copyright */}
        <footer className="text-xs text-slate-400 pt-4">
          © {new Date().getFullYear()} Paperless ERP by MetricNests. All rights reserved.
        </footer>
      </div>

      {/* Right Column: Sticky Framed Animated POS & ERP Workstation Showcase */}
      <div className="hidden lg:flex lg:sticky lg:top-0 lg:h-svh p-3.5 xl:p-4 bg-white dark:bg-slate-950">
        <AuthPosShowcase />
      </div>
    </div>
  );
}
