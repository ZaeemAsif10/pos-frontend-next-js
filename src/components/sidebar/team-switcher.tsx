"use client";

import { useAuth } from "@/context/auth-context";
import { IconBuildingStore, IconSparkles } from "@tabler/icons-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  free_trial: "14-Day Free Trial",
  basic: "Basic Retail",
  standard: "Standard Wholesale",
  enterprise: "Enterprise",
};

export function TeamSwitcher() {
  const { tenant, user } = useAuth();

  // If user is Super Admin without active business:
  const isSuper = user?.is_superadmin;
  const businessName =
    tenant?.name || (isSuper ? "Paperless Platform" : user?.full_name ? `${user.full_name}'s Store` : "My Business");
  
  const roleName = tenant?.role_name || (isSuper ? "Super Admin" : "Owner");
  const planName = tenant?.plan_tier ? (PLAN_DISPLAY_NAMES[tenant.plan_tier] || tenant.plan_tier) : (isSuper ? "Multi-Tenant" : "Active");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="select-none cursor-default hover:bg-sidebar-accent/50 transition-colors"
        >
          <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-[#2CA01C] text-white shadow-xs">
            {isSuper && !tenant ? (
              <IconSparkles className="size-5" />
            ) : (
              <IconBuildingStore className="size-5" />
            )}
          </div>
          <div className="grid flex-1 text-left leading-tight min-w-0">
            <span className="truncate font-bold tracking-tight text-foreground text-sm">
              {businessName}
            </span>
            <span className="truncate text-[11px] text-muted-foreground font-medium">
              {roleName} · {planName}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
