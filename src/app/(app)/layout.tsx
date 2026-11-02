import { AppSidebar } from "@/components/sidebar";
import { AppNavbar } from "@/components/navbar";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGuard } from "@/components/auth-guard";
import { PageTitleSync } from "@/components/page-title-sync";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <TooltipProvider delayDuration={0}>
        <SidebarProvider>
          <PageTitleSync />
          <AppSidebar />
          <SidebarInset className="min-w-0">
            <AppNavbar />
            <main className="app-main min-w-0 flex-1 p-4 md:p-6">{children}</main>
          </SidebarInset>
          <ThemeCustomizer />
        </SidebarProvider>
      </TooltipProvider>
    </AuthGuard>
  );
}
