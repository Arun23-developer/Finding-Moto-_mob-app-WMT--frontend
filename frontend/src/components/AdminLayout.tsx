import {
  Bell,
  Flag,
  LayoutDashboard,
  Mail,
  Settings,
  Shield,
  Store,
  Truck,
  Wrench,
  ShoppingCart,
  Package,
  Star,
  BarChart3,
  Megaphone,
} from "lucide-react";
import { DashboardShell } from "./DashboardShell";

const navItems = [
  // Analytics Section
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { title: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  
  // Management Section
  { title: "Products", icon: Package, path: "/admin/products" },
  { title: "Orders", icon: ShoppingCart, path: "/admin/orders" },
  { title: "Ratings & Reviews", icon: Star, path: "/admin/ratings" },
  
  // Users Section
  {
    title: "Sellers",
    icon: Store,
    path: "/admin/users?tab=seller",
    isActive: (pathname, search) => pathname === "/admin/users" && new URLSearchParams(search).get("tab") === "seller",
  },
  {
    title: "Mechanics",
    icon: Wrench,
    path: "/admin/users?tab=mechanic",
    isActive: (pathname, search) => pathname === "/admin/users" && new URLSearchParams(search).get("tab") === "mechanic",
  },
  {
    title: "Delivery Agents",
    icon: Truck,
    path: "/admin/users?tab=delivery_agent",
    isActive: (pathname, search) =>
      pathname === "/admin/users" && new URLSearchParams(search).get("tab") === "delivery_agent",
  },
  
  // Monitoring Section
  {
    title: "Reports",
    icon: Flag,
    path: "/admin/reports?tab=seller",
    isActive: (pathname) => pathname === "/admin/reports",
  },
  { title: "Notifications", icon: Bell, path: "/admin/notifications" },
  {
    title: "Info to Users",
    icon: Megaphone,
    path: "/admin/info-to-users?role=seller",
    isActive: (pathname) => pathname === "/admin/info-to-users",
    children: [
      {
        title: "Sellers",
        icon: Store,
        path: "/admin/info-to-users?role=seller",
        isActive: (pathname, search) =>
          pathname === "/admin/info-to-users" && new URLSearchParams(search).get("role") === "seller",
      },
      {
        title: "Mechanics",
        icon: Wrench,
        path: "/admin/info-to-users?role=mechanic",
        isActive: (pathname, search) =>
          pathname === "/admin/info-to-users" && new URLSearchParams(search).get("role") === "mechanic",
      },
      {
        title: "Delivery Agents",
        icon: Truck,
        path: "/admin/info-to-users?role=delivery_agent",
        isActive: (pathname, search) =>
          pathname === "/admin/info-to-users" && new URLSearchParams(search).get("role") === "delivery_agent",
      },
      {
        title: "Buyers",
        icon: ShoppingCart,
        path: "/admin/info-to-users?role=buyer",
        isActive: (pathname, search) =>
          pathname === "/admin/info-to-users" && new URLSearchParams(search).get("role") === "buyer",
      },
    ],
  },
  
  // Settings Section
  { title: "Visitor Messages", icon: Mail, path: "/admin/visitor-messages" },
  { title: "Settings", icon: Settings, path: "/admin/settings" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <DashboardShell
      navItems={navItems}
      panelLabel="Admin Panel"
      roleLabel="Administrator"
      roleIcon={Shield}
      avatarFallback="A"
      profileSubtitle="System administrator"
      notificationRole="admin"
    >
      {children}
    </DashboardShell>
  );
}
