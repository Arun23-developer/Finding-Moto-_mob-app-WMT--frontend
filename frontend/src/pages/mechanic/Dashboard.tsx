import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Eye,
  RefreshCw,
  Star,
  Wrench,
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  RotateCcw,
  BarChart3,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type DashboardTab = "product" | "service";

interface DashboardKpis {
  totalRevenue: number;
  ordersThisMonth: number;
  ordersThisMonthAmount: number;
  pendingOrders: number;
  avgOrderValue: number;
  completionRate: number;
  revenueGrowth: number;
}

interface DashboardRow {
  orderId?: string;
  reviewId?: string;
  customerName: string;
  itemName: string;
  orderAmount?: number;
  orderDate?: string;
  orderStatus?: string;
  rating?: number;
  review?: string;
  reviewDate?: string;
  reason?: string;
  actionDate?: string;
  amount?: number;
}

interface LowStockAlert {
  itemName: string;
  currentQuantity: number;
  minimumRequiredQuantity: number;
}

interface TopSellingItem {
  itemId: string;
  itemName: string;
  unitsSold: number;
  revenueGenerated: number;
}

interface MechanicDashboardData {
  type: DashboardTab;
  filter: "monthly" | "weekly";
  hasData: boolean;
  emptyMessage: string;
  kpis: DashboardKpis;
  revenueSeries: Array<{ date: string; revenue: number }>;
  ordersThisMonth: DashboardRow[];
  pendingOrders: DashboardRow[];
  returnOrders: DashboardRow[];
  monthlyReviews: DashboardRow[];
  lowStockAlerts: LowStockAlert[];
  topSellingItems: TopSellingItem[];
}

// --- Formatters -----------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat("en-LK", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => `LKR ${currencyFormatter.format(value || 0)}`;

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const formatPercent = (value: number) => `${percentFormatter.format(value || 0)}%`;

const formatFullDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatShortDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const getOrderLabel = (orderId?: string) => (orderId ? `#${orderId.slice(-6).toUpperCase()}` : "-");

// --- Status Badge Classes ---------------------------------------------------

function getStatusClasses(status: string) {
  switch (status.toLowerCase()) {
    case "accepted":
    case "confirmed":
    case "service_order_confirmed":
      return "border-sky-200 bg-sky-50 text-sky-700 font-bold uppercase tracking-wider";
    case "processing":
    case "service_in_progress":
      return "border-violet-200 bg-violet-50 text-violet-700 font-bold uppercase tracking-wider";
    case "shipped":
    case "ready_for_dispatch":
      return "border-cyan-200 bg-cyan-50 text-cyan-700 font-bold uppercase tracking-wider";
    case "delivered":
    case "completed":
    case "service_completed":
    case "payment_received":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider";
    case "cancelled":
    case "service_order_rejected":
      return "border-red-200 bg-red-50 text-red-700 font-bold uppercase tracking-wider";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700 font-bold uppercase tracking-wider";
  }
}

// --- KPI Card Component ------------------------------------------------------

interface KPICardProps {
  title: string;
  value: string | number;
  icon: any;
  description: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
}

