"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Bell,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Moon,
  Sun,
  Menu,
  Leaf,
} from "lucide-react";

import { useAppStore, type PageView } from "@/store/app-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { LocaleSwitcher } from "@/components/locale-switcher";

// Page components
import { DashboardPage } from "@/components/pages/dashboard-page";
import { PropertiesPage } from "@/components/pages/properties-page";
import { ReportsPage } from "@/components/pages/reports-page";
import { NotificationsPage } from "@/components/pages/notifications-page";
import { ProfilePage } from "@/components/pages/profile-page";
import { SettingsPage } from "@/components/pages/settings-page";
import { HelpPage } from "@/components/pages/help-page";

// ─── Page router ────────────────────────────────────────────────────
function PageContent() {
  const { currentPage } = useAppStore();

  switch (currentPage) {
    case "dashboard":
      return <DashboardPage />;
    case "properties":
      return <PropertiesPage />;
    case "reports":
      return <ReportsPage />;
    case "notifications":
      return <NotificationsPage />;
    case "profile":
      return <ProfilePage />;
    case "settings":
      return <SettingsPage />;
    case "help":
      return <HelpPage />;
    default:
      return <DashboardPage />;
  }
}

// ─── Sidebar navigation content (shared between desktop & mobile) ───
function SidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { currentPage, setCurrentPage } = useAppStore();
  const { data: session } = useSession();
  const t = useTranslations("shell");
  const tc = useTranslations("common");

  const navItems: {
    label: string;
    view: PageView;
    icon: React.ElementType;
  }[] = [
    { label: t("nav.dashboard"), view: "dashboard", icon: LayoutDashboard },
    { label: t("nav.properties"), view: "properties", icon: Building2 },
    { label: t("nav.reports"), view: "reports", icon: BarChart3 },
    { label: t("nav.notifications"), view: "notifications", icon: Bell },
  ];

  const bottomNavItems: {
    label: string;
    view?: PageView;
    icon: React.ElementType;
    action?: () => void;
  }[] = [
    { label: t("nav.profile"), view: "profile", icon: User },
    { label: t("nav.settings"), view: "settings", icon: Settings },
    { label: t("nav.help"), view: "help", icon: HelpCircle },
  ];

  const handleNav = (view: PageView) => {
    setCurrentPage(view);
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
          <Leaf className="size-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
            GreenHelios
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("brandSubtitle")}
          </span>
        </div>
      </div>

      <Separator className="mx-3 w-auto" />

      {/* Main nav items */}
      <ScrollArea className="sidebar-scroll flex-1 px-3 py-3">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.view;
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom nav items */}
      <div className="mt-auto px-3 pb-3">
        <Separator className="mb-3" />
        <nav className="flex flex-col gap-1">
          {bottomNavItems.map((item) => {
            const isActive = item.view && currentPage === item.view;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.view) {
                    handleNav(item.view);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <LogOut className="size-4 shrink-0" />
            <span>{tc("signOut")}</span>
          </button>
        </nav>

        {/* Green accent card */}
        <div className="mt-4 rounded-xl bg-primary/10 p-3.5">
          <div className="mb-1 flex items-center gap-2">
            <Leaf className="size-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              GreenHelios
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {t("promo")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Topbar ──────────────────────────────────────────────────────────
function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { currentPage } = useAppStore();
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const { setCurrentPage } = useAppStore();
  const tShell = useTranslations("shell");
  const tc = useTranslations("common");

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="size-5" />
        <span className="sr-only">{tc("toggleMenu")}</span>
      </Button>

      {/* Page title */}
      <h1 className="text-lg font-semibold tracking-tight">
        {tShell(`pages.${currentPage}`)}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      <LocaleSwitcher />

      {/* Decorative search (desktop) */}
      <div className="hidden items-center gap-2 md:flex">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={tShell("searchPlaceholder")}
            className="w-64 pl-9 text-sm"
            readOnly
          />
        </div>
      </div>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative flex items-center gap-2 px-2"
          >
            <Avatar className="size-8 border border-primary/20">
              <AvatarImage src="/logo.png" alt={tc("user")} />
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline-block">
              {session?.user?.name || tc("user")}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setCurrentPage("profile")}>
              <User className="mr-2 size-4" />
              {tShell("pages.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrentPage("settings")}>
              <Settings className="mr-2 size-4" />
              {tShell("pages.settings")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark");
              }}
            >
              {theme === "dark" ? (
                <Sun className="mr-2 size-4" />
              ) : (
                <Moon className="mr-2 size-4" />
              )}
              {theme === "dark" ? tc("lightMode") : tc("darkMode")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="mr-2 size-4" />
            {tc("signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

// ─── App Shell (main authenticated layout) ───────────────────────────
export function AppShell() {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { currentPage } = useAppStore();
  const tc = useTranslations("common");

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 border-r bg-sidebar md:block">
        <SidebarNav />
      </aside>

      {/* Mobile sidebar sheet */}
      <Sheet open={isMobile && mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{tc("navigation")}</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mx-auto h-full max-w-7xl"
            >
              <PageContent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
