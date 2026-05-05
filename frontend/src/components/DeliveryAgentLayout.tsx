import {
  Bell,
  CheckCircle2,
  LayoutDashboard,
  LifeBuoy,
  Truck,
} from "lucide-react";
import { DashboardShell } from "./DashboardShell";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/delivery/dashboard" },
  { title: "Assigned Deliveries", icon: Truck, path: "/delivery/assigned" },
  { title: "Completed Deliveries", icon: CheckCircle2, path: "/delivery/completed" },
  { title: "Notifications", icon: Bell, path: "/delivery/notifications" },
  { title: "Support / Help Center", icon: LifeBuoy, path: "/delivery/support-help-center" },
];

interface DeliveryAgentLayoutProps {
  children: React.ReactNode;
}

export function DeliveryAgentLayout({ children }: DeliveryAgentLayoutProps) {
  return (
    <DashboardShell
      navItems={navItems}
      panelLabel="Delivery Panel"
      roleLabel="Delivery Agent"
      roleIcon={Truck}
      avatarFallback="D"
      profileLabel="Delivery Agent Profile"
      profilePath="/delivery/profile"
      profileSubtitle="Delivery agent account"
      notificationRole="delivery_agent"
    >
      {children}
    </DashboardShell>
  );
}
