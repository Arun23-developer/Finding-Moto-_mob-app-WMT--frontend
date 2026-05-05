import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  UserCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { resolveMediaUrl } from "@/lib/imageUrl";
import { NotificationPanel } from "./NotificationPanel";
import { useOrderWorkflowNotifications } from "@/context/OrderWorkflowNotificationsContext";

type NotificationRole = "buyer" | "seller" | "mechanic" | "admin" | "delivery_agent";

export interface DashboardNavItem {
  title: string;
  icon: ComponentType<{ className?: string }>;
  path: string;
  isActive?: (pathname: string, search: string) => boolean;
  children?: DashboardNavItem[];
}

interface DashboardShellProps {
  children: ReactNode;
  navItems: DashboardNavItem[];
  panelLabel: string;
  roleLabel: string;
  roleIcon: ComponentType<{ className?: string }>;
  avatarFallback: string;
  profilePath?: string;
  profileLabel?: string;
  profileSubtitle?: string;
  aiPath?: string;
  aiTitle?: string;
  notificationRole?: NotificationRole;
}

export function DashboardShell({
  children,
  navItems,
  panelLabel,
  roleLabel,
  roleIcon: RoleIcon,
  avatarFallback,
  profilePath,
  profileLabel,
  profileSubtitle,
  aiPath,
  aiTitle = "AI Assistant",
  notificationRole,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useOrderWorkflowNotifications();

  const activeItem = useMemo(
    () => {
      const findActiveItem = (items: DashboardNavItem[]): DashboardNavItem | undefined => {
        for (const item of items) {
          const isItemActive = item.isActive
            ? item.isActive(location.pathname, location.search)
            : item.path === location.pathname;

          if (isItemActive) return item;

          if (item.children?.length) {
            const activeChild = findActiveItem(item.children);
            if (activeChild) return activeChild;
          }
        }

        return undefined;
      };

      return findActiveItem(navItems);
    },
    [location.pathname, location.search, navItems]
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (): string => {
    if (!user) return avatarFallback;
    return `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase() || avatarFallback;
  };

  const displayedProfileSubtitle = profileSubtitle || roleLabel;
  const currentPage = activeItem?.title || panelLabel;

  return (
    <div className="dashboard-shell flex min-h-screen w-full">
      {mobileOpen && (
        <div className="dashboard-overlay fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "dashboard-sidebar fixed top-0 z-50 flex h-screen flex-col border-r transition-all duration-300",
          collapsed ? "lg:w-[70px]" : "lg:w-[260px]",
          mobileOpen ? "w-[260px] translate-x-0" : "w-[260px] -translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            <div className="dashboard-sidebar-logo flex h-9 w-9 items-center justify-center rounded-lg">
              <RoleIcon className="h-5 w-5 text-white" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold tracking-tight text-white">Finding Moto</h1>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">{panelLabel}</p>
              </div>
            )}
          </div>
          <button className="text-white/70 hover:text-white lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {(!collapsed || mobileOpen) && (
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="dashboard-sidebar-avatar flex h-10 w-10 items-center justify-center rounded-full overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={resolveMediaUrl(user.avatar, `https://placehold.co/80x80?text=${avatarFallback}`)}
                    alt={`${roleLabel} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold">{getInitials()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                </p>
                <p className="truncate text-xs text-white/60">{displayedProfileSubtitle}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => {
            const isActive = item.isActive
              ? item.isActive(location.pathname, location.search)
              : item.path === location.pathname;
            const activeChild = item.children?.find((child) =>
              child.isActive ? child.isActive(location.pathname, location.search) : child.path === location.pathname
            );
            const isParentActive = isActive || Boolean(activeChild);

            return (
              <div key={item.path} className="group relative">
                <Link
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "dashboard-nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isParentActive && "dashboard-nav-item-active"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {(!collapsed || mobileOpen) && <span>{item.title}</span>}
                </Link>
                {item.children?.length && (!collapsed || mobileOpen) ? (
                  <div className="mt-1 ml-7 space-y-1 border-l border-white/10 pl-3">
                    {item.children.map((child) => {
                      const isChildActive = child.isActive
                        ? child.isActive(location.pathname, location.search)
                        : child.path === location.pathname;

                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition-all duration-200 hover:bg-white/10 hover:text-white",
                            isChildActive && "bg-white/10 text-white"
                          )}
                        >
                          {child.title}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
                {collapsed && !mobileOpen && (
                  <div className="pointer-events-none absolute left-full top-1/2 z-[999] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 invisible shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    {item.title}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-900" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-2 py-3">
          <div className="group relative">
            <Link
              to="/"
              className="dashboard-nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5 flex-shrink-0" />
              {(!collapsed || mobileOpen) && <span>Back to Site</span>}
            </Link>
          </div>
          <div className="group relative">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 transition-all duration-200 hover:bg-red-500/15 hover:text-red-200"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {(!collapsed || mobileOpen) && <span>Logout</span>}
            </button>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden w-full items-center justify-center rounded-lg py-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      <div className={cn("flex min-h-screen min-w-0 flex-1 flex-col", collapsed ? "lg:ml-[70px]" : "lg:ml-[260px]")}>
        <header className="dashboard-header sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 md:px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 transition-colors hover:bg-black/5 lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5 text-[var(--text-main)]" />
            </button>
            <h2 className="text-lg font-semibold text-[var(--text-main)]">{currentPage}</h2>
          </div>

          <div className="flex items-center gap-3">
            {notificationRole ? (
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative rounded-lg p-2 transition-colors hover:bg-black/5"
                >
                  <Bell className="h-5 w-5 text-[var(--text-main)]" />
                  {unreadCount > 0 ? (
                    <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[var(--theme-danger)]" />
                  ) : null}
                </button>
                <NotificationPanel
                  userRole={notificationRole}
                  panelOpen={notificationOpen}
                  onPanelClose={() => setNotificationOpen(false)}
                />
              </div>
            ) : null}

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-black/5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(37,99,235,0.12)] text-[var(--theme-primary)] overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={resolveMediaUrl(user.avatar, `https://placehold.co/80x80?text=${avatarFallback}`)}
                      alt={`${roleLabel} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold">{getInitials()}</span>
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-none text-[var(--text-main)]">
                    {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{roleLabel}</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-[var(--text-muted)] sm:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="dashboard-surface absolute right-0 top-12 z-50 w-56 rounded-xl py-2">
                    <div className="border-b px-3 py-2" style={{ borderColor: "var(--border-soft)" }}>
                      <p className="text-sm font-medium text-[var(--text-main)]">
                        {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
                    </div>
                    {profilePath && profileLabel ? (
                      <Link
                        to={profilePath}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-main)] transition-colors hover:bg-black/5"
                      >
                        <UserCircle className="h-4 w-4" />
                        {profileLabel}
                      </Link>
                    ) : null}
                    <Link
                      to="/change-password"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-main)] transition-colors hover:bg-black/5"
                    >
                      <span className="text-sm">Lock</span>
                      Change Password
                    </Link>
                    <div className="mt-1 border-t pt-1" style={{ borderColor: "var(--border-soft)" }}>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--theme-danger)] transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 animate-fade-in">{children}</main>
      </div>

      {aiPath ? (
        <button
          onClick={() => navigate(aiPath)}
          title={aiTitle}
          className="dashboard-fab fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full border-none transition-all duration-200 hover:scale-105"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" />
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <path d="M8 12h.01" />
            <path d="M16 12h.01" />
            <path d="M9 17c1.2.8 2.4 1 3 1s1.8-.2 3-1" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
