import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  Loader2, 
  Package, 
  RefreshCw, 
  Truck, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Calendar,
  MapPin
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "@/services/api";
import { cn } from "@/lib/utils";
import { formatLkr } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

type DeliveryStatus = "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "FAILED";

interface DeliveryKPIs {
  totalEarnings: number;
  totalDeliveries: number;
  completedDeliveries: number;
  activeDeliveries: number;
  successRate: number;
}

interface DeliveryRow {
  _id: string;
  orderId: string;
  customerName: string;
  address: string;
  amount: number;
  status: DeliveryStatus;
  createdAt: string;
  deliveredAt?: string;
}

interface DeliveryDashboardData {
  filter: "monthly" | "weekly";
  kpis: DeliveryKPIs;
  volumeSeries: Array<{ date: string; count: number }>;
  activeDeliveries: DeliveryRow[];
  recentDeliveries: DeliveryRow[];
}

const statusConfig: Record<DeliveryStatus, { label: string; action?: DeliveryStatus; actionLabel?: string; className: string; color: string }> = {
  ASSIGNED: {
    label: "Pickup Request",
    action: "PICKED_UP",
    actionLabel: "Pick Up",
    className: "border-amber-200 bg-amber-50 text-amber-700 font-black",
    color: "amber",
  },
  PICKED_UP: {
    label: "Picked Up",
    action: "IN_TRANSIT",
    actionLabel: "Dispatch",
    className: "border-blue-200 bg-blue-50 text-blue-700 font-black",
    color: "blue",
  },
  IN_TRANSIT: {
    label: "Out for Delivery",
    className: "border-violet-200 bg-violet-50 text-violet-700 font-black",
    color: "violet",
  },
  DELIVERED: {
    label: "Delivered",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 font-black",
    color: "emerald",
  },
  FAILED: {
    label: "Failed",
    className: "border-red-200 bg-red-50 text-red-700 font-black",
    color: "red",
  },
};

const inTransitActions: Array<{ status: DeliveryStatus; label: string; color: string }> = [
  { status: "DELIVERED", label: "Mark Delivered", color: "emerald" },
  { status: "FAILED", label: "Mark Failed", color: "red" },
];

// --- Components -----------------------------------------------------------

