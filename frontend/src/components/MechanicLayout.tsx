import {
  Bell,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Package,
  Star,
  RotateCcw,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import { DashboardShell } from "./DashboardShell";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/mechanic/dashboard" },
  { title: "Products (Add / Manage)", icon: Package, path: "/mechanic/products" },
  { title: "Services (Add / Manage)", icon: Wrench, path: "/mechanic/services" },
  { title: "Orders", icon: ShoppingCart, path: "/mechanic/orders" },
  { title: "Rating & Review", icon: Star, path: "/mechanic/reviews" },
  { title: "Returns & Claims", icon: RotateCcw, path: "/mechanic/returns-claims" },
  { title: "Notification", icon: Bell, path: "/mechanic/notification" },
  { title: "Buyer message center", icon: MessageSquare, path: "/mechanic/buyer-message-center" },
  { title: "Support / Help Center", icon: LifeBuoy, path: "/mechanic/support-help-center" },
];

interface MechanicLayoutProps {
  children: React.ReactNode;
}

export function MechanicLayout({ children }: MechanicLayoutProps) {
  return (
    <DashboardShell
      navItems={navItems}
      panelLabel="Mechanic Panel"
      roleLabel="Mechanic"
      roleIcon={Wrench}
      avatarFallback="M"
      profilePath="/mechanic/profile"
      profileLabel="Workshop Profile"
      profileSubtitle="Mechanic account"
      aiPath="/mechanic/ai-chat"
      notificationRole="mechanic"
    >
      {children}
    </DashboardShell>
  );
}