function KPICard({ title, value, icon: Icon, description, trend, color }: KPICardProps) {
  return (
    <Card className="glass-card border border-border/40 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
      <div className={`absolute top-0 right-0 p-3 opacity-10 text-${color}-600 group-hover:scale-110 transition-transform`}>
        <Icon size={48} />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-600`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <h3 className="text-2xl font-black tracking-tight">{value}</h3>
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${trend.isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                {trend.isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {Math.abs(trend.value)}%
              </span>
            )}
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Dashboard Table Component ------------------------------------------------

interface DashboardTableProps {
  title: string;
  description: string;
  columns: string[];
  rows: ReactNode[][];
  emptyTitle: string;
  emptyDescription: string;
}

function DashboardTable({
  title,
  description,
  columns,
  rows,
  emptyTitle,
  emptyDescription,
}: DashboardTableProps) {
  return (
    <Card className="glass-card border border-border/40 overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
        <CardTitle className="text-base font-black uppercase tracking-widest text-foreground">{title}</CardTitle>
        <p className="text-xs text-muted-foreground mt-1 font-medium">{description}</p>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-bold text-sm text-foreground uppercase tracking-widest">{emptyTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground font-medium italic">{emptyDescription}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/40 text-left">
                  {columns.map((column) => (
                    <th key={column} className="px-5 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-muted/30 transition-colors align-top group"
                  >
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

const emptyKpis: DashboardKpis = {
  totalRevenue: 0,
  ordersThisMonth: 0,
  ordersThisMonthAmount: 0,
  pendingOrders: 0,
  avgOrderValue: 0,
  completionRate: 0,
  revenueGrowth: 0,
};

const emptyDashboardData = (type: DashboardTab): MechanicDashboardData => ({
  type,
  filter: "monthly",
  hasData: false,
  emptyMessage: type === "product" ? "No product sales recorded yet" : "No service bookings found",
  kpis: emptyKpis,
  revenueSeries: [],
  ordersThisMonth: [],
  pendingOrders: [],
  returnOrders: [],
  monthlyReviews: [],
  lowStockAlerts: [],
  topSellingItems: [],
});

export default function MechanicDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>("product");
  const [range, setRange] = useState<"monthly" | "weekly">("monthly");
  const [dashboardByTab, setDashboardByTab] = useState<Record<DashboardTab, MechanicDashboardData | null>>({
    product: null,
    service: null,
  });
  const [loadingByTab, setLoadingByTab] = useState<Record<DashboardTab, boolean>>({
    product: true,
    service: false,
  });
  const [errorByTab, setErrorByTab] = useState<Record<DashboardTab, string>>({
    product: "",
    service: "",
  });

  const fetchDashboard = useCallback(async (tab: DashboardTab, selectedRange = range, force = false) => {
    // If not forcing and data already exists for this tab and range, skip
    if (!force && dashboardByTab[tab] && dashboardByTab[tab]?.filter === selectedRange) return;

    setLoadingByTab((prev) => ({ ...prev, [tab]: true }));
    setErrorByTab((prev) => ({ ...prev, [tab]: "" }));

    try {
      const { data } = await api.get("/mechanic/dashboard", { 
        params: { type: tab, range: selectedRange } 
      });

      if (data?.success) {
        setDashboardByTab((prev) => ({
          ...prev,
          [tab]: {
            ...emptyDashboardData(tab),
            ...data.data,
            filter: selectedRange,
            revenueSeries: Array.isArray(data.data?.revenueSeries) ? data.data.revenueSeries : [],
            ordersThisMonth: Array.isArray(data.data?.ordersThisMonth) ? data.data.ordersThisMonth : [],
            pendingOrders: Array.isArray(data.data?.pendingOrders) ? data.data.pendingOrders : [],
            returnOrders: Array.isArray(data.data?.returnOrders) ? data.data.returnOrders : [],
            monthlyReviews: Array.isArray(data.data?.monthlyReviews) ? data.data.monthlyReviews : [],
            lowStockAlerts: Array.isArray(data.data?.lowStockAlerts) ? data.data.lowStockAlerts : [],
            topSellingItems: Array.isArray(data.data?.topSellingItems) ? data.data.topSellingItems : [],
            kpis: { ...emptyKpis, ...(data.data?.kpis || {}) },
          },
        }));
      } else {
        setErrorByTab((prev) => ({ ...prev, [tab]: "Unable to connect to service" }));
      }
    } catch {
      setErrorByTab((prev) => ({ ...prev, [tab]: "Connection failed" }));
    } finally {
      setLoadingByTab((prev) => ({ ...prev, [tab]: false }));
    }
  }, [dashboardByTab, range]);

  useEffect(() => {
    fetchDashboard(activeTab, range);
  }, [activeTab, range, fetchDashboard]);

  const handleRangeChange = (newRange: "monthly" | "weekly") => {
    if (newRange === range) return;
    setRange(newRange);
  };

  const dashboard = dashboardByTab[activeTab] || emptyDashboardData(activeTab);
  const loading = loadingByTab[activeTab];
  const error = errorByTab[activeTab];
  
  const topSellingChartData = useMemo(
    () =>
      dashboard.topSellingItems.slice(0, 10).map((item) => ({
        name: item.itemName.length > 18 ? `${item.itemName.slice(0, 18)}...` : item.itemName,
        units: item.unitsSold || 0,
        revenue: Math.round(item.revenueGenerated || 0),
      })),
    [dashboard.topSellingItems]
  );

  const statusChartData = useMemo(() => {
    if (!dashboard.ordersThisMonth.length) return [];
    const counts: Record<string, number> = {};
    dashboard.ordersThisMonth.forEach((order) => {
      const status = order.orderStatus || "Other";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [dashboard.ordersThisMonth]);

  const COLORS = ["#2563eb", "#0f766e", "#8b5cf6", "#f59e0b", "#ef4444", "#0ea5e9"];

  const workshopLabel =
    (user as { workshopName?: string } | null)?.workshopName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "Workshop Dashboard";
    
  const sectionItemLabel = activeTab === "product" ? "Product" : "Service";

  if (loading && !dashboardByTab[activeTab]) {
    return (
      <div className="space-y-6 p-4 animate-pulse">
        <div className="h-12 w-64 bg-muted rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
        </div>
        <div className="h-96 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      {/* Header with filters */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Wrench size={24} />
            </div>
            {workshopLabel}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium italic">
            Performance analytics for your workshop's <span className="text-blue-600 font-bold underline decoration-blue-600/30 underline-offset-4">{activeTab}s</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-background/50 backdrop-blur-md p-2 rounded-2xl border border-border/40 shadow-sm">
          <div className="flex items-center bg-muted/50 rounded-xl p-1 h-11 border border-border/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRangeChange("monthly")}
              className={cn(
                "rounded-lg px-6 font-bold text-[10px] uppercase tracking-widest transition-all duration-300",
                range === "monthly" ? "bg-background shadow-sm text-blue-600" : "opacity-60 hover:opacity-100"
              )}
            >
              Monthly
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRangeChange("weekly")}
              className={cn(
                "rounded-lg px-6 font-bold text-[10px] uppercase tracking-widest transition-all duration-300",
                range === "weekly" ? "bg-background shadow-sm text-blue-600" : "opacity-60 hover:opacity-100"
              )}
            >
              Weekly
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)} className="w-full sm:w-auto">
            <TabsList className="bg-muted/50 rounded-xl p-1 h-11">
              <TabsTrigger
                value="product"
                className="rounded-lg px-6 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-blue-500/20 transition-all duration-300"
              >
                Products
              </TabsTrigger>
              <TabsTrigger
                value="service"
                className="rounded-lg px-6 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-blue-500/20 transition-all duration-300"
              >
                Services
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            onClick={() => void fetchDashboard(activeTab, range, true)}
            disabled={loading}
            variant="outline"
            className="h-11 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-widest border-border/60 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Sync Dashboard
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="rounded-3xl border-red-200 bg-red-50 py-8 text-center flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
            <AlertCircle size={28} />
          </div>
          <CardTitle className="text-lg font-black uppercase tracking-widest mb-1">Data Sync Failed</CardTitle>
          <p className="text-sm font-medium italic mb-6">
            We couldn't retrieve the latest data for your {activeTab}s.
          </p>
          <Button onClick={() => void fetchDashboard(activeTab, range, true)} className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-xl px-8 shadow-xl shadow-red-500/20">
            Retry Connection
          </Button>
        </Card>
      ) : (
        <>
          {/* KPI Overviews */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Revenue"
              value={formatCurrency(dashboard.kpis.totalRevenue)}
              icon={DollarSign}
              description="Earnings this month"
              trend={{ value: dashboard.kpis.revenueGrowth, isPositive: dashboard.kpis.revenueGrowth >= 0 }}
              color="emerald"
            />
            <KPICard
              title={activeTab === "product" ? "Total Orders" : "Total Bookings"}
              value={dashboard.kpis.ordersThisMonth}
              icon={activeTab === "product" ? ShoppingBag : CheckCircle2}
              description={`New ${activeTab}s this month`}
              color="blue"
            />
            <KPICard
              title="Awaiting Work"
              value={dashboard.kpis.pendingOrders}
              icon={Clock}
              description={`Pending fulfillment`}
              color="amber"
            />
            <KPICard
              title="Success Rate"
              value={formatPercent(dashboard.kpis.completionRate)}
              icon={TrendingUp}
              description="Order completion %"
              color="violet"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
            {/* Revenue Trend Chart */}
            <Card className="glass-card border border-border/40 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-7">
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-widest">Revenue Forecast</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1 font-medium italic">Daily {activeTab} revenue for the current billing cycle</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <TrendingUp size={20} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  {dashboard.revenueSeries.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboard.revenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatShortDate}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          minTickGap={30}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickFormatter={(value) => `LKR ${value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}`}
                          width={80}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="rounded-xl border bg-background p-3 shadow-xl border-border/50">
                                  <p className="text-[10px] font-black text-muted-foreground mb-1 uppercase tracking-widest">{formatFullDate(String(label))}</p>
                                  <p className="text-sm font-black text-blue-600">
                                    {formatCurrency(payload[0].value as number)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#2563eb"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/5 rounded-2xl border border-dashed border-border/40">
                      <TrendingUp className="h-12 w-12 opacity-20 mb-3" />
                      <p className="text-sm font-black uppercase tracking-widest">No trend data found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card className="glass-card border border-border/40 overflow-hidden">
              <CardHeader className="bg-muted/20 pb-4">
                <CardTitle className="text-base font-black uppercase tracking-widest text-foreground">Status Mix</CardTitle>
                <p className="text-[10px] text-muted-foreground mt-1 font-bold">Operational breakdown by state</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[280px] w-full">
                  {statusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={8}
                          dataKey="value"
                          animationDuration={1000}
                        >
                          {statusChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-background stroke-2" />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="rounded-xl border bg-background p-3 shadow-xl text-xs border-border/50">
                                  <span className="font-black uppercase tracking-widest text-blue-600">{payload[0].name}:</span>
                                  <span className="ml-2 font-bold">{payload[0].value}</span>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic">
                      <p className="text-[10px] font-bold uppercase tracking-widest">No active orders</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 space-y-3">
                  {statusChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between group cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full shadow-sm group-hover:scale-125 transition-transform" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
            {/* Top Items Chart */}
            <Card className="glass-card border border-border/40 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 bg-muted/20">
                <div>
                  <CardTitle className="text-base font-black uppercase tracking-widest">Volume Performance</CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-1 font-bold italic">Top 10 performing catalog items</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <BarChart3 size={16} className="text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[320px] w-full">
                  {topSellingChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topSellingChartData} layout="vertical" margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          width={100}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-xl border bg-background p-4 shadow-2xl border-border/50">
                                  <p className="text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-widest">{data.name}</p>
                                  <div className="space-y-1">
                                    <p className="text-xs font-bold text-blue-600 flex items-center justify-between gap-4">
                                      <span>Units Sold:</span> <span>{data.units}</span>
                                    </p>
                                    <p className="text-xs font-bold text-emerald-600 flex items-center justify-between gap-4">
                                      <span>Revenue:</span> <span>{formatCurrency(data.revenue)}</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="units"
                          fill="#2563eb"
                          radius={[0, 6, 6, 0]}
                          barSize={24}
                          animationDuration={1000}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic bg-muted/5 rounded-2xl border border-dashed border-border/40">
                      <p className="text-xs font-black uppercase tracking-widest opacity-30">No volume data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inventory / Alerts */}
            {activeTab === "product" ? (
              <Card className="glass-card border border-border/40 overflow-hidden">
                <CardHeader className="bg-red-500/5 pb-4 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <CardTitle className="text-base font-black uppercase tracking-widest text-red-600">Stock Alerts</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold border-red-200 text-red-500 bg-white">Critical</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-[320px] pr-4">
                    <div className="space-y-3 pt-6">
                      {dashboard.lowStockAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-emerald-500/5 rounded-3xl border border-emerald-100 border-dashed">
                          <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3 opacity-40" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Inventory Perfect</p>
                        </div>
                      ) : (
                        dashboard.lowStockAlerts.map((product, index) => (
                          <div
                            key={`${product.itemName}-${index}`}
                            className="flex items-center justify-between p-4 rounded-2xl border border-red-100 bg-red-500/[0.03] transition-all hover:bg-red-500/5 group"
                          >
                            <div className="min-w-0 pr-4">
                              <p className="truncate text-sm font-black text-foreground group-hover:text-red-600 transition-colors">{product.itemName}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter italic">Threshold Alert: {product.minimumRequiredQuantity} Units</p>
                            </div>
                            <div className="text-center bg-white rounded-xl px-3 py-1.5 shadow-sm border border-red-200">
                              <p className="text-base font-black text-red-600 leading-none">{product.currentQuantity}</p>
                              <p className="text-[8px] uppercase tracking-tighter font-black text-red-400 mt-1">Units</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card border border-border/40 overflow-hidden relative">
                <CardHeader className="bg-blue-600 pb-12 text-white border-b border-white/10">
                  <CardTitle className="text-lg font-black uppercase tracking-widest">Service Overview</CardTitle>
                  <p className="text-xs text-blue-100 font-medium italic mt-1">Workshop service efficiency tracking</p>
                </CardHeader>
                <CardContent className="pt-0 -mt-6">
                   <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-500/5 border border-border/40">
                         <div className="flex items-center justify-between mb-6">
                            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                               <CheckCircle2 size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">High Priority</span>
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Success Rate</p>
                         <div className="flex items-baseline gap-3">
                            <h4 className="text-4xl font-black text-foreground tracking-tighter">{formatPercent(dashboard.kpis.completionRate)}</h4>
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                               <TrendingUp size={12} /> +2.4%
                            </span>
                         </div>
                         <div className="mt-6 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${dashboard.kpis.completionRate}%` }} />
                         </div>
                      </div>
                      
                      <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-500/5 border border-border/40">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                               <Clock size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Work</p>
                               <p className="text-xl font-black text-foreground">{dashboard.kpis.pendingOrders} Tasks</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DashboardTable
            title="Recent Activity"
            description={`Latest ${activeTab} transactions and status updates`}
            columns={["Order ID", "Customer", sectionItemLabel, "Amount", "Status", "Date"]}
            rows={dashboard.ordersThisMonth.slice(0, 8).map((order) => [
              <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 select-all cursor-copy">
                {getOrderLabel(order.orderId)}
              </span>,
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-border/40">
                  {order.customerName.charAt(0)}
                </div>
                <span className="font-bold text-sm truncate max-w-[120px] text-foreground">{order.customerName}</span>
              </div>,
              <span className="text-sm font-medium text-foreground truncate max-w-[180px] block">{order.itemName}</span>,
              <span className="font-black text-sm text-foreground">{formatCurrency(order.orderAmount || 0)}</span>,
              <span className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${getStatusClasses(order.orderStatus || "")}`}>
                {order.orderStatus?.replace(/_/g, ' ')}
              </span>,
              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap flex items-center gap-1.5 italic">
                 <Clock size={10} className="text-blue-500" />
                 {formatFullDate(order.orderDate)}
              </span>,
            ])}
            emptyTitle={`No ${activeTab} data`}
            emptyDescription={`Your ${activeTab} activity will be displayed here as it happens.`}
          />

          <div className={`grid grid-cols-1 gap-6 ${activeTab === "product" ? "xl:grid-cols-2" : "xl:grid-cols-1"}`}>
            {activeTab === "product" && (
              <DashboardTable
                title="Return Requests"
                description="Monitor product return and refund activity"
                columns={["ID", "Product", "Customer", "Refund", "Status"]}
                rows={dashboard.returnOrders.slice(0, 5).map((order) => [
                  <span className="font-mono text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">{getOrderLabel(order.orderId)}</span>,
                  <span className="text-xs font-black text-foreground truncate max-w-[150px] block">{order.itemName}</span>,
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{order.customerName}</span>,
                  <span className="font-black text-sm text-red-600 italic">{formatCurrency(order.amount || 0)}</span>,
                  <div className="flex items-center gap-1.5 text-red-500">
                     <RotateCcw size={12} className="animate-spin-slow" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Pending</span>
                  </div>
                ])}
                emptyTitle="Returns Clear"
                emptyDescription="No return requests currently active"
              />
            )}

            <DashboardTable
              title="Workshop Reviews"
              description={`Latest feedback on your ${activeTab} quality`}
              columns={["Customer", sectionItemLabel, "Rating", "Review", "Date"]}
              rows={dashboard.monthlyReviews.slice(0, 5).map((review) => [
                <div className="flex items-center gap-2">
                   <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[8px] font-black uppercase">
                      {review.customerName.charAt(0)}
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{review.customerName}</span>
                </div>,
                <span className="text-xs font-bold text-blue-600 truncate max-w-[150px] block group-hover:underline underline-offset-4 decoration-blue-600/30 transition-all">{review.itemName}</span>,
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={`h-2.5 w-2.5 ${index < (review.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                  <span className="ml-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100">{review.rating || 0}</span>
                </div>,
                <span className="max-w-[200px] truncate text-[10px] text-muted-foreground font-medium italic">"{review.review || "Excellent service provided"}"</span>,
                <span className="text-[10px] font-bold text-muted-foreground">{formatShortDate(review.reviewDate)}</span>,
              ])}
              emptyTitle="No Reviews"
              emptyDescription="Constructive feedback helps your workshop grow"
            />
          </div>

          <Card className="glass-card border border-border/40 bg-gradient-to-br from-blue-600/5 via-blue-600/[0.02] to-transparent overflow-hidden">
            <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between relative">
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-[2.5] -rotate-12">
                  <Wrench size={100} className="text-blue-600" />
               </div>
               
              <div className="flex items-center gap-6 relative z-10">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/30 ring-4 ring-blue-500/10">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground tracking-tight">Growth Overview</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[400px] font-medium leading-relaxed italic">
                    Your workshop analytics are synced with the <span className="text-blue-600 font-black uppercase tracking-widest text-xs not-italic">Finding Moto Central Network</span>.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 relative z-10">
                <div className="rounded-2xl border border-border/40 bg-white/60 backdrop-blur-md px-6 py-5 min-w-[140px] shadow-sm hover:shadow-md transition-all">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-1.5">Efficiency</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-black ${dashboard.kpis.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {dashboard.kpis.revenueGrowth >= 0 ? '+' : ''}{formatPercent(dashboard.kpis.revenueGrowth)}
                    </span>
                    <TrendingUp className={cn("h-4 w-4", dashboard.kpis.revenueGrowth >= 0 ? 'text-emerald-500' : 'text-red-500 rotate-180')} />
                  </div>
                </div>
                <div className="rounded-2xl border border-border/40 bg-white/60 backdrop-blur-md px-6 py-5 min-w-[140px] shadow-sm hover:shadow-md transition-all">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-1.5">Avg. Ticket</p>
                  <p className="text-xl font-black text-blue-600">{formatCurrency(dashboard.kpis.avgOrderValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