function KPICard({ title, value, icon: Icon, description, trend, color }: any) {
  return (
    <Card className="glass-card border border-border/40 overflow-hidden relative group">
      <div className={cn("absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-20 transition-opacity", `text-${color}-600`)}>
        <Icon size={56} />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
          <div className={cn("p-2 rounded-xl shadow-sm", `bg-${color}-500/10 text-${color}-600`)}>
            <Icon size={16} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <h3 className="text-2xl font-black tracking-tight">{value}</h3>
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span className={cn("inline-flex items-center text-[10px] font-black uppercase tracking-wider", trend.isPositive ? "text-emerald-600" : "text-red-600")}>
                {trend.isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {Math.abs(trend.value)}%
              </span>
            )}
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardTable({ title, description, columns, rows, emptyTitle, emptyDescription, icon: Icon }: any) {
  return (
    <Card className="glass-card border border-border/40 overflow-hidden shadow-sm">
      <CardHeader className="pb-4 border-b border-border/20 bg-muted/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-black uppercase tracking-widest text-foreground">{title}</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold italic">{description}</p>
          </div>
          {Icon && <Icon className="h-5 w-5 text-muted-foreground/30" />}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!rows || rows.length === 0 ? (
          <div className="px-6 py-16 text-center bg-muted/5">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 opacity-40">
              <Package size={24} />
            </div>
            <p className="font-black text-xs text-foreground uppercase tracking-widest">{emptyTitle}</p>
            <p className="mt-1 text-[10px] text-muted-foreground italic font-medium">{emptyDescription}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/20 bg-muted/10 text-left">
                  {columns.map((column: string) => (
                    <th key={column} className="px-5 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-widest">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {rows.map((row: any[], index: number) => (
                  <tr key={index} className="hover:bg-muted/20 transition-colors align-top group">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-5 py-4">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Main Page ------------------------------------------------------------

export default function DeliveryAgentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DeliveryDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [range, setRange] = useState<"monthly" | "weekly">("monthly");

  const fetchDashboard = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      const res = await api.get("/deliveries/dashboard", { params: { range } });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleStatusUpdate = async (deliveryId: string, nextStatus: DeliveryStatus) => {
    setUpdatingId(deliveryId);
    try {
      await api.patch(`/deliveries/${deliveryId}/status`, { status: nextStatus });
      fetchDashboard(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update delivery status");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <Truck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-blue-600/50" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Logistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Truck size={24} />
            </div>
            Logistics Console
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium italic">
            Monitor and manage your <span className="text-blue-600 font-bold underline decoration-blue-600/30 underline-offset-4">delivery operations</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-background/50 backdrop-blur-md p-2 rounded-2xl border border-border/40 shadow-sm">
          <div className="flex items-center bg-muted/50 rounded-xl p-1 h-11 border border-border/20">
            {(["monthly", "weekly"] as const).map((r) => (
              <Button
                key={r}
                variant="ghost"
                size="sm"
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-lg px-6 font-bold text-[10px] uppercase tracking-widest transition-all duration-300",
                  range === r ? "bg-background shadow-sm text-blue-600" : "opacity-60 hover:opacity-100"
                )}
              >
                {r}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            variant="outline"
            className="h-11 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-widest border-border/60 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Sync Ops
          </Button>
        </div>
      </div>

      {error && (
        <Card className="rounded-3xl border-red-200 bg-red-50 p-4 text-center">
          <p className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center justify-center gap-2">
            <AlertCircle size={14} /> {error}
          </p>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Logistics Earnings"
          value={formatLkr(data?.kpis.totalEarnings || 0)}
          icon={DollarSign}
          description="Total payouts"
          color="emerald"
        />
        <KPICard
          title="Fulfillment Vol"
          value={data?.kpis.totalDeliveries || 0}
          icon={Package}
          description="Total assignments"
          color="blue"
        />
        <KPICard
          title="Success Rate"
          value={`${data?.kpis.successRate.toFixed(1)}%`}
          icon={CheckCircle2}
          description="Completion ratio"
          color="violet"
        />
        <KPICard
          title="Live Dispatches"
          value={data?.kpis.activeDeliveries || 0}
          icon={Truck}
          description="In progress"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Trend Chart */}
        <Card className="xl:col-span-2 min-w-0 glass-card border border-border/40 overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-7 bg-muted/10 border-b border-border/20">
            <div>
              <CardTitle className="text-base font-black uppercase tracking-widest text-foreground">Efficiency Trend</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-1 font-bold italic">Daily delivery volume for the current {range}</p>
            </div>
            <TrendingUp size={20} className="text-blue-500 opacity-40" />
          </CardHeader>
          <CardContent className="pt-8 min-w-0">
            <div className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={320} minWidth={0}>
                <AreaChart data={data?.volumeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                    minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const dateLabel = typeof label === "string" || typeof label === "number"
                          ? new Date(label).toLocaleDateString("en-GB", { dateStyle: "full" })
                          : "Unknown date";

                        return (
                          <div className="rounded-xl border bg-background p-3 shadow-xl border-border/50">
                            <p className="text-[9px] font-black text-muted-foreground mb-1 uppercase tracking-widest">{dateLabel}</p>
                            <p className="text-sm font-black text-blue-600">{payload[0].value} Deliveries</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Operational Breakdown */}
        <Card className="glass-card border border-border/40 overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/10 border-b border-border/20">
            <CardTitle className="text-base font-black uppercase tracking-widest text-foreground">Fleet Status</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold italic">Logistics distribution by state</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
               {data?.activeDeliveries.slice(0, 3).map((d) => (
                  <div key={d._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all group">
                    <div className="flex items-start justify-between mb-2">
                       <span className="font-mono text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 uppercase">#{d.orderId.slice(-6)}</span>
                       <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0", statusConfig[d.status].className)}>
                          {statusConfig[d.status].label}
                       </Badge>
                    </div>
                    <p className="text-xs font-black text-slate-900 truncate mb-1">{d.customerName}</p>
                    <div className="flex items-center gap-1.5 text-slate-400">
                       <MapPin size={10} />
                       <span className="text-[9px] font-bold truncate italic">{d.address}</span>
                    </div>
                  </div>
               ))}
               {!data || data.activeDeliveries.length === 0 && (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500/20 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active dispatches</p>
                  </div>
               )}
            </div>
            <Button variant="outline" className="w-full h-11 rounded-xl font-black uppercase tracking-[0.15em] text-[10px] border-slate-200 shadow-sm" onClick={() => navigate('/delivery-agent/assigned')}>
              View Full Route <ChevronRight size={14} className="ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Work Table */}
      <DashboardTable
        title="Live Operations"
        description="Immediate delivery assignments requiring action"
        columns={["Tracking ID", "Customer Entity", "Terminal Address", "Service Value", "Progress State", "Control"]}
        icon={Clock}
        emptyTitle="Queue Empty"
        emptyDescription="New assignments will appear here as they are received."
        rows={data?.activeDeliveries.map((d) => [
          <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-100/50">#{d._id.slice(-8).toUpperCase()}</span>,
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all shadow-sm">
              {d.customerName.charAt(0)}
            </div>
            <span className="text-xs font-black text-slate-900 tracking-tight">{d.customerName}</span>
          </div>,
          <div className="max-w-[200px] flex items-center gap-2 text-slate-400 italic">
            <MapPin size={12} className="shrink-0" />
            <span className="text-[10px] font-bold truncate line-clamp-1">{d.address}</span>
          </div>,
          <span className="text-xs font-black text-slate-900">{formatLkr(d.amount)}</span>,
          <Badge className={cn("text-[9px] font-black uppercase tracking-[0.1em] border-none shadow-sm", statusConfig[d.status].className)}>
            {statusConfig[d.status].label}
          </Badge>,
          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
             {statusConfig[d.status].action ? (
                <Button 
                  size="sm" 
                  disabled={updatingId === d._id}
                  onClick={() => handleStatusUpdate(d._id, statusConfig[d.status].action!)}
                  className="h-8 px-4 rounded-lg bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-slate-900/10 hover:shadow-blue-500/20 transition-all"
                >
                  {updatingId === d._id ? "Syncing..." : statusConfig[d.status].actionLabel}
                </Button>
             ) : d.status === "IN_TRANSIT" ? (
                <div className="flex gap-2">
                   {inTransitActions.map(act => (
                      <Button
                        key={act.status}
                        size="sm"
                        disabled={updatingId === d._id}
                        onClick={() => handleStatusUpdate(d._id, act.status)}
                        className={cn("h-8 px-3 rounded-lg font-black uppercase tracking-widest text-[9px] shadow-lg transition-all", 
                          act.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20')}
                      >
                         {act.label}
                      </Button>
                   ))}
                </div>
             ) : (
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 size={16} />
                </div>
             )}
          </div>
        ]) || []}
      />

      {/* History Table */}
      <DashboardTable
        title="Mission History"
        description="Chronological record of completed logistics tasks"
        columns={["Timestamp", "Customer", "Fulfillment Point", "Status", "Resolution"]}
        emptyTitle="History Silent"
        emptyDescription="Detailed logs will accumulate as missions are finalized."
        rows={data?.recentDeliveries.map((d) => [
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar size={12} />
            <span className="text-[10px] font-bold">{formatDate(d.createdAt)}</span>
          </div>,
          <span className="text-xs font-black text-slate-900">{d.customerName}</span>,
          <span className="text-[10px] font-bold text-slate-400 italic truncate max-w-[180px] block">{d.address}</span>,
          <Badge className={cn("text-[8px] font-black uppercase tracking-[0.1em] border-none", statusConfig[d.status].className)}>
            {statusConfig[d.status].label}
          </Badge>,
          <div className="flex items-center gap-2">
             <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center shadow-inner", d.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')}>
                {d.status === 'DELIVERED' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
             </div>
             <span className={cn("text-[10px] font-black uppercase tracking-widest", d.status === 'DELIVERED' ? 'text-emerald-600' : 'text-red-600')}>
                {d.status === 'DELIVERED' ? "Mission Success" : "Failed / Refused"}
             </span>
          </div>
        ]) || []}
      />
    </div>
  );
}
