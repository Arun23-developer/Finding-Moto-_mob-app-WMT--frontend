import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Eye, Loader2, Package, RefreshCw, CheckCircle2, Calendar, MapPin, Search } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { formatLkr } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";

type DeliveryStatus = "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "FAILED";

interface DeliveryItem {
  name?: string;
  qty?: number;
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
  buyer?: DeliveryBuyer | null;
}

interface DeliveryRecord {
  _id: string;
  orderId?: string;
  status: DeliveryStatus;
  createdAt?: string;
  deliveredAt?: string | null;
  order?: DeliveryOrder | null;
}

const statusConfig: Record<DeliveryStatus, { label: string; className: string }> = {
  ASSIGNED: { label: "Assigned", className: "bg-amber-100 text-amber-700 border-amber-200" },
  PICKED_UP: { label: "Picked Up", className: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_TRANSIT: { label: "In Transit", className: "bg-violet-100 text-violet-700 border-violet-200" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function DeliveryCompletedPage() {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);

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
          deliveredAt: row.deliveredAt,
          order: row.order || null,
        }))
      );
    } catch (err: any) {
      setDeliveries([]);
      setError(err?.response?.data?.message || "Failed to load completed deliveries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const completedDeliveries = useMemo(
    () => deliveries.filter((delivery) => delivery.status === "DELIVERED" || delivery.status === "FAILED"),
    [deliveries]
  );

  const getBuyerName = (delivery: DeliveryRecord) => {
    const buyer = delivery.order?.buyer;
    if (!buyer) return "Customer";
    return `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim() || "Customer";
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={24} />
            </div>
            Mission History
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium italic">
            You have finalized <span className="text-emerald-600 font-bold underline decoration-emerald-600/30 underline-offset-4">{completedDeliveries.length} logistics missions</span> in this cycle.
          </p>
        </div>

        <Button
          onClick={() => fetchDeliveries()}
          disabled={loading}
          variant="outline"
          className="h-11 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-widest border-border/60 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Sync Archive
        </Button>
      </div>

      {error && (
        <Card className="rounded-3xl border-red-200 bg-red-50 p-4 text-center">
          <p className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center justify-center gap-2">
            <AlertCircle size={14} /> {error}
          </p>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground tracking-[0.2em]">Retrieving Mission Logs...</p>
        </div>
      ) : (
        <Card className="glass-card border border-border/40 overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {completedDeliveries.length === 0 ? (
              <div className="px-6 py-24 text-center bg-muted/5">
                <div className="h-16 w-16 rounded-[2rem] bg-muted flex items-center justify-center mx-auto mb-6 opacity-40">
                  <Package size={32} />
                </div>
                <p className="font-black text-sm text-foreground uppercase tracking-widest">History Silent</p>
                <p className="mt-2 text-xs text-muted-foreground italic font-medium">Finalized missions will populate this secure archive.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/20 bg-muted/10 text-left">
                      <th className="px-6 py-5 font-black text-[10px] text-muted-foreground uppercase tracking-widest">Mission Entity</th>
                      <th className="px-6 py-5 font-black text-[10px] text-muted-foreground uppercase tracking-widest">Resolved Point</th>
                      <th className="px-6 py-5 font-black text-[10px] text-muted-foreground uppercase tracking-widest">Manifest Value</th>
                      <th className="px-6 py-5 font-black text-[10px] text-muted-foreground uppercase tracking-widest">Final State</th>
                      <th className="px-6 py-5 font-black text-[10px] text-muted-foreground uppercase tracking-widest text-right">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {completedDeliveries.map((delivery) => {
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
                                  <Calendar size={10} />
                                  <span className="text-[10px] font-bold uppercase tracking-tight">{formatDate(delivery.deliveredAt)}</span>
                               </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="max-w-[240px] flex items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                              <MapPin size={12} className="shrink-0" />
                              <span className="text-[10px] font-bold italic line-clamp-1">{delivery.order?.shippingAddress || "N/A"}</span>
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
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg font-black uppercase tracking-widest text-[9px] border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                              onClick={() => setSelectedDelivery(delivery)}
                            >
                              <Search size={14} className="mr-1" /> Inspect
                            </Button>
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

      {/* Details Modal */}
      <Dialog open={Boolean(selectedDelivery)} onOpenChange={(open) => !open && setSelectedDelivery(null)}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Completed delivery details</DialogTitle>
            <DialogDescription>Review the selected completed delivery details.</DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
             <div className="flex flex-col">
                <div className="bg-slate-900 p-8 text-white">
                   <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-xs font-black text-blue-400 uppercase tracking-widest">Archived Mission</span>
                      <Badge className={cn("text-[10px] font-black uppercase tracking-widest border-none px-4 py-1", statusConfig[selectedDelivery.status].className)}>
                        {statusConfig[selectedDelivery.status].label}
                      </Badge>
                   </div>
                   <h2 className="text-3xl font-black tracking-tight mb-2">#{selectedDelivery._id.slice(-8).toUpperCase()}</h2>
                   <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Fulfillment Receipt</p>
                </div>

                <div className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Entity</p>
                         <p className="text-sm font-black text-slate-900">{getBuyerName(selectedDelivery)}</p>
                      </div>
                      <div className="space-y-1.5">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolution Time</p>
                         <p className="text-sm font-black text-slate-900">{formatDate(selectedDelivery.deliveredAt)}</p>
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminal Point</p>
                      <div className="flex items-start gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                         <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                         <p className="text-sm font-bold text-slate-700 leading-relaxed italic">{selectedDelivery.order?.shippingAddress || "N/A"}</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manifest Archive</p>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-white overflow-hidden">
                         {(selectedDelivery.order?.items || []).map((item, i) => (
                            <div key={i} className="px-4 py-3 flex items-center justify-between">
                               <span className="text-xs font-black text-slate-900">{item.name}</span>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty: {item.qty}</span>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1">Final Settlement</p>
                            <p className="text-2xl font-black text-emerald-950 tracking-tighter">{formatLkr(selectedDelivery.order?.totalAmount || 0)}</p>
                         </div>
                         <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                            <CheckCircle2 size={24} />
                         </div>
                      </div>
                   </div>

                   <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95" onClick={() => setSelectedDelivery(null)}>
                      Close Receipt
                   </Button>
                </div>
             </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
