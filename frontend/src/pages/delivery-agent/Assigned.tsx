import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Eye, Loader2, Package, RefreshCw, Truck, MapPin, Phone, Calendar, ChevronRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { createAuthedSocket, type OrderWorkflowSocketEvent, type ReturnWorkflowSocketEvent } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { formatLkr } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { RETURN_STATUS_LABELS, RETURN_STATUS_STYLES, type ReturnRequest } from "@/lib/returns";

type DeliveryStatus = "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "FAILED";

interface DeliveryItem {
  name?: string;
  qty?: number;
  price?: number;
}

interface DeliveryBuyer {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

interface DeliveryOrder {
  _id?: string;
  items?: DeliveryItem[];
  totalAmount?: number;
  shippingAddress?: string;
  paymentMethod?: string;
  createdAt?: string;
  buyer?: DeliveryBuyer | null;
}

interface DeliveryRecord {
  _id: string;
  orderId?: string;
  status: DeliveryStatus;
  createdAt?: string;
  order?: DeliveryOrder | null;
}

const statusConfig: Record<
  DeliveryStatus,
  { label: string; action?: DeliveryStatus; actionLabel?: string; className: string; color: string }
> = {
  ASSIGNED: {
    label: "Pickup Request",
    action: "PICKED_UP",
    actionLabel: "Pick Up",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    color: "amber",
  },
  PICKED_UP: {
    label: "Picked Up",
    action: "IN_TRANSIT",
    actionLabel: "Dispatch",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    color: "blue",
  },
  IN_TRANSIT: {
    label: "Out for Delivery",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    color: "violet",
  },
  DELIVERED: {
    label: "Delivered",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    color: "emerald",
  },
  FAILED: {
    label: "Failed",
    className: "border-red-200 bg-red-50 text-red-700",
    color: "red",
  },
};

const inTransitActions: Array<{ status: DeliveryStatus; label: string; color: string }> = [
  { status: "DELIVERED", label: "Mark Delivered", color: "emerald" },
  { status: "FAILED", label: "Mark Failed", color: "red" },
];

const returnActionConfig: Record<string, { label: string; nextStatus: string } | null> = {
  RETURN_PICKUP_ASSIGNED: { label: "Mark Picked Up", nextStatus: "RETURN_PICKED_UP" },
  RETURN_PICKED_UP: { label: "Mark Returned", nextStatus: "RETURN_DELIVERED" },
  RETURN_IN_TRANSIT: { label: "Mark Returned", nextStatus: "RETURN_DELIVERED" },
};

export default function DeliveryAssignedPage() {
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [returnPickups, setReturnPickups] = useState<ReturnRequest[]>([]);
  const [returnUpdatingId, setReturnUpdatingId] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/deliveries/my");
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      setDeliveries(
        rows.map((row: any) => ({
          _id: row._id,
          orderId: row.orderId?._id || row.orderId,
          status: row.status,
          createdAt: row.createdAt,
          order: row.order || null,
        }))
      );
    } catch (err: any) {
      setDeliveries([]);
      setError(err?.response?.data?.message || "Failed to load assigned deliveries");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReturnPickups = useCallback(async () => {
    try {
      const res = await api.get("/returns/agent/pickups");
      setReturnPickups(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to load return pickups:", err);
      setReturnPickups([]);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
    fetchReturnPickups();
  }, [fetchDeliveries, fetchReturnPickups]);

  useEffect(() => {
    const socket = createAuthedSocket();
    if (!socket) return;

    socket.on("order:workflow", (event: OrderWorkflowSocketEvent) => {
      if (event.audience !== "delivery_agent") return;
      fetchDeliveries();
      toast({
        title: event.title,
        description: event.message,
      });
    });

    socket.on("return:workflow", (event: ReturnWorkflowSocketEvent) => {
      if (event.audience !== "delivery_agent") return;
      fetchReturnPickups();
      toast({
        title: event.title,
        description: event.message,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchDeliveries, fetchReturnPickups, toast]);

  const handleStatusUpdate = useCallback(async (deliveryId: string, nextStatus: DeliveryStatus) => {
    setUpdatingId(deliveryId);
    setError(null);
    try {
      await api.patch(`/deliveries/${deliveryId}/status`, { status: nextStatus });
      setDeliveries((current) =>
        current.map((delivery) =>
          delivery._id === deliveryId ? { ...delivery, status: nextStatus } : delivery
        )
      );
      setSelectedDelivery((current) =>
        current && current._id === deliveryId ? { ...current, status: nextStatus } : current
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update delivery status");
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const assignedDeliveries = useMemo(
    () => deliveries.filter((delivery) => delivery.status !== "DELIVERED"),
    [deliveries]
  );

  const activeReturnPickups = useMemo(
    () => returnPickups.filter((item) => item.status !== "RETURN_DELIVERED"),
    [returnPickups]
  );

  const getBuyerName = (delivery: DeliveryRecord) => {
    const buyer = delivery.order?.buyer;
    if (!buyer) return "Customer";
    return `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim() || "Customer";
  };

  const getFullAddress = (delivery: DeliveryRecord) =>
    delivery.order?.buyer?.address || delivery.order?.shippingAddress || "N/A";

  const getItemsSummary = (delivery: DeliveryRecord) => {
    const items = delivery.order?.items || [];
    if (!items.length) return "N/A";
    return items.map((item) => `${item.name} x${item.qty}`).join(", ");
  };

  const getReturnBuyerName = (item: ReturnRequest) => {
    const buyer = item.buyer;
    if (!buyer) return "Customer";
    return `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim() || buyer.email || "Customer";
  };

  const getReturnItemsSummary = (item: ReturnRequest) => {
    const items = item.order?.items || [];
    if (!items.length) return "Return package";
    return items.map((orderItem) => `${orderItem.name} x${orderItem.qty}`).join(", ");
  };

  const getReturnAddress = (item: ReturnRequest) =>
    `${item.pickupAddress.fullAddress}, ${item.pickupAddress.city}, ${item.pickupAddress.district} ${item.pickupAddress.postalCode}`;

  const handleReturnStatusUpdate = useCallback(async (returnRequestId: string, nextStatus: string) => {
    setReturnUpdatingId(returnRequestId);
    setError(null);
    try {
      await api.patch(`/returns/${returnRequestId}/agent-status`, { status: nextStatus });
      setReturnPickups((current) =>
        current
          .map((item) => (item._id === returnRequestId ? { ...item, status: nextStatus } : item))
          .filter((item) => item.status !== "RETURN_DELIVERED")
      );
      toast({
        title: "Return status updated",
        description:
          nextStatus === "RETURN_PICKED_UP"
            ? "Return package marked as picked up."
            : "Return package marked as returned to seller.",
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update return pickup status");
    } finally {
      setReturnUpdatingId(null);
    }
  }, [toast]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Calendar size={24} />
            </div>
            Active Mission Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium italic">
            You have <span className="text-blue-600 font-bold underline decoration-blue-600/30 underline-offset-4">{assignedDeliveries.length + activeReturnPickups.length} active assignments</span> requiring your attention.
          </p>
        </div>

        <Button
          onClick={() => {
            fetchDeliveries();
            fetchReturnPickups();
          }}
          disabled={loading}
          variant="outline"
          className="h-11 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-widest border-border/60 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Sync Missions
        </Button>
      </div>

      {error && (
        <Card className="rounded-3xl border-red-200 bg-red-50 p-4 text-center shadow-sm">
          <p className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center justify-center gap-2">
            <AlertCircle size={14} /> {error}
          </p>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground tracking-[0.2em]">Updating Dispatch Queue...</p>
        </div>
      ) : (
        <Card className="glass-card border border-border/40 overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {assignedDeliveries.length === 0 ? (
              <div className="px-6 py-24 text-center bg-muted/5">
                <div className="h-16 w-16 rounded-[2rem] bg-muted flex items-center justify-center mx-auto mb-6 opacity-40">
                  <Package size={32} />
                </div>
                <p className="font-black text-sm text-foreground uppercase tracking-widest">Queue Status: Empty</p>
                <p className="mt-2 text-xs text-muted-foreground italic font-medium">New logistics missions will propagate here automatically.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/20 bg-muted/10 text-left">
                      <th className="px-6 py-5 font-black text-[10px] text-muted-foreground uppercase tracking-widest">Mission Entity</th>
                      <th className="px-6 py-5 font-black text-[10px] text-muted-foreground uppercase tracking-widest">Fulfillment Point</th>
                      <th className="px-6 py-5 font-black text-[10px] text-muted-foreground uppercase tracking-widest">Manifest Value</th>
                      <th className="px-6 py-5 font-black text-[10px] text-muted-foreground uppercase tracking-widest">Progress State</th>
                      <th className="px-6 py-5 font-black text-[10px] text-muted-foreground uppercase tracking-widest text-right">Operational Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {assignedDeliveries.map((delivery) => {
                      const cfg = statusConfig[delivery.status];
                      return (
                        <tr key={delivery._id} className="hover:bg-muted/20 transition-colors align-top group">
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1.5">
                               <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 uppercase tracking-tighter shadow-sm">#{delivery._id.slice(-6).toUpperCase()}</span>
                                  <span className="text-xs font-black text-slate-900">{getBuyerName(delivery)}</span>
                               </div>
                               <div className="flex items-center gap-1.5 text-slate-400">
                                  <Package size={10} />
                                  <span className="text-[10px] font-bold uppercase tracking-tight">{getItemsSummary(delivery)}</span>
                               </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="max-w-[240px] flex items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                              <MapPin size={12} className="shrink-0" />
                              <span className="text-[10px] font-bold italic line-clamp-1">{getFullAddress(delivery)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="font-black text-slate-900 text-xs">{formatLkr(delivery.order?.totalAmount || 0)}</span>
                          </td>
                          <td className="px-6 py-5">
                            <Badge className={cn("text-[9px] font-black uppercase tracking-[0.1em] border-none shadow-sm", cfg.className)}>
                              {cfg.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg font-black uppercase tracking-widest text-[9px] border-slate-200"
                                onClick={() => setSelectedDelivery(delivery)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" /> Details
                              </Button>
                              
                              {cfg.action ? (
                                <Button
                                  size="sm"
                                  disabled={updatingId === delivery._id}
                                  onClick={() => handleStatusUpdate(delivery._id, cfg.action!)}
                                  className="h-8 px-4 rounded-lg bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-slate-900/10 hover:shadow-blue-500/20 transition-all"
                                >
                                  {updatingId === delivery._id ? "Syncing..." : cfg.actionLabel}
                                </Button>
                              ) : delivery.status === "IN_TRANSIT" ? (
                                <div className="flex gap-2">
                                  {inTransitActions.map((action) => (
                                    <Button
                                      key={action.status}
                                      size="sm"
                                      disabled={updatingId === delivery._id}
                                      onClick={() => handleStatusUpdate(delivery._id, action.status)}
                                      className={cn("h-8 px-3 rounded-lg font-black uppercase tracking-widest text-[9px] shadow-lg transition-all", 
                                        action.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20')}
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                   <CheckCircle2 size={16} />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="glass-card border border-border/40 overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Return Pickup Queue</CardTitle>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            {activeReturnPickups.length} Active
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {activeReturnPickups.length === 0 ? (
            <div className="px-6 py-14 text-center bg-muted/5">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 opacity-50">
                <Truck size={28} />
              </div>
              <p className="font-black text-sm text-foreground uppercase tracking-widest">No Return Pickups</p>
              <p className="mt-2 text-xs text-muted-foreground font-medium">Assigned return pickups will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/20 bg-muted/10 text-left">
                    <th className="px-6 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-widest">Return</th>
                    <th className="px-6 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-widest">Pickup Address</th>
                    <th className="px-6 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-widest">Reason</th>
                    <th className="px-6 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {activeReturnPickups.map((item) => {
                    const action = returnActionConfig[item.status];
                    return (
                      <tr key={item._id} className="hover:bg-muted/20 transition-colors align-top">
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-100 uppercase tracking-tighter">#{item._id.slice(-6).toUpperCase()}</span>
                              <span className="text-xs font-black text-slate-900">{getReturnBuyerName(item)}</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">{getReturnItemsSummary(item)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="max-w-[280px] flex items-start gap-2 text-slate-400">
                            <MapPin size={12} className="shrink-0 mt-0.5" />
                            <span className="text-[10px] font-bold italic line-clamp-2">{getReturnAddress(item)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-bold text-slate-700">{item.reason}</span>
                        </td>
                        <td className="px-6 py-5">
                          <Badge className={cn("text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm", RETURN_STATUS_STYLES[item.status] || "border-border bg-muted text-foreground")}>
                            {RETURN_STATUS_LABELS[item.status] || item.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-right">
                          {action ? (
                            <Button
                              size="sm"
                              disabled={returnUpdatingId === item._id}
                              onClick={() => handleReturnStatusUpdate(item._id, action.nextStatus)}
                              className="h-8 px-4 rounded-lg bg-slate-900 hover:bg-cyan-700 text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-slate-900/10"
                            >
                              {returnUpdatingId === item._id ? "Updating..." : action.label}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Waiting for seller</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={Boolean(selectedDelivery)} onOpenChange={(open) => !open && setSelectedDelivery(null)}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Assigned delivery details</DialogTitle>
            <DialogDescription>Review the selected delivery assignment details.</DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
             <div className="flex flex-col">
                <div className="bg-slate-900 p-8 text-white">
                   <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-xs font-black text-blue-400 uppercase tracking-widest">Mission Profile</span>
                      <Badge className={cn("text-[10px] font-black uppercase tracking-widest border-none px-4 py-1", statusConfig[selectedDelivery.status].className)}>
                        {statusConfig[selectedDelivery.status].label}
                      </Badge>
                   </div>
                   <h2 className="text-3xl font-black tracking-tight mb-2">#{selectedDelivery._id.slice(-8).toUpperCase()}</h2>
                   <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Assigned Logistics ID</p>
                </div>

                <div className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Entity</p>
                         <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">{getBuyerName(selectedDelivery).charAt(0)}</div>
                            {getBuyerName(selectedDelivery)}
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</p>
                         <p className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <Phone size={14} className="text-blue-500" />
                            {selectedDelivery.order?.buyer?.phone || "N/A"}
                         </p>
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminal Address</p>
                      <div className="flex items-start gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                         <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                         <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{getFullAddress(selectedDelivery)}"</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo Manifest</p>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-white overflow-hidden">
                         {(selectedDelivery.order?.items || []).map((item, i) => (
                            <div key={i} className="px-4 py-3 flex items-center justify-between">
                               <span className="text-xs font-black text-slate-900">{item.name}</span>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity: {item.qty}</span>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="flex items-center justify-between p-6 rounded-2xl bg-blue-50 border border-blue-100">
                      <div>
                         <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Manifest Value</p>
                         <p className="text-2xl font-black text-blue-950 tracking-tighter">{formatLkr(selectedDelivery.order?.totalAmount || 0)}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Method</p>
                         <p className="text-sm font-black text-blue-950 italic">{selectedDelivery.order?.paymentMethod || "Electronic Payout"}</p>
                      </div>
                   </div>

                   <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95" onClick={() => setSelectedDelivery(null)}>
                      Close Mission Profile
                   </Button>
                </div>
             </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
