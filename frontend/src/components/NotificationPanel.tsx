import { Bell, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useOrderWorkflowNotifications } from "@/context/OrderWorkflowNotificationsContext";
import { WorkflowNotificationsView } from "@/components/notifications/WorkflowNotificationsView";

interface NotificationPanelProps {
  userRole: "buyer" | "seller" | "mechanic" | "admin" | "delivery_agent";
  panelOpen: boolean;
  onPanelClose: () => void;
}

export function NotificationPanel({
  userRole,
  panelOpen,
  onPanelClose,
}: NotificationPanelProps) {
  const { unreadCount, notifications } = useOrderWorkflowNotifications();

  const notificationRoute =
    userRole === "buyer"
      ? "/buyer/notifications"
      : userRole === "delivery_agent"
        ? "/delivery/notifications"
        : `/${userRole}/notifications`;

  if (!panelOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onPanelClose} />

      <div className="absolute right-0 top-12 z-50 flex max-h-[600px] w-80 flex-col rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-foreground" />
            <h3 className="font-semibold text-foreground">Alerts</h3>
            {unreadCount > 0 ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <WorkflowNotificationsView compact />
        </div>

        {notifications.length > 0 ? (
          <Link
            to={notificationRoute}
            onClick={onPanelClose}
            className="flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            View all alerts
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </>
  );
}
