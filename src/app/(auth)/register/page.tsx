"use client";

import * as React from "react";
import { useState, useEffect, useTransition, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  IconBuildingStore,
  IconCalendar,
  IconShieldLock,
  IconMail,
  IconBrandWhatsapp,
  IconMessageCircle,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconSparkles,
  IconLock,
  IconEdit,
  IconAlertCircle,
  IconLoader2,
} from "@tabler/icons-react";

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
import { cn } from "@/lib/utils";
import { authService, SelfRegisterPayload } from "@/services/auth.service";
import { planService, PublicPlan } from "@/services/plan.service";
import { useAuth } from "@/context/auth-context";

const PAKISTAN_CITIES = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Gujranwala",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Hyderabad",
  "Bahawalpur",
  "Sargodha",
  "Other",
];

const PLAN_OPTIONS: Record<
  string,
  { key: string; title: string; price: string; period: string; tag: string; desc: string }
> = {
  free_trial: {
    key: "free_trial",
    title: "Free Trial",
    price: "Rs. 0",
    period: "14 Days",
    tag: "Evaluation",
    desc: "1 Shop · 2 Users · Complete Thermal POS & Khata",
  },
  basic: {
    key: "basic",
    title: "Basic Retail",
    price: "Rs. 3,500",
    period: "/month",
    tag: "Small Retail",
    desc: "1 Shop · 3 Users · Unlimited Sales & WhatsApp Invoices",
  },
  standard: {
    key: "standard",
    title: "Standard Wholesale",
    price: "Rs. 7,500",
    period: "/month",
    tag: "Most Popular",
    desc: "2 Warehouses · 10 Users · Multi-Tier Wholesale & Aging Khata",
  },
  enterprise: {
    key: "enterprise",
    title: "Enterprise",
    price: "Rs. 15,000",
    period: "/month",
    tag: "Large Chains",
    desc: "Unlimited Godowns & Users · FBR Tax Integration",
  },
};

function MultiStepRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const [dynamicPlans, setDynamicPlans] = useState<PublicPlan[]>([]);

  useEffect(() => {
    planService
      .getPublicPlans()
      .then((data) => {
        if (data && data.length > 0) {
          setDynamicPlans(data);
        }
      })
      .catch(() => {});
  }, []);

  const planParam = searchParams.get("plan");
  const hasPreselectedPlan = Boolean(
    planParam &&
      (Object.keys(PLAN_OPTIONS).includes(planParam) ||
        dynamicPlans.some((p) => p.slug === planParam))
  );

  const initialPlan = hasPreselectedPlan ? (planParam as any) : "free_trial";

  // Dynamic Steps: If plan is already chosen from /pricing, skip Choose Plan step!
  const steps = useMemo(() => {
    if (hasPreselectedPlan) {
      return [
        { id: "business", title: "Business Info" },
        { id: "owner", title: "Owner Account" },
        { id: "verification", title: "Verification" },
      ];
    }
    return [
      { id: "business", title: "Business Info" },
      { id: "plan", title: "Choose Plan" },
      { id: "owner", title: "Owner Account" },
      { id: "verification", title: "Verification" },
    ];
  }, [hasPreselectedPlan]);

  const [stepIndex, setStepIndex] = useState<number>(0);

  const currentStep = steps[stepIndex];

  const [form, setForm] = useState<SelfRegisterPayload>({
    business_name: "",
    legal_name: "",
    city: "Lahore",
    phone: "",
    ntn: "",
    strn: "",
    address: "",
    plan_tier: initialPlan,
    owner_full_name: "",
    owner_phone: "",
    owner_email: "",
    owner_password: "",
    otp_channel: "email",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedPlanDetails = PLAN_OPTIONS[form.plan_tier] || PLAN_OPTIONS.free_trial;

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, owner_password: pwd + "!" }));
    if (fieldErrors.owner_password) {
      setFieldErrors((prev) => ({ ...prev, owner_password: "" }));
    }
  };

  // Validation
  const validateBusiness = () => {
    const errs: Record<string, string> = {};
    if (!form.business_name.trim()) {
      errs.business_name = "Business Name is required.";
    }
    if (!form.city) {
      errs.city = "City is required. Please select a city.";
    }
    if (!form.phone.trim()) {
      errs.phone = "Business Phone / WhatsApp number is required.";
    }
    setFieldErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const validatePlan = () => {
    const errs: Record<string, string> = {};
    if (!form.plan_tier) {
      errs.plan_tier = "Please select a subscription tier.";
    }
    setFieldErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const validateOwner = () => {
    const errs: Record<string, string> = {};
    if (!form.owner_full_name.trim()) {
      errs.owner_full_name = "Owner Full Name is required.";
    }
    if (!form.owner_phone.trim()) {
      errs.owner_phone = "Owner Mobile Number is required.";
    }
    if (!form.owner_email.trim()) {
      errs.owner_email = "Owner Email is required for OTP code.";
    } else if (!form.owner_email.includes("@") || !form.owner_email.includes(".")) {
      errs.owner_email = "Please enter a valid email address (e.g. name@domain.com).";
    }
    if (!form.owner_password) {
      errs.owner_password = "Password is required.";
    } else if (form.owner_password.length < 6) {
      errs.owner_password = "Password must be at least 6 characters long.";
    }
    setFieldErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep.id === "business" && !validateBusiness()) return;
    if (currentStep.id === "plan" && !validatePlan()) return;
    if (currentStep.id === "owner" && !validateOwner()) return;

    setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBusiness()) {
      const idx = steps.findIndex((s) => s.id === "business");
      if (idx !== -1) setStepIndex(idx);
      return;
    }
    if (!validatePlan()) {
      const idx = steps.findIndex((s) => s.id === "plan");
      if (idx !== -1) setStepIndex(idx);
      return;
    }
    if (!validateOwner()) {
      const idx = steps.findIndex((s) => s.id === "owner");
      if (idx !== -1) setStepIndex(idx);
      return;
    }

    startTransition(async () => {
      try {
        const res = await authService.register(form);
        toast.success(`Verification code sent to ${res.destination}`);

        if (typeof window !== "undefined") {
          sessionStorage.setItem("paperless_pending_vid", String(res.verification_id));
          sessionStorage.setItem("paperless_pending_email", res.destination);
          if (res.debug_otp) {
            sessionStorage.setItem("paperless_debug_otp", res.debug_otp);
          }
        }

        router.push(
          `/verify-otp?vid=${res.verification_id}&email=${encodeURIComponent(res.destination)}`
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Registration failed";
        toast.error(errorMsg);
      }
    });
  };

  if (mounted && isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3 animate-in fade-in-50">
        <IconLoader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Already signed in. Redirecting to Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Top Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary mb-1">
          <IconSparkles className="size-3" />
          14-Day Free Evaluation · No Credit Card Required
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
          Register Your Business
        </h1>
        <p className="text-xs text-muted-foreground">
          {hasPreselectedPlan
            ? `Onboarding with ${selectedPlanDetails.title} (${selectedPlanDetails.price}).`
            : "Step-by-step onboarding for Pakistani Wholesalers, Distributors & Retailers."}
        </p>
      </div>

      {/* Preselected Plan Info Pill if plan came from /pricing */}
      {hasPreselectedPlan && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-semibold text-[10px]">
              {selectedPlanDetails.tag}
            </Badge>
            <span className="text-muted-foreground">
              Selected Plan:{" "}
              <strong className="text-foreground font-semibold">
                {selectedPlanDetails.title} ({selectedPlanDetails.price})
              </strong>
            </span>
          </div>
          <Link
            href="/pricing"
            className="text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <IconEdit className="size-3.5" /> Change Plan
          </Link>
        </div>
      )}

      {/* Stepper Progress Bar */}
      <div className="flex items-center justify-between border-y py-3 px-1">
        {steps.map((s, idx) => {
          const isDone = stepIndex > idx;
          const isCurrent = stepIndex === idx;

          return (
            <React.Fragment key={s.id}>
              <div
                onClick={() => {
                  if (isDone) setStepIndex(idx);
                }}
                className={cn(
                  "flex items-center gap-2 transition-colors",
                  isDone ? "cursor-pointer" : "cursor-default",
                  !isDone && !isCurrent && "opacity-50"
                )}
              >
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                    isDone && "bg-emerald-500 text-white",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isDone && !isCurrent && "border bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? <IconCheck className="size-3.5" /> : idx + 1}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span
                    className={cn(
                      "text-xs font-semibold leading-tight",
                      isCurrent && "text-foreground",
                      isDone && "text-emerald-600 dark:text-emerald-400",
                      !isDone && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {s.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Step {idx + 1}</span>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 sm:mx-3 transition-colors",
                    stepIndex > idx ? "bg-emerald-500" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP: BUSINESS DETAILS */}
      {currentStep.id === "business" && (
        <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <IconBuildingStore className="size-4 text-primary" />
              1. Business Details
            </h2>
            <Badge variant="outline" className="text-[10px]">
              Step 1 of {steps.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="biz_name" className="text-xs">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="biz_name"
                placeholder="e.g. Al-Madina Cash & Carry"
                value={form.business_name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, business_name: e.target.value }));
                  if (fieldErrors.business_name) {
                    setFieldErrors((p) => ({ ...p, business_name: "" }));
                  }
                }}
                className={cn(
                  fieldErrors.business_name &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {fieldErrors.business_name && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{fieldErrors.business_name}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="biz_legal" className="text-xs">
                Legal / Registered Name
              </Label>
              <Input
                id="biz_legal"
                placeholder="e.g. Al-Madina Trading Pvt Ltd"
                value={form.legal_name || ""}
                onChange={(e) => setForm((p) => ({ ...p, legal_name: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="biz_city" className="text-xs">
                City <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.city || "none"}
                onValueChange={(val) => {
                  setForm((p) => ({ ...p, city: val === "none" ? "" : val }));
                  if (fieldErrors.city) {
                    setFieldErrors((p) => ({ ...p, city: "" }));
                  }
                }}
              >
                <SelectTrigger
                  id="biz_city"
                  className={cn(
                    fieldErrors.city &&
                      "border-destructive ring-1 ring-destructive/40 focus:ring-destructive"
                  )}
                >
                  <SelectValue placeholder="Choose One" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-muted-foreground">Choose One</SelectItem>
                  {PAKISTAN_CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.city && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{fieldErrors.city}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="biz_phone" className="text-xs">
                Business Phone / WhatsApp <span className="text-destructive">*</span>
              </Label>
              <Input
                id="biz_phone"
                placeholder="e.g. +923001234567"
                value={form.phone}
                onChange={(e) => {
                  setForm((p) => ({ ...p, phone: e.target.value }));
                  if (fieldErrors.phone) {
                    setFieldErrors((p) => ({ ...p, phone: "" }));
                  }
                }}
                className={cn(
                  fieldErrors.phone &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{fieldErrors.phone}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="biz_ntn" className="text-xs">
                NTN (National Tax No.)
              </Label>
              <Input
                id="biz_ntn"
                placeholder="e.g. 1234567-8"
                value={form.ntn || ""}
                onChange={(e) => setForm((p) => ({ ...p, ntn: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="biz_strn" className="text-xs">
                STRN (Sales Tax Reg No.)
              </Label>
              <Input
                id="biz_strn"
                placeholder="e.g. 17-00-1234-567-89"
                value={form.strn || ""}
                onChange={(e) => setForm((p) => ({ ...p, strn: e.target.value }))}
              />
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1">
              <Label htmlFor="biz_addr" className="text-xs">
                Business Address / Shop Location
              </Label>
              <Input
                id="biz_addr"
                placeholder="e.g. Shop # 14, Main Wholesale Market, Hall Road, Lahore"
                value={form.address || ""}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              onClick={handleNext}
              className="bg-primary text-primary-foreground font-semibold shadow-sm"
            >
              Continue to {steps[1].title}
              <IconArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP: CHOOSE PLAN (ONLY SHOWN IF NO PLAN WAS PRESELECTED) */}
      {currentStep.id === "plan" && (
        <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <IconCalendar className="size-4 text-primary" />
              2. Selected Plan & Trial
            </h2>
            <Badge variant="outline" className="text-[10px]">
              Step 2 of {steps.length}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Select the subscription tier for your business. Every plan includes an initial 14-day evaluation period.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(dynamicPlans.length > 0
              ? dynamicPlans.map((p) => ({
                  key: p.slug,
                  title: p.name,
                  price: `Rs. ${p.price_monthly.toLocaleString()}`,
                  period: p.price_monthly === 0 ? `${p.trial_days || 14} Days` : "/month",
                  tag: p.badge_label || (p.is_highlighted ? "Featured" : "Standard"),
                  desc: p.description || (p.features && p.features.slice(0, 2).join(" · ")) || "Full-featured tier",
                }))
              : Object.values(PLAN_OPTIONS)
            ).map((plan) => {
              const isSelected = form.plan_tier === plan.key;

              return (
                <div
                  key={plan.key}
                  onClick={() => {
                    setForm((p) => ({ ...p, plan_tier: plan.key as any }));
                    if (fieldErrors.plan_tier) {
                      setFieldErrors((p) => ({ ...p, plan_tier: "" }));
                    }
                  }}
                  className={cn(
                    "rounded-xl border p-3.5 cursor-pointer transition-all flex flex-col justify-between",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                      : "border-border hover:border-muted-foreground/30 bg-background"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-sm font-heading text-foreground">
                        {plan.title}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{plan.desc}</p>
                    </div>
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "text-[10px] px-2 py-0.5 shrink-0",
                        isSelected && "bg-primary text-primary-foreground"
                      )}
                    >
                      {plan.tag}
                    </Badge>
                  </div>

                  <div className="mt-3 pt-2 border-t flex items-baseline gap-1">
                    <span className="text-lg font-bold font-mono text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {fieldErrors.plan_tier && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1 animate-in fade-in-50">
              <IconAlertCircle className="size-3.5 shrink-0" />
              <span>{fieldErrors.plan_tier}</span>
            </p>
          )}

          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2.5">
            <IconCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              14-Day Free Evaluation included automatically. No credit card or pre-payment required.
            </p>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <Button type="button" variant="outline" onClick={handleBack} className="text-xs">
              <IconArrowLeft className="size-4 mr-1.5" /> Back
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              className="bg-primary text-primary-foreground font-semibold shadow-sm text-xs"
            >
              Continue to Owner Account
              <IconArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP: PRIMARY OWNER ACCOUNT (CREDENTIALS) */}
      {currentStep.id === "owner" && (
        <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <IconShieldLock className="size-4 text-primary" />
              {hasPreselectedPlan ? "2." : "3."} Primary Owner Account (Credentials)
            </h2>
            <Badge variant="outline" className="text-[10px]">
              Step {stepIndex + 1} of {steps.length}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            These will be your primary administrative login credentials for Paperless Business OS.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="owner_name" className="text-xs">
                Owner Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="owner_name"
                placeholder="e.g. Haji Muhammad Tariq"
                value={form.owner_full_name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, owner_full_name: e.target.value }));
                  if (fieldErrors.owner_full_name) {
                    setFieldErrors((p) => ({ ...p, owner_full_name: "" }));
                  }
                }}
                className={cn(
                  fieldErrors.owner_full_name &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {fieldErrors.owner_full_name && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{fieldErrors.owner_full_name}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="owner_phone" className="text-xs">
                Owner Mobile No. (Login) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="owner_phone"
                placeholder="e.g. +923019876543"
                value={form.owner_phone}
                onChange={(e) => {
                  setForm((p) => ({ ...p, owner_phone: e.target.value }));
                  if (fieldErrors.owner_phone) {
                    setFieldErrors((p) => ({ ...p, owner_phone: "" }));
                  }
                }}
                className={cn(
                  fieldErrors.owner_phone &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {fieldErrors.owner_phone && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{fieldErrors.owner_phone}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="owner_email" className="text-xs">
                Owner Email (For OTP Code) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="owner_email"
                type="email"
                placeholder="e.g. tariq@gmail.com"
                value={form.owner_email}
                onChange={(e) => {
                  setForm((p) => ({ ...p, owner_email: e.target.value }));
                  if (fieldErrors.owner_email) {
                    setFieldErrors((p) => ({ ...p, owner_email: "" }));
                  }
                }}
                className={cn(
                  fieldErrors.owner_email &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {fieldErrors.owner_email && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{fieldErrors.owner_email}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="owner_pwd" className="text-xs">
                  Password <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                >
                  Generate Random
                </button>
              </div>
              <Input
                id="owner_pwd"
                type="text"
                placeholder="Choose a strong password"
                value={form.owner_password}
                onChange={(e) => {
                  setForm((p) => ({ ...p, owner_password: e.target.value }));
                  if (fieldErrors.owner_password) {
                    setFieldErrors((p) => ({ ...p, owner_password: "" }));
                  }
                }}
                className={cn(
                  fieldErrors.owner_password &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {fieldErrors.owner_password && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{fieldErrors.owner_password}</span>
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <Button type="button" variant="outline" onClick={handleBack} className="text-xs">
              <IconArrowLeft className="size-4 mr-1.5" /> Back
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              className="bg-primary text-primary-foreground font-semibold shadow-sm text-xs"
            >
              Continue to Verification
              <IconArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP: VERIFICATION CHANNEL */}
      {currentStep.id === "verification" && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4 sm:p-5 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <IconMail className="size-4 text-primary" />
              {hasPreselectedPlan ? "3." : "4."} Verification Channel
            </h2>
            <Badge variant="outline" className="text-[10px]">
              Step {stepIndex + 1} of {steps.length}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Select your preferred method to receive the 6-digit verification code.
          </p>

          {/* Vertical Stack of Channel Cards so text and badges NEVER collide */}
          <div className="space-y-3">
            {/* 1. Email OTP (Active & Default) */}
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
                  <IconMail className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">Email OTP</span>
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0">
                      Active · Default
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    A 6-digit confirmation code will be sent to{" "}
                    <strong className="text-foreground font-medium">{form.owner_email || "your email"}</strong>.
                  </p>
                </div>
              </div>
              <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                <IconCheck className="size-3.5" />
              </div>
            </div>

            {/* 2. WhatsApp OTP (Coming Soon) */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-start justify-between gap-3 opacity-60">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <IconBrandWhatsapp className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-muted-foreground">WhatsApp OTP</span>
                    <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground px-2 py-0">
                      Coming Soon
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Direct WhatsApp OTP message delivery will be enabled in the upcoming release.
                  </p>
                </div>
              </div>
              <IconLock className="size-4 text-muted-foreground shrink-0 mt-1" />
            </div>

            {/* 3. Mobile SMS OTP (Coming Soon) */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-start justify-between gap-3 opacity-60">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <IconMessageCircle className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-muted-foreground">Mobile SMS</span>
                    <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground px-2 py-0">
                      Coming Soon
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Telco cellular SMS gateway integration for offline merchants.
                  </p>
                </div>
              </div>
              <IconLock className="size-4 text-muted-foreground shrink-0 mt-1" />
            </div>
          </div>

          {/* Quick Review Box */}
          <div className="rounded-xl border bg-muted/30 p-3.5 space-y-1.5 text-xs">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
              Registration Summary
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-muted-foreground">Business: </span>
                <span className="font-medium text-foreground">{form.business_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">City: </span>
                <span className="font-medium text-foreground">{form.city}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Owner: </span>
                <span className="font-medium text-foreground">{form.owner_full_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Plan: </span>
                <span className="font-medium text-primary">
                  {selectedPlanDetails.title} ({selectedPlanDetails.price})
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isPending}
              className="text-xs"
            >
              <IconArrowLeft className="size-4 mr-1.5" /> Back
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground font-semibold shadow-md text-xs h-10 px-6"
            >
              {isPending ? "Sending Verification Code..." : "Register & Send Email OTP"}
              <IconArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in to your portal
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading registration wizard...</div>}>
      <MultiStepRegisterForm />
    </Suspense>
  );
}
