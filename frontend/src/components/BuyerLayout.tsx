import {
  Bell,
  House,
  MessageSquare,
  Package,
  RotateCcw,
  ShoppingCart,
  User,
} from "lucide-react";
import { DashboardShell } from "./DashboardShell";

const navItems = [
  { title: "Home / Explore", icon: House, path: "/dashboard" },
  { title: "Cart", icon: Package, path: "/buyer/cart" },
  { title: "My Orders", icon: ShoppingCart, path: "/my-orders" },
  { title: "Return & Claims", icon: RotateCcw, path: "/buyer/returns-claims" },
  { title: "Chat", icon: MessageSquare, path: "/chat" },
  { title: "Notifications", icon: Bell, path: "/buyer/notifications" },
];

interface BuyerLayoutProps {
  children: React.ReactNode;
}

export function BuyerLayout({ children }: BuyerLayoutProps) {
  return (
    <DashboardShell
      navItems={navItems}
      panelLabel="Buyer Dashboard"
      roleLabel="Buyer"
      roleIcon={User}
      avatarFallback="B"
      profilePath="/buyer/account"
      profileLabel="Account"
      profileSubtitle="Buyer account"
      aiPath="/ai-chat"
      notificationRole="buyer"
    >
      {children}
    </DashboardShell>
  );
}
