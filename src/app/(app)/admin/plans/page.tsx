"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  IconReceipt2,
  IconPlus,
  IconRefresh,
  IconCheck,
  IconTrash,
  IconEdit,
  IconSparkles,
  IconStar,
  IconBuildingStore,
  IconAlertTriangle,
  IconAlertCircle,
  IconEye,
  IconEyeOff,
  IconX,
  IconClock,
  IconCurrencyDollar,
  IconListCheck,
  IconArrowUp,
  IconArrowDown,
  IconBulb,
  IconShieldCheck,
  IconBrandWhatsapp,
  IconKey,
  IconLock,
  IconUsers,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  planService,
  SubscriptionPlan,
  PlanPayload,
} from "@/services/plan.service";
import { useAuth } from "@/context/auth-context";

export const MARKETING_FEATURE_SUGGESTIONS = [
  "Complete Thermal POS & barcode scanning",
  "Customer & Supplier Khata ledger",
  "Unlimited Invoices & Products",
  "Real-time Inventory tracking",
  "Multi-Tier Wholesale & Retail Pricing",
  "Full Khata with 30/60/90 Days Aging Reports",
  "Salesman Order Route Dispatch",
  "Automated Daily Cloud Backups",
  "Dedicated 24/7 Account Manager",
  "Batch, Serial & Expiry Tracking",
  "Inter-Warehouse Stock Transfer Slips",
];

