"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronRight } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { sidebarNavigation, type NavItem } from "@/config/sidebar";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import { NavUser } from "@/components/sidebar/nav-user";
import { useThemeConfig } from "@/components/theme-customizer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import { useAuth } from "@/context/auth-context";

export function AppSidebar() {
  const pathname = usePathname();
  const { config } = useThemeConfig();
  const { user, tenant } = useAuth();

  // Role-based navigation filtering:
  // - Super Admin sees everything
  // - Tenant users only see items authorized for their active role (e.g. Owner, Admin, Cashier, etc.)
  const filteredNavigation = sidebarNavigation
    .map((group) => {
      // Platform Super Admin group guard
      if ((group.superadminOnly || group.label === "Super Admin") && !user?.is_superadmin) {
        return null;
      }

      // Filter individual items within the group
      const allowedItems = group.items.filter((item) => {
        // Superadmin-only item
        if (item.superadminOnly && !user?.is_superadmin) {
          return false;
        }

        // Platform Superadmin has access to everything
        if (user?.is_superadmin) {
          return true;
        }

        // Check if item has permissions restrictions
        if (item.permissions && item.permissions.length > 0) {
          const userPerms = tenant?.permissions || user?.current_tenant?.permissions || [];
          const hasPerm =
            userPerms.includes("*") ||
            item.permissions.some((p) => userPerms.includes(p));
          if (hasPerm) {
            return true;
          }
        }

        // Check if item has role restrictions (e.g. Admin fallback)
        if (item.roles && item.roles.length > 0) {
          const currentRole = tenant?.role_name || user?.current_tenant?.role_name;
          if (currentRole && item.roles.includes(currentRole)) {
            return true;
          }
        }

        // If item specified restrictions and neither matched, hide it
        if (
          (item.permissions && item.permissions.length > 0) ||
          (item.roles && item.roles.length > 0)
        ) {
          return false;
        }

        return true;
      });

      // If no authorized items in this group, hide group completely
      if (allowedItems.length === 0) {
        return null;
      }

      return {
        ...group,
        items: allowedItems,
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);


  return (
    <Sidebar
      collapsible={config.sidebarCollapsible}
      variant={config.sidebarVariant}
    >
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent className="overscroll-contain">
        {filteredNavigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavEntry key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function badgeClass(badge: string, active?: boolean) {
  if (active) {
    return "bg-white/20 text-white font-semibold";
  }
  return /^\d+$/.test(badge)
    ? "bg-sidebar-accent text-sidebar-accent-foreground"
    : "bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground peer-hover/menu-button:text-primary-foreground peer-data-active/menu-button:text-primary-foreground";
}

function NavEntry({ item, pathname }: { item: NavItem; pathname: string }) {
  const { setOpenMobile } = useSidebar();
  const closeMobile = () => setOpenMobile(false);

  // Collapsible parent with children.
  if (item.items?.length) {
    const childActive = item.items.some(
      (c) => pathname === c.url || (c.url !== "/" && pathname.startsWith(c.url + "/"))
    );
    return (
      <Collapsible
        asChild
        defaultOpen={childActive}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={childActive}
              className={cn(
                childActive &&
                  "bg-zinc-950! text-white! font-semibold shadow-xs hover:bg-zinc-950! hover:text-white! [&_svg]:text-white! dark:bg-zinc-100! dark:text-zinc-950! dark:hover:bg-zinc-100! dark:hover:text-zinc-950! dark:[&_svg]:text-zinc-950!"
              )}
            >
              {item.icon && <item.icon className="size-4" />}
              <span>{item.title}</span>
              {item.badge && (
                <SidebarMenuBadge
                  className={cn(
                    "group-data-[state=open]/collapsible:hidden",
                    badgeClass(item.badge, childActive)
                  )}
                >
                  {item.badge}
                </SidebarMenuBadge>
              )}
              <IconChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((sub) => {
                const active =
                  pathname === sub.url ||
                  (sub.url !== "/" && pathname.startsWith(sub.url + "/"));
                return (
                  <SidebarMenuSubItem key={sub.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={active}
                      className={cn(
                        active &&
                          "bg-zinc-950! text-white! font-semibold shadow-xs hover:bg-zinc-950! hover:text-white! [&_svg]:text-white! dark:bg-zinc-100! dark:text-zinc-950! dark:hover:bg-zinc-100! dark:hover:text-zinc-950! dark:[&_svg]:text-zinc-950!"
                      )}
                    >
                      <Link href={sub.url} onClick={closeMobile}>
                        <span>{sub.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  // Single direct link item
  const active = item.url
    ? pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url + "/"))
    : false;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={active}
        className={cn(
          active &&
            "bg-zinc-950! text-white! font-semibold shadow-xs hover:bg-zinc-950! hover:text-white! [&_svg]:text-white! dark:bg-zinc-100! dark:text-zinc-950! dark:hover:bg-zinc-100! dark:hover:text-zinc-950! dark:[&_svg]:text-zinc-950!"
        )}
      >
        <Link href={item.url ?? "#"} onClick={closeMobile}>
          {item.icon && <item.icon className="size-4" />}
          <span>{item.title}</span>
          {item.badge && (
            <SidebarMenuBadge className={badgeClass(item.badge, active)}>
              {item.badge}
            </SidebarMenuBadge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default AppSidebar;
