import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { BuyerDetailsModal } from "./orders/BuyerDetailsModal";
import { getBuyerName } from "./orders/helpers";
import { OrdersTable } from "./orders/OrdersTable";
import type { Order } from "./orders/types";
import { useToast } from "@/hooks/use-toast";
import { createAuthedSocket, type OrderWorkflowSocketEvent } from "@/lib/socket";

export default function OrdersPage() {
  const { toast } = useToast();
  const [agents, setAgents] = useState<{ _id: string; fullName: string; email: string }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignOrder, setAssignOrder] = useState<Order | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const latestEventRef = useRef<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/orders");
      setOrders(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err: any) {
      setOrders([]);
      setError(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const socket = createAuthedSocket();
    if (!socket) return;

    socket.on("order:workflow", (event: OrderWorkflowSocketEvent) => {
      if (event.audience !== "seller") return;
      const eventKey = `${event.orderId}:${event.status}:${event.timestamp}`;
      if (latestEventRef.current === eventKey) return;
      latestEventRef.current = eventKey;

      fetchOrders();
      toast({
        title: event.title,
        description: event.message,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchOrders, toast]);

  const handleStatusChange = useCallback(
    async (orderId: string, status: Order["status"]) => {
      setUpdatingOrderId(orderId);
      setError(null);
      try {
        await api.patch(`/orders/${orderId}/status`, { status });
        await fetchOrders();
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to update order status");
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [fetchOrders]
  );

  const openAssignDelivery = useCallback(async (order: Order) => {
    setAssignOrder(order);
    setSelectedAgentId("");
    setAssignError(null);
    try {
      const res = await api.get("/deliveries/agents");
      setAgents(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err: any) {
      setAgents([]);
      setAssignError(err?.response?.data?.message || "Failed to load delivery agents");
    }
  }, []);

  const handleAssignDelivery = useCallback(async () => {
    if (!assignOrder || !selectedAgentId) {
      setAssignError("Please select a delivery agent");
      return;
    }

    setAssignLoading(true);
    setAssignError(null);
    try {
      await api.post("/deliveries/assign", {
        orderId: assignOrder._id,
        agentId: selectedAgentId,
      });
      setAssignOrder(null);
      setSelectedAgentId("");
      await fetchOrders();
    } catch (err: any) {
      setAssignError(err?.response?.data?.message || "Failed to assign delivery");
    } finally {
      setAssignLoading(false);
    }
  }, [assignOrder, fetchOrders, selectedAgentId]);

  const filteredOrders = orders.filter((order) => {
    const normalizedSearch = search.toLowerCase();
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      order._id.toLowerCase().includes(normalizedSearch) ||
      getBuyerName(order.buyer).toLowerCase().includes(normalizedSearch) ||
      order.items.some((item) => item.name.toLowerCase().includes(normalizedSearch));

    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((order) => ["pending", "awaiting_seller_confirmation"].includes(order.status)).length,
    confirmed: orders.filter((order) => order.status === "confirmed").length,
    package_ready: orders.filter((order) => order.status === "ready_for_dispatch").length,
    assigned: orders.filter((order) => order.status === "pickup_assigned").length,
    picked_up: orders.filter((order) => order.status === "picked_up").length,
    out_for_delivery: orders.filter((order) => order.status === "out_for_delivery").length,
    delivered: orders.filter((order) => ["delivered", "completed"].includes(order.status)).length,
    delivery_failed: orders.filter((order) => order.status === "delivery_failed").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track, manage and fulfill your customer orders</p>
        </div>
        <Button
          onClick={fetchOrders}
          variant="outline"
          className="gap-2 h-10"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          <span>Refresh Orders</span>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="glass-card border-border/40 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Total</p>
                <p className="text-xl font-black">{statusCounts.all}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/40 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Pending</p>
                <p className="text-xl font-black">{statusCounts.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/40 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Delivered</p>
                <p className="text-xl font-black">{statusCounts.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/40 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Cancelled</p>
                <p className="text-xl font-black">{statusCounts.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-border/40 shadow-sm overflow-hidden">
        <div className="border-b border-border/40 bg-muted/20 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by ID, customer name, or product..."
                className="w-full h-10 rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 no-scrollbar overflow-x-auto pb-1 lg:pb-0">
              {[
                { id: "all", label: "All" },
                { id: "awaiting_seller_confirmation", label: "New" },
                { id: "confirmed", label: "Confirmed" },
                { id: "ready_for_dispatch", label: "Ready" },
                { id: "pickup_assigned", label: "Assigned" },
                { id: "picked_up", label: "Picked Up" },
                { id: "out_for_delivery", label: "Out" },
                { id: "delivered", label: "Delivered" },
                { id: "cancelled", label: "Cancelled" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all border",
                    statusFilter === filter.id
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-background border-border/60 text-muted-foreground hover:border-blue-500/40 hover:text-blue-600"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600/40" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing orders...</p>
            </div>
          ) : (
            <OrdersTable
              orders={filteredOrders}
              allOrdersCount={orders.length}
              error={error}
              onBuyerDetails={setSelectedOrder}
              onAssignDelivery={openAssignDelivery}
              onStatusChange={handleStatusChange}
              updatingOrderId={updatingOrderId}
            />
          )}
        </CardContent>
      </Card>

      <BuyerDetailsModal
        order={selectedOrder}
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
      />

      <Dialog open={Boolean(assignOrder)} onOpenChange={(open) => !open && setAssignOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Delivery Agent</DialogTitle>
            <DialogDescription>
              Select a delivery agent for order #{assignOrder?._id.slice(-6).toUpperCase()}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <label htmlFor="delivery-agent" className="text-sm font-medium">Delivery Agent</label>
              <select
                id="delivery-agent"
                value={selectedAgentId}
                onChange={(event) => setSelectedAgentId(event.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                disabled={assignLoading}
              >
                <option value="">Select an agent</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.fullName} {agent.email ? `(${agent.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
            {assignError && (
              <p className="text-sm text-destructive">{assignError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignOrder(null)} disabled={assignLoading}>
              Cancel
            </Button>
            <Button onClick={handleAssignDelivery} disabled={assignLoading}>
              {assignLoading ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