export default function AdminPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [badgeLabel, setBadgeLabel] = useState("");
  const [description, setDescription] = useState("");
  const [priceMonthly, setPriceMonthly] = useState<number>(0);
  const [priceYearly, setPriceYearly] = useState<number>(0);
  const [trialDays, setTrialDays] = useState<number>(14);
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);

  // Dynamic feature inline editing & suggestions
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
  const [editingFeatureText, setEditingFeatureText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Functional Limits & Entitlements state
  const [maxBranches, setMaxBranches] = useState<number>(1);
  const [isUnlimitedBranches, setIsUnlimitedBranches] = useState<boolean>(false);
  const [maxStaff, setMaxStaff] = useState<number>(2);
  const [isUnlimitedStaff, setIsUnlimitedStaff] = useState<boolean>(false);
  const [whatsappInvoicing, setWhatsappInvoicing] = useState<boolean>(false);
  const [fbrIntegration, setFbrIntegration] = useState<boolean>(false);
  const [multiGodown, setMultiGodown] = useState<boolean>(false);
  const [customRoles, setCustomRoles] = useState<boolean>(false);
  const [customLimits, setCustomLimits] = useState<Array<{ key: string; value: string; displayText?: string }>>([]);
  const [newLimitKey, setNewLimitKey] = useState<string>("");
  const [newLimitValue, setNewLimitValue] = useState<string>("");
  const [newLimitCustomLabel, setNewLimitCustomLabel] = useState<string>("");

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    slug?: string;
    priceMonthly?: string;
    priceYearly?: string;
    trialDays?: string;
    features?: string;
  }>({});

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load plans from API
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await planService.getAdminPlans();
      setPlans(data);
    } catch (err: any) {
      toast.error("Failed to load subscription plans: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPlan(null);
    setName("");
    setSlug("");
    setBadgeLabel("");
    setDescription("");
    setPriceMonthly(0);
    setPriceYearly(0);
    setTrialDays(14);
    setFeatures([
      "Complete Thermal POS & barcode scanning",
      "Real-time Inventory tracking",
      "Customer Khata Ledger",
    ]);
    setFeatureInput("");
    setEditingFeatureIndex(null);
    setEditingFeatureText("");
    setShowSuggestions(false);
    setMaxBranches(1);
    setIsUnlimitedBranches(false);
    setMaxStaff(2);
    setIsUnlimitedStaff(false);
    setWhatsappInvoicing(false);
    setFbrIntegration(false);
    setMultiGodown(false);
    setCustomRoles(false);
    setCustomLimits([]);
    setNewLimitKey("");
    setNewLimitValue("");
    setNewLimitCustomLabel("");
    setIsActive(true);
    setIsHighlighted(false);
    setSortOrder(plans.length + 1);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Helper to convert dynamic custom rule key-value into customer-facing card bullet
  const formatRuleToBullet = (key: string, value: string) => {
    const rawKey = (key || "").trim().toLowerCase();
    if (!rawKey) return "";
    const cleanWords = rawKey
      .replace(/^max_/, "")
      .replace(/_/g, " ")
      .trim();
    const capitalizedWords = cleanWords
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const num = Number(value);
    if (!isNaN(num) && value.trim() !== "") {
      if (rawKey.startsWith("max_")) {
        return `Up to ${num.toLocaleString()} ${capitalizedWords}`;
      }
      return `${capitalizedWords}: ${num.toLocaleString()}`;
    }

    if (value.toLowerCase() === "true") {
      return `${capitalizedWords} Enabled`;
    }
    if (value.toLowerCase() === "false") {
      return `${capitalizedWords} Disabled`;
    }
    return `${capitalizedWords}: ${value}`;
  };

  // Open Edit Modal
  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setSlug(plan.slug);
    setBadgeLabel(plan.badge_label || "");
    setDescription(plan.description || "");
    setPriceMonthly(plan.price_monthly);
    setPriceYearly(plan.price_yearly);
    setTrialDays(plan.trial_days);
    setFeatureInput("");
    setEditingFeatureIndex(null);
    setEditingFeatureText("");
    setShowSuggestions(false);

    // Initialize limits
    const lim = plan.limits || {};
    const br = lim.max_branches ?? 1;
    const isUnlBr = Number(br) >= 999 || Number(br) < 0;
    setMaxBranches(isUnlBr ? 1 : Number(br));
    setIsUnlimitedBranches(isUnlBr);

    const st = lim.max_staff ?? 2;
    const isUnlSt = Number(st) >= 999 || Number(st) < 0;
    setMaxStaff(isUnlSt ? 2 : Number(st));
    setIsUnlimitedStaff(isUnlSt);

    setWhatsappInvoicing(Boolean(lim.whatsapp_invoicing));
    setFbrIntegration(Boolean(lim.fbr_integration));
    setMultiGodown(Boolean(lim.multi_godown));
    setCustomRoles(Boolean(lim.custom_roles));

    const knownKeys = new Set([
      "max_branches",
      "max_staff",
      "whatsapp_invoicing",
      "fbr_integration",
      "multi_godown",
      "custom_roles",
    ]);
    const custom = Object.entries(lim)
      .filter(([k]) => !knownKeys.has(k))
      .map(([key, value]) => {
        const strVal = String(value);
        return {
          key,
          value: strVal,
          displayText: formatRuleToBullet(key, strVal),
        };
      });
    setCustomLimits(custom);
    setNewLimitKey("");
    setNewLimitValue("");
    setNewLimitCustomLabel("");

    const customBulletsSet = new Set(custom.map((c) => c.displayText.toLowerCase()));

    // Keep only custom marketing features (branch/staff/whatsapp/fbr/dynamic rules are auto-generated from limits)
    const rawFeatures = plan.features || [];
    const customOnly = rawFeatures.filter((f) => {
      const lower = f.toLowerCase();
      const isBranchLine = lower.includes("branch") || lower.includes("shop");
      const isStaffLine = lower.includes("staff");
      const isWhatsappLine = lower.includes("whatsapp");
      const isFbrLine = lower.includes("fbr");
      const isGodownLine = lower.includes("godown");
      const isCustomRoleLine = lower.includes("custom role");
      const isCustomRuleBullet = customBulletsSet.has(lower);
      return !isBranchLine && !isStaffLine && !isWhatsappLine && !isFbrLine && !isGodownLine && !isCustomRoleLine && !isCustomRuleBullet;
    });
    setFeatures(customOnly);

    setIsActive(plan.is_active);
    setIsHighlighted(plan.is_highlighted);
    setSortOrder(plan.sort_order);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Unified dynamic bullet points computation
  const getBranchBullet = () => {
    if (isUnlimitedBranches) return "Unlimited Branches & Godowns";
    return `${maxBranches} Shop / Branch ${maxBranches > 1 ? "locations" : "location"}`;
  };

  const getStaffBullet = () => {
    if (isUnlimitedStaff) return "Unlimited Staff User Accounts";
    return `${maxStaff} Staff User Accounts`;
  };

  // Custom rule bullets auto-generated from customLimits state
  const customRuleBullets = customLimits.map(
    (item) => item.displayText || formatRuleToBullet(item.key, item.value)
  );

  // Complete, fully-synchronized features list (rendered on card and saved to database)
  const allCardFeatures: string[] = [
    getBranchBullet(),
    getStaffBullet(),
    ...(whatsappInvoicing ? ["WhatsApp Invoice Delivery"] : []),
    ...(fbrIntegration ? ["FBR Digital Tax Integration (NTN/STRN)"] : []),
    ...(multiGodown ? ["Multi-Godown Stock Transfers"] : []),
    ...(customRoles ? ["Custom Roles & Permissions Creation"] : []),
    ...customRuleBullets,
    ...features,
  ];

  // Complete structured list of all items for the unified interactive features manager
  const unifiedFeatureList = [
    {
      id: "branch-quota",
      text: getBranchBullet(),
      type: "quota" as const,
      badge: "Branch Quota",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
    },
    {
      id: "staff-quota",
      text: getStaffBullet(),
      type: "quota" as const,
      badge: "Staff Quota",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
    },
    ...(whatsappInvoicing ? [{
      id: "whatsapp-module",
      text: "WhatsApp Invoice Delivery",
      type: "module" as const,
      badge: "WhatsApp Module",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    }] : []),
    ...(fbrIntegration ? [{
      id: "fbr-module",
      text: "FBR Digital Tax Integration (NTN/STRN)",
      type: "module" as const,
      badge: "FBR Module",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
    }] : []),
    ...(multiGodown ? [{
      id: "godown-module",
      text: "Multi-Godown Stock Transfers",
      type: "module" as const,
      badge: "Godown Module",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    }] : []),
    ...(customRoles ? [{
      id: "roles-module",
      text: "Custom Roles & Permissions Creation",
      type: "module" as const,
      badge: "Roles Module",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    }] : []),
    ...customLimits.map((rule, rIdx) => ({
      id: `rule-${rule.key}`,
      text: rule.displayText || formatRuleToBullet(rule.key, rule.value),
      type: "rule" as const,
      badge: `Rule: ${rule.key}: ${rule.value}`,
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-mono",
      ruleIndex: rIdx,
    })),
    ...features.map((feat, fIdx) => ({
      id: `custom-${fIdx}`,
      text: feat,
      type: "custom" as const,
      badge: "Custom Bullet",
      badgeColor: "bg-muted text-muted-foreground",
      customIndex: fIdx,
    })),
  ];

  // Feature item handlers
  const handleAddFeature = (textOverride?: string) => {
    const raw = textOverride !== undefined ? textOverride : featureInput;
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (features.includes(trimmed)) {
      toast.info(`"${trimmed}" is already added to this plan`);
      return;
    }
    setFeatures((prev) => [...prev, trimmed]);
    if (textOverride === undefined) {
      setFeatureInput("");
    }
    if (fieldErrors.features) {
      setFieldErrors((p) => ({ ...p, features: "" }));
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
    if (editingFeatureIndex === index) {
      setEditingFeatureIndex(null);
      setEditingFeatureText("");
    }
  };

  const handleMoveFeatureUp = (index: number) => {
    if (index <= 0) return;
    setFeatures((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    if (editingFeatureIndex === index) {
      setEditingFeatureIndex(index - 1);
    } else if (editingFeatureIndex === index - 1) {
      setEditingFeatureIndex(index);
    }
  };

  const handleMoveFeatureDown = (index: number) => {
    if (index >= features.length - 1) return;
    setFeatures((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    if (editingFeatureIndex === index) {
      setEditingFeatureIndex(index + 1);
    } else if (editingFeatureIndex === index + 1) {
      setEditingFeatureIndex(index);
    }
  };

  const handleStartEditFeature = (index: number) => {
    setEditingFeatureIndex(index);
    setEditingFeatureText(features[index]);
  };

  const handleSaveEditFeature = (index: number) => {
    const trimmed = editingFeatureText.trim();
    if (!trimmed) {
      toast.error("Feature text cannot be empty");
      return;
    }
    setFeatures((prev) => {
      const copy = [...prev];
      copy[index] = trimmed;
      return copy;
    });
    setEditingFeatureIndex(null);
    setEditingFeatureText("");
  };

  const handleCancelEditFeature = () => {
    setEditingFeatureIndex(null);
    setEditingFeatureText("");
  };

  // Custom limit rule handlers
  const handleAddCustomLimit = () => {
    const k = newLimitKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const v = newLimitValue.trim();
    if (!k) {
      toast.error("Limit key name is required (e.g. max_products)");
      return;
    }
    if (!v) {
      toast.error("Limit value is required (e.g. 500 or true)");
      return;
    }
    if (customLimits.some((item) => item.key === k)) {
      toast.info(`Rule "${k}" already exists`);
      return;
    }
    const autoLabel = formatRuleToBullet(k, v);
    const label = newLimitCustomLabel.trim() || autoLabel;
    setCustomLimits([...customLimits, { key: k, value: v, displayText: label }]);
    setNewLimitKey("");
    setNewLimitValue("");
    setNewLimitCustomLabel("");
    toast.success(`Rule "${k}" added and synced to card as "${label}"`);
  };

  const handleRemoveCustomLimit = (index: number) => {
    setCustomLimits(customLimits.filter((_, i) => i !== index));
  };

  // Validate form with red inline messages
  const validateForm = () => {
    const errs: {
      name?: string;
      slug?: string;
      priceMonthly?: string;
      priceYearly?: string;
      trialDays?: string;
      features?: string;
    } = {};

    if (!name.trim()) {
      errs.name = "Plan name is required";
    } else if (name.trim().length < 2) {
      errs.name = "Plan name must be at least 2 characters";
    }

    if (!slug.trim()) {
      errs.slug = "Plan slug / code is required";
    } else if (!/^[a-z0-9_]+$/.test(slug.trim())) {
      errs.slug = "Only lowercase letters, numbers, and underscores are allowed";
    }

    if (priceMonthly < 0) {
      errs.priceMonthly = "Monthly fee cannot be negative";
    }

    if (priceYearly < 0) {
      errs.priceYearly = "Yearly rate cannot be negative";
    }

    if (trialDays < 0) {
      errs.trialDays = "Trial duration cannot be negative";
    }

    if (allCardFeatures.length === 0) {
      errs.features = "Please add at least one feature bullet point for this plan";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save (Create or Update)
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const builtLimits: Record<string, any> = {
      max_branches: isUnlimitedBranches ? 999 : Number(maxBranches) || 1,
      max_staff: isUnlimitedStaff ? 999 : Number(maxStaff) || 2,
      whatsapp_invoicing: whatsappInvoicing,
      fbr_integration: fbrIntegration,
      multi_godown: multiGodown,
      custom_roles: customRoles,
    };
    customLimits.forEach(({ key, value }) => {
      if (key.trim()) {
        const num = Number(value);
        builtLimits[key.trim()] = !isNaN(num) && value.trim() !== "" ? num : value;
      }
    });

    const payload: PlanPayload = {
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "_"),
      badge_label: badgeLabel.trim() || undefined,
      description: description.trim() || undefined,
      price_monthly: Number(priceMonthly) || 0,
      price_yearly: Number(priceYearly) || 0,
      trial_days: Number(trialDays) || 0,
      features: allCardFeatures,
      limits: builtLimits,
      is_active: isActive,
      is_highlighted: isHighlighted,
      sort_order: Number(sortOrder) || 0,
    };

    startTransition(async () => {
      try {
        if (editingPlan) {
          await planService.updatePlan(editingPlan.id, payload);
          toast.success(`Plan "${payload.name}" updated successfully!`);
        } else {
          await planService.createPlan(payload);
          toast.success(`Plan "${payload.name}" created successfully!`);
        }
        setIsModalOpen(false);
        fetchPlans();
      } catch (err: any) {
        toast.error("Error saving plan: " + (err.message || "Please check inputs"));
      }
    });
  };

  // Fast Toggle Active Status
  const handleToggleActive = async (plan: SubscriptionPlan) => {
    const updatedStatus = !plan.is_active;
    try {
      await planService.updatePlan(plan.id, { is_active: updatedStatus });
      toast.success(
        updatedStatus
          ? `Plan "${plan.name}" is now active and visible on website.`
          : `Plan "${plan.name}" is now deactivated.`
      );
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, is_active: updatedStatus } : p))
      );
    } catch (err: any) {
      toast.error("Failed to toggle status: " + err.message);
    }
  };

  // Delete / Archive Execution
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await planService.deletePlan(deleteTarget.id);
      toast.success(res.message);
      setDeleteTarget(null);
      fetchPlans();
    } catch (err: any) {
      toast.error("Failed to remove plan: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalSubscribers = plans.reduce((acc, p) => acc + (p.subscriber_count || 0), 0);
  const activePlansCount = plans.filter((p) => p.is_active).length;
  const highlightedPlan = plans.find((p) => p.is_highlighted && p.is_active);

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconReceipt2 className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Subscription Plans Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Create, update, and manage dynamic pricing packages, trial policies, and feature tiers for businesses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPlans}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 bg-primary text-primary-foreground shadow-sm"
          >
            <IconPlus className="size-4" />
            Add New Plan
          </Button>
        </div>
      </div>

      {/* 2. Overview Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Plans Configured
            </CardTitle>
            <IconReceipt2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{plans.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activePlansCount} currently active on website
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active Subscribed Businesses
            </CardTitle>
            <IconBuildingStore className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {totalSubscribers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered business tenants
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Spotlight (Featured) Plan
            </CardTitle>
            <IconStar className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {highlightedPlan ? highlightedPlan.name : "None Selected"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {highlightedPlan ? `Rs. ${highlightedPlan.price_monthly.toLocaleString()}/mo` : "Highlighted on pricing cards"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Public Integration Status
            </CardTitle>
            <IconSparkles className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-base font-semibold text-emerald-600 dark:text-emerald-400">
              <IconCheck className="size-4" /> Live & Dynamic
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Synced with /pricing & /register
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Plans Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Active & Configured Tiers</h2>
          <span className="text-xs text-muted-foreground">
            Cards are ordered by public display sequence
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground border rounded-xl bg-card">
            <IconRefresh className="size-6 animate-spin mx-auto mb-2 text-primary" />
            Loading subscription packages...
          </div>
        ) : plans.length === 0 ? (
          <div className="p-12 text-center border rounded-xl bg-card space-y-3">
            <IconReceipt2 className="size-10 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-base">No Subscription Plans Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Create your first plan to start offering self-registration packages to Pakistani businesses.
            </p>
            <Button onClick={handleOpenCreate} size="sm">
              <IconPlus className="size-4 mr-1.5" /> Create Plan
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between transition-all duration-200 ${
                  plan.is_highlighted
                    ? "border-primary ring-2 ring-primary/20 shadow-md bg-primary/5"
                    : !plan.is_active
                    ? "opacity-60 border-dashed bg-muted/20"
                    : "shadow-xs hover:border-foreground/30"
                }`}
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-medium text-muted-foreground">
                        Order #{plan.sort_order} · {plan.slug}
                      </span>
                      {plan.is_highlighted && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] gap-1 px-2 py-0.5">
                          <IconStar className="size-3 fill-current" /> Featured
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <CardTitle className="text-xl font-bold font-heading">
                        {plan.name}
                      </CardTitle>
                      {plan.badge_label && (
                        <Badge variant="outline" className="text-[10px]">
                          {plan.badge_label}
                        </Badge>
                      )}
                    </div>

                    {plan.description && (
                      <CardDescription className="text-xs line-clamp-2 mt-1">
                        {plan.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Price Display */}
                    <div className="p-3 rounded-lg bg-background border flex items-baseline justify-between">
                      <div>
                        <div className="text-2xl font-black font-mono tracking-tight">
                          Rs. {plan.price_monthly.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {plan.price_monthly === 0
                            ? `${plan.trial_days}-Day Free Evaluation`
                            : `Yearly: Rs. ${plan.price_yearly.toLocaleString()}/mo`}
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      >
                        {plan.subscriber_count} Businesses
                      </Badge>
                    </div>

                    {/* Features Preview */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <IconListCheck className="size-3.5" />
                        Features Included ({plan.features.length})
                      </span>
                      <ul className="space-y-1.5 text-xs">
                        {plan.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
                            <IconCheck className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{f}</span>
                          </li>
                        ))}
                        {plan.features.length > 4 && (
                          <li className="text-[11px] text-muted-foreground italic pl-5">
                            +{plan.features.length - 4} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-3 border-t flex flex-col gap-2.5 bg-muted/10">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plan.is_active}
                        onCheckedChange={() => handleToggleActive(plan)}
                        id={`active-${plan.id}`}
                      />
                      <Label
                        htmlFor={`active-${plan.id}`}
                        className="text-xs font-medium cursor-pointer"
                      >
                        {plan.is_active ? "Active" : "Archived"}
                      </Label>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenEdit(plan)}
                        title="Edit Plan"
                      >
                        <IconEdit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(plan)}
                        title="Delete or Archive Plan"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 4. Create / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <IconReceipt2 className="size-5 text-primary" />
              {editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create New Subscription Plan"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure pricing, evaluation duration, and display settings. Changes immediately sync with public registration.
            </DialogDescription>
          </DialogHeader>

          <form noValidate onSubmit={handleSavePlan} className="space-y-5 py-2">
            {/* Section 1: Identification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plan_name" className="text-xs font-semibold">
                  Plan Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="plan_name"
                  placeholder="e.g. Standard Wholesale"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
                    if (!editingPlan) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_"));
                      if (fieldErrors.slug) setFieldErrors((p) => ({ ...p, slug: "" }));
                    }
                  }}
                  className={cn(
                    fieldErrors.name &&
                      "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                  )}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                    <IconAlertCircle className="size-3.5 shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan_slug" className="text-xs font-semibold">
                  Slug / Unique Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="plan_slug"
                  placeholder="e.g. standard"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                    if (fieldErrors.slug) setFieldErrors((p) => ({ ...p, slug: "" }));
                  }}
                  className={cn(
                    fieldErrors.slug &&
                      "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                  )}
                />
                {fieldErrors.slug && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                    <IconAlertCircle className="size-3.5 shrink-0" />
                    <span>{fieldErrors.slug}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="badge_label" className="text-xs font-semibold">
                  Badge Label (Optional)
                </Label>
                <Input
                  id="badge_label"
                  placeholder="e.g. Most Popular / Small Retailers"
                  value={badgeLabel}
                  onChange={(e) => setBadgeLabel(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sort_order" className="text-xs font-semibold">
                  Card Sort Sequence (1, 2, 3...)
                </Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan_desc" className="text-xs font-semibold">
                Short Description
              </Label>
              <Textarea
                id="plan_desc"
                placeholder="Brief summary explaining who this plan is tailored for..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Section 2: Pricing */}
            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-3">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <IconCurrencyDollar className="size-4 text-primary" />
                Pakistani Rupee (PKR) Pricing & Evaluation
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="price_monthly" className="text-xs font-semibold">
                    Monthly Fee (Rs.)
                  </Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={priceMonthly}
                    onChange={(e) => {
                      setPriceMonthly(Number(e.target.value));
                      if (fieldErrors.priceMonthly) setFieldErrors((p) => ({ ...p, priceMonthly: "" }));
                    }}
                    className={cn(
                      fieldErrors.priceMonthly &&
                        "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                    )}
                  />
                  {fieldErrors.priceMonthly && (
                    <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                      <IconAlertCircle className="size-3.5 shrink-0" />
                      <span>{fieldErrors.priceMonthly}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="price_yearly" className="text-xs font-semibold">
                    Yearly Rate/mo (Rs.)
                  </Label>
                  <Input
                    id="price_yearly"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={priceYearly}
                    onChange={(e) => {
                      setPriceYearly(Number(e.target.value));
                      if (fieldErrors.priceYearly) setFieldErrors((p) => ({ ...p, priceYearly: "" }));
                    }}
                    className={cn(
                      fieldErrors.priceYearly &&
                        "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                    )}
                  />
                  {fieldErrors.priceYearly && (
                    <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                      <IconAlertCircle className="size-3.5 shrink-0" />
                      <span>{fieldErrors.priceYearly}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="trial_days" className="text-xs font-semibold">
                    Trial Period (Days)
                  </Label>
                  <Input
                    id="trial_days"
                    type="number"
                    min="0"
                    placeholder="14"
                    value={trialDays}
                    onChange={(e) => {
                      setTrialDays(Number(e.target.value));
                      if (fieldErrors.trialDays) setFieldErrors((p) => ({ ...p, trialDays: "" }));
                    }}
                    className={cn(
                      fieldErrors.trialDays &&
                        "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                    )}
                  />
                  {fieldErrors.trialDays && (
                    <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                      <IconAlertCircle className="size-3.5 shrink-0" />
                      <span>{fieldErrors.trialDays}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Unified Features & Functional Entitlements Manager */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <Label className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                    <IconShieldCheck className="size-4 text-primary" />
                    <span>Plan Features & Functional Entitlements</span>
                    <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Configure operational limits, module access, and marketing features. Bullets and system limits stay 100% in sync.
                  </p>
                </div>
                <Badge variant="outline" className="text-[11px] font-mono bg-background">
                  {allCardFeatures.length} {allCardFeatures.length === 1 ? "bullet" : "bullets"} on card
                </Badge>
              </div>

              {/* 3.1: Core Operational Limits (Directly syncs to bullet text) */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  1. Operational Limits (Auto-generates bullet text)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Branch / Shop Limit */}
                  <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.02] space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="max_branches" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <IconBuildingStore className="size-4 text-emerald-600" />
                          <span>🏬 Shops & Outlets Quota</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Physical retail stores, godowns, or wholesale depots
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <Switch
                          id="unlimited_branches"
                          checked={isUnlimitedBranches}
                          onCheckedChange={setIsUnlimitedBranches}
                        />
                        <Label htmlFor="unlimited_branches" className="text-[11px] text-muted-foreground cursor-pointer">
                          Unlimited
                        </Label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="max_branches"
                        type="number"
                        min="1"
                        disabled={isUnlimitedBranches}
                        value={isUnlimitedBranches ? "" : maxBranches}
                        placeholder={isUnlimitedBranches ? "Unlimited (999)" : "1"}
                        onChange={(e) => setMaxBranches(Math.max(1, Number(e.target.value)))}
                        className="h-8 text-xs font-mono font-semibold"
                      />
                    </div>
                    {/* Live bullet preview badge */}
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded font-medium border border-emerald-500/20">
                      <IconCheck className="size-3 shrink-0" />
                      <span className="truncate">Card Bullet: &ldquo;{getBranchBullet()}&rdquo;</span>
                    </div>
                  </div>

                  {/* Staff Accounts Limit */}
                  <div className="p-3.5 rounded-lg border border-blue-500/30 bg-blue-500/[0.02] space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="max_staff" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <IconUsers className="size-4 text-blue-600" />
                          <span>👥 Staff User Seats Quota</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Authorized staff logins (Cashiers, Accountants, Salesmen)
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <Switch
                          id="unlimited_staff"
                          checked={isUnlimitedStaff}
                          onCheckedChange={setIsUnlimitedStaff}
                        />
                        <Label htmlFor="unlimited_staff" className="text-[11px] text-muted-foreground cursor-pointer">
                          Unlimited
                        </Label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="max_staff"
                        type="number"
                        min="1"
                        disabled={isUnlimitedStaff}
                        value={isUnlimitedStaff ? "" : maxStaff}
                        placeholder={isUnlimitedStaff ? "Unlimited (999)" : "2"}
                        onChange={(e) => setMaxStaff(Math.max(1, Number(e.target.value)))}
                        className="h-8 text-xs font-mono font-semibold"
                      />
                    </div>
                    {/* Live bullet preview badge */}
                    <div className="flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded font-medium border border-blue-500/20">
                      <IconCheck className="size-3 shrink-0" />
                      <span className="truncate">Card Bullet: &ldquo;{getStaffBullet()}&rdquo;</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* 3.2: Module & Feature Toggles (Auto-included in bullet list when enabled) */}
              <div className="space-y-2 pt-2 border-t">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  2. System Modules (Active modules are displayed as bullet points)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* WhatsApp */}
                  <div className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border transition-colors",
                    whatsappInvoicing ? "bg-emerald-500/5 border-emerald-500/30" : "bg-background"
                  )}>
                    <div className="flex items-center gap-2">
                      <IconBrandWhatsapp className={cn("size-4 shrink-0", whatsappInvoicing ? "text-emerald-500" : "text-muted-foreground")} />
                      <div>
                        <div className="font-medium text-foreground">WhatsApp Invoicing</div>
                        <div className="text-[10px] text-muted-foreground">Digital PDF bills via WhatsApp</div>
                      </div>
                    </div>
                    <Switch checked={whatsappInvoicing} onCheckedChange={setWhatsappInvoicing} />
                  </div>

                  {/* FBR */}
                  <div className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border transition-colors",
                    fbrIntegration ? "bg-primary/5 border-primary/30" : "bg-background"
                  )}>
                    <div className="flex items-center gap-2">
                      <IconShieldCheck className={cn("size-4 shrink-0", fbrIntegration ? "text-primary" : "text-muted-foreground")} />
                      <div>
                        <div className="font-medium text-foreground">FBR Digital Tax (NTN/STRN)</div>
                        <div className="text-[10px] text-muted-foreground">Fiscal POS digital synchronization</div>
                      </div>
                    </div>
                    <Switch checked={fbrIntegration} onCheckedChange={setFbrIntegration} />
                  </div>

                  {/* Multi Godown */}
                  <div className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border transition-colors",
                    multiGodown ? "bg-amber-500/5 border-amber-500/30" : "bg-background"
                  )}>
                    <div className="flex items-center gap-2">
                      <IconBuildingStore className={cn("size-4 shrink-0", multiGodown ? "text-amber-500" : "text-muted-foreground")} />
                      <div>
                        <div className="font-medium text-foreground">Multi-Godown Stock</div>
                        <div className="text-[10px] text-muted-foreground">Inter-warehouse stock transfer slips</div>
                      </div>
                    </div>
                    <Switch checked={multiGodown} onCheckedChange={setMultiGodown} />
                  </div>

                  {/* Custom Roles */}
                  <div className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border transition-colors",
                    customRoles ? "bg-purple-500/5 border-purple-500/30" : "bg-background"
                  )}>
                    <div className="flex items-center gap-2">
                      <IconKey className={cn("size-4 shrink-0", customRoles ? "text-purple-500" : "text-muted-foreground")} />
                      <div>
                        <div className="font-medium text-foreground">Custom Roles & Permissions</div>
                        <div className="text-[10px] text-muted-foreground">Create granular business user roles</div>
                      </div>
                    </div>
                    <Switch checked={customRoles} onCheckedChange={setCustomRoles} />
                  </div>
                </div>
              </div>

              {/* 3.3: Additional Custom Marketing Features */}
              <div className="space-y-2.5 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    3. Additional Custom & Marketing Bullets
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Freeform items (e.g. Thermal POS, Barcode scanning)
                  </span>
                </div>

                {/* Dynamic Feature Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type any custom feature (e.g. Free Barcode Printer Roll)..."
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className={cn(
                    fieldErrors.features &&
                      "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                  )}
                />
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => handleAddFeature()}
                  className="shrink-0 bg-primary text-primary-foreground font-medium shadow-xs"
                >
                  <IconPlus className="size-4 mr-1" /> Add Feature
                </Button>
              </div>

              {/* Quick Presets / Suggestions Accordion/Toggle */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline focus:outline-hidden"
                >
                  <IconBulb className="size-3.5" />
                  <span>{showSuggestions ? "Hide Quick Suggestions" : "Browse Popular Feature Suggestions"}</span>
                </button>

                {showSuggestions && (
                  <div className="p-2.5 rounded-md border bg-background/80 space-y-2 animate-in fade-in-50 duration-150">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Click any suggestion to add it to this plan:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {MARKETING_FEATURE_SUGGESTIONS.map((preset, pIdx) => {
                        const isAlreadyAdded = features.includes(preset);
                        return (
                          <button
                            key={pIdx}
                            type="button"
                            disabled={isAlreadyAdded}
                            onClick={() => handleAddFeature(preset)}
                            className={cn(
                              "text-[11px] px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1",
                              isAlreadyAdded
                                ? "bg-muted text-muted-foreground/60 border-muted cursor-not-allowed"
                                : "bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/40 cursor-pointer text-foreground"
                            )}
                          >
                            {isAlreadyAdded ? (
                              <IconCheck className="size-3 text-emerald-500 shrink-0" />
                            ) : (
                              <IconPlus className="size-3 text-primary shrink-0" />
                            )}
                            <span>{preset}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Features Ordered List */}
              <div
                className={cn(
                  "divide-y border rounded-lg bg-background max-h-56 overflow-y-auto shadow-xs",
                  fieldErrors.features && "border-destructive ring-1 ring-destructive/40"
                )}
              >
                {unifiedFeatureList.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground italic">
                    No features configured yet. Type a custom feature above or configure limits.
                  </div>
                ) : (
                  unifiedFeatureList.map((item, idx) => {
                    const isCustom = item.type === "custom";
                    const isRule = item.type === "rule";
                    const isEditing = isCustom && item.customIndex !== undefined && editingFeatureIndex === item.customIndex;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "p-2.5 flex items-center justify-between gap-2 text-xs transition-colors",
                          isEditing ? "bg-primary/5" : "hover:bg-muted/30"
                        )}
                      >
                        {isEditing && item.customIndex !== undefined ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingFeatureText}
                              onChange={(e) => setEditingFeatureText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveEditFeature(item.customIndex!);
                                } else if (e.key === "Escape") {
                                  handleCancelEditFeature();
                                }
                              }}
                              className="h-8 text-xs flex-1"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              onClick={() => handleSaveEditFeature(item.customIndex!)}
                              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                            >
                              <IconCheck className="size-3.5 mr-1" /> Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEditFeature}
                              className="h-8 px-2 shrink-0"
                            >
                              <IconX className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
                              <span className="text-[10px] font-mono text-muted-foreground w-5 shrink-0">
                                #{idx + 1}
                              </span>
                              <IconCheck className="size-3.5 text-emerald-500 shrink-0" />
                              <span className="text-foreground font-medium break-words leading-tight">
                                {item.text}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn("text-[9px] px-1.5 py-0.2 shrink-0 font-medium", item.badgeColor)}
                              >
                                {item.badge}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {isCustom && item.customIndex !== undefined && (
                                <>
                                  {/* Re-order Up */}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={item.customIndex === 0}
                                    onClick={() => handleMoveFeatureUp(item.customIndex!)}
                                    title="Move feature up"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  >
                                    <IconArrowUp className="size-3.5" />
                                  </Button>

                                  {/* Re-order Down */}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={item.customIndex === features.length - 1}
                                    onClick={() => handleMoveFeatureDown(item.customIndex!)}
                                    title="Move feature down"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  >
                                    <IconArrowDown className="size-3.5" />
                                  </Button>

                                  {/* Inline Edit */}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handleStartEditFeature(item.customIndex!)}
                                    title="Edit feature text"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                  >
                                    <IconEdit className="size-3.5" />
                                  </Button>

                                  {/* Delete */}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handleRemoveFeature(item.customIndex!)}
                                    title="Delete feature"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  >
                                    <IconTrash className="size-3.5" />
                                  </Button>
                                </>
                              )}

                              {isRule && item.ruleIndex !== undefined && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleRemoveCustomLimit(item.ruleIndex!)}
                                  title="Remove dynamic rule"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                >
                                  <IconTrash className="size-3.5" />
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {fieldErrors.features && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{fieldErrors.features}</span>
                </p>
              )}
            </div>

              {/* 3.4: Dynamic Custom Rules (Key-Value with Auto-Bullet Sync) */}
              <div className="space-y-2.5 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      4. Advanced Dynamic Rules (Auto-synced to Card Bullets)
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      Machine limits entered here automatically generate and format card bullet points.
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border-emerald-500/20">
                    Auto-Sync Active
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <Input
                      placeholder="Rule Key (e.g. max_products)"
                      value={newLimitKey}
                      onChange={(e) => setNewLimitKey(e.target.value)}
                      className="h-8 text-xs bg-background font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      placeholder="Value (e.g. 500)"
                      value={newLimitValue}
                      onChange={(e) => setNewLimitValue(e.target.value)}
                      className="h-8 text-xs bg-background font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      placeholder={
                        newLimitKey && newLimitValue
                          ? formatRuleToBullet(newLimitKey, newLimitValue)
                          : "Card Label (Optional)"
                      }
                      value={newLimitCustomLabel}
                      onChange={(e) => setNewLimitCustomLabel(e.target.value)}
                      className="h-8 text-xs bg-background"
                      title="Optional custom display label for the customer-facing card bullet"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleAddCustomLimit}
                      className="h-8 w-full px-2 text-xs shrink-0 bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      <IconPlus className="size-3.5 mr-1" /> Add Rule
                    </Button>
                  </div>
                </div>

                {/* Live typing bullet preview */}
                {newLimitKey.trim() && newLimitValue.trim() && (
                  <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in-50">
                    <IconCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Will automatically show on card as: <strong>&ldquo;{newLimitCustomLabel.trim() || formatRuleToBullet(newLimitKey, newLimitValue)}&rdquo;</strong>
                    </span>
                  </div>
                )}

                {customLimits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {customLimits.map((rule, rIdx) => {
                      const bulletLabel = rule.displayText || formatRuleToBullet(rule.key, rule.value);
                      return (
                        <Badge
                          key={rIdx}
                          variant="outline"
                          className="text-xs py-1 px-2.5 gap-2 bg-background flex items-center border-primary/30"
                        >
                          <span className="font-mono text-primary font-semibold">{rule.key}: {rule.value}</span>
                          <span className="text-[10px] text-muted-foreground font-normal bg-muted px-1.5 py-0.5 rounded">
                            Card: &ldquo;{bulletLabel}&rdquo;
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomLimit(rIdx)}
                            className="text-muted-foreground hover:text-destructive ml-0.5"
                            title="Remove rule"
                          >
                            <IconX className="size-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3.5: Real-time Live Customer Card Preview */}
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <IconSparkles className="size-4 text-primary" />
                    Live Customer Card Preview
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Reflects quotas, modules, and custom features in real time
                  </span>
                </div>

                <div
                  className={cn(
                    "p-4 rounded-xl border bg-card relative max-w-sm mx-auto shadow-sm transition-all",
                    isHighlighted && "border-2 border-primary ring-1 ring-primary/20 shadow-md"
                  )}
                >
                  {isHighlighted && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow-xs">
                      {badgeLabel || "Most Popular"}
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {badgeLabel || (priceMonthly === 0 ? "Evaluation" : "Business")}
                    </span>
                    <h4 className="text-base font-bold font-heading mt-0.5">
                      {name || "Untitled Plan"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {description || "Plan summary description..."}
                    </p>
                    <div className="my-3">
                      <span className="text-2xl font-bold font-mono">
                        Rs. {Number(priceMonthly).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {priceMonthly === 0 ? ` / ${trialDays || 14} days` : " / month"}
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {allCardFeatures.length === 0 ? (
                        <li className="text-[11px] italic text-muted-foreground/70">
                          No features added yet.
                        </li>
                      ) : (
                        allCardFeatures.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <IconCheck className="size-3 text-emerald-500 shrink-0" />
                            <span className="text-[11px] text-foreground leading-tight">{f}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>



            {/* Section 5: Display Toggles */}
            <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="toggle-highlight" className="text-xs font-semibold cursor-pointer">
                    Highlight as Featured / Most Popular
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Adds glowing border and featured spotlight badge on the pricing page.
                  </p>
                </div>
                <Switch
                  id="toggle-highlight"
                  checked={isHighlighted}
                  onCheckedChange={setIsHighlighted}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-2.5">
                <div>
                  <Label htmlFor="toggle-active" className="text-xs font-semibold cursor-pointer">
                    Active & Available for Registration
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Inactive plans are hidden from public website visitors.
                  </p>
                </div>
                <Switch
                  id="toggle-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="bg-primary text-primary-foreground shadow-sm gap-2"
              >
                {isPending && <IconRefresh className="h-4 w-4 animate-spin" />}
                {isPending
                  ? editingPlan
                    ? "Saving Changes..."
                    : "Creating Plan..."
                  : editingPlan
                  ? "Save Changes"
                  : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Safe Delete / Archive Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-lg font-bold">
              <IconAlertTriangle className="size-5" />
              Remove Subscription Plan
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review subscriber status before removing this plan from the catalog.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="space-y-3 py-2 text-sm">
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="font-bold text-base">{deleteTarget.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Code: <span className="font-mono">{deleteTarget.slug}</span> · Price: Rs. {deleteTarget.price_monthly.toLocaleString()}/mo
                </div>
              </div>

              {deleteTarget.subscriber_count > 0 ? (
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <IconAlertTriangle className="size-4 shrink-0" />
                    {deleteTarget.subscriber_count} Active Business(es) Registered!
                  </div>
                  <p>
                    Because active businesses are currently using this plan, it will be <strong>safely archived</strong> (deactivated) instead of hard-deleted.
                    This prevents database corruption while immediately removing it from public pricing.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  This plan has 0 active subscribers and will be permanently removed from the database.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting && <IconRefresh className="size-4 animate-spin" />}
              {isDeleting
                ? "Processing..."
                : deleteTarget && deleteTarget.subscriber_count > 0
                ? "Archive Plan"
                : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
