import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, Outlet, useRouter } from "@tanstack/react-router";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Receipt,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Receipt, label: "Expenses", path: "/expenses" },
  { icon: PiggyBank, label: "Budget", path: "/budget" },
  { icon: Users, label: "Shared Expenses", path: "/shared" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: User, label: "Profile & Survey", path: "/profile" },
];

export function RootLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { clear, identity } = useInternetIdentity();
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  const principalShort = identity
    ? `${identity.getPrincipal().toString().slice(0, 8)}...`
    : "";

  function NavItems({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive =
            path === "/" ? currentPath === "/" : currentPath.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-sidebar-primary" : "",
                )}
              />
              <span>{label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 sidebar-gradient border-r border-sidebar-border shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.52 0.18 250 / 0.3)" }}
            >
              <TrendingUp className="h-4 w-4 text-sidebar-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-sidebar-foreground text-sm leading-none">
                BudgetSmart
              </p>
              <p className="font-body text-xs text-sidebar-foreground/40 mt-0.5">
                Student Finance
              </p>
            </div>
          </div>
        </div>

        <NavItems />

        {/* User Section */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <User className="h-3.5 w-3.5 text-sidebar-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-body font-medium text-sidebar-foreground truncate">
                {principalShort}
              </p>
              <p className="text-xs text-sidebar-foreground/40 font-body">
                Connected
              </p>
            </div>
            <button
              type="button"
              onClick={() => clear()}
              className="p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 sidebar-gradient border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.52 0.18 250 / 0.3)" }}
          >
            <TrendingUp className="h-3.5 w-3.5 text-sidebar-primary" />
          </div>
          <span className="font-display font-bold text-sidebar-foreground text-sm">
            BudgetSmart
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-8 w-8"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col sidebar-gradient border-r border-sidebar-border"
            >
              <div className="px-5 py-4 border-b border-sidebar-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "oklch(0.52 0.18 250 / 0.3)" }}
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-sidebar-primary" />
                  </div>
                  <span className="font-display font-bold text-sidebar-foreground text-sm">
                    BudgetSmart
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <NavItems onNavigate={() => setMobileOpen(false)} />

              <div className="px-3 py-4 border-t border-sidebar-border">
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        <div className="gradient-mesh min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
