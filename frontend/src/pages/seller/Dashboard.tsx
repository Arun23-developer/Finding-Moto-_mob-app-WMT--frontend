import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  RefreshCw,
  Star,
  Eye,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
  RotateCcw,
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
import { createAuthedSocket, type OrderWorkflowSocketEvent } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SellerDashboardData {
  filter: "monthly";
  kpis: {
    totalRevenue: number;
    ordersThisMonth: number;
    ordersThisMonthAmount: number;
    pendingOrders: number;
    avgOrderValue: number;
    completionRate: number;
    revenueGrowth: number;
  };
  revenueSeries: Array<{
    date: string;
    revenue: number;
  }>;
  ordersThisMonth: Array<{
    orderId: string;
    customerName: string;
    productName: string;
    orderAmount: number;
    orderDate: string;
    orderStatus: string;
  }>;
  pendingOrders: Array<{
    orderId: string;
    customerName: string;
    productName: string;
    orderAmount: number;
    orderDate: string;
    orderStatus: string;
  }>;
  returnOrders: Array<{
    orderId: string;
    productName: string;
    customerName: string;
    returnReason: string;
    returnDate: string;
    refundAmount: number;
  }>;
  monthlyReviews: Array<{
    customerName: string;
    productName: string;
    rating: number;
    review: string;
    reviewDate: string;
  }>;
  lowStockAlerts: Array<{
    productName: string;
    currentQuantity: number;
    minimumRequiredQuantity: number;
  }>;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    unitsSold: number;
    revenueGenerated: number;
  }>;
}

// ─── Formatters ───────────────────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat("en-LK", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});

const formatCurrency = (value: number) => `LKR ${currencyFormatter.format(value || 0)}`;
const formatPercent = (value: number) => `${percentFormatter.format(value || 0)}%`;
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
};
const formatShortDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : shortDateFormatter.format(date);
};
const getOrderLabel = (orderId: string) => `#${orderId.slice(-6).toUpperCase()}`;

// ─── Status Badge Classes ───────────────────────────────────────────────────

function getStatusClasses(status: string) {
  switch (status.toLowerCase()) {
    case "accepted":
      return "border-sky-200 bg-sky-50 text-sky-700 font-medium";
    case "confirmed":
      return "border-blue-200 bg-blue-50 text-blue-700 font-medium";
    case "processing":
      return "border-violet-200 bg-violet-50 text-violet-700 font-medium";
    case "shipped":
      return "border-cyan-200 bg-cyan-50 text-cyan-700 font-medium";
    case "delivered":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700 font-medium";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700 font-medium";
  }
}

// ─── KPI Card Component ──────────────────────────────────────────────────────

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
    <Card className="glass-card border border-border/40 overflow-hidden relative">
      <div className={`absolute top-0 right-0 p-3 opacity-10 text-${color}-600`}>
        <Icon size={48} />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-600`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span className={`inline-flex items-center text-xs font-medium ${trend.isPositive ? "text-emerald-600" : "text-red-600"}`}>
                {trend.isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {Math.abs(trend.value)}%
              </span>
            )}
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard Table Component ────────────────────────────────────────────────

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
    <Card className="glass-card border border-border/40">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm text-foreground">{emptyTitle}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">{emptyDescription}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30 text-left">
                  {columns.map((column) => (
                    <th key={column} className="px-4 py-3.5 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-border/20 hover:bg-muted/25 transition-colors align-top last:border-0"
                  >
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
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

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export default function SellerDashboard() {
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<SellerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState<"monthly" | "weekly">("monthly");

  const fetchDashboard = useCallback(async (isRefreshing = false, selectedRange = range) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const { data } = await api.get("/seller/dashboard", {
        params: { range: selectedRange },
      });

      if (data?.success) {
        setDashboard(data.data);
      } else {
        setError("Failed to load seller dashboard.");
      }
    } catch {
      setError("Failed to load seller dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    fetchDashboard(false, range);
  }, [range]);

  const handleRangeChange = (newRange: "monthly" | "weekly") => {
    if (newRange === range) return;
    setRange(newRange);
  };

  useEffect(() => {
    const socket = createAuthedSocket();
    if (!socket) return;

    const handleWorkflowEvent = (event: OrderWorkflowSocketEvent) => {
      if (event.audience !== "seller") return;
      fetchDashboard(true);
      toast({
        title: event.title,
        description: event.message,
      });
    };

    socket.on("order:workflow", handleWorkflowEvent);

    return () => {
      socket.off("order:workflow", handleWorkflowEvent);
      socket.disconnect();
    };
  }, [fetchDashboard, toast]);

  const topSellingChartData = useMemo(
    () =>
      (dashboard?.topSellingProducts || []).slice(0, 10).map((product) => ({
        name: product.productName.length > 18 ? `${product.productName.slice(0, 18)}...` : product.productName,
        units: product.unitsSold,
        revenue: Math.round(product.revenueGenerated),
      })),
    [dashboard]
  );

  const statusChartData = useMemo(() => {
    if (!dashboard) return [];
    const counts: Record<string, number> = {};
    dashboard.ordersThisMonth.forEach((order) => {
      const status = order.orderStatus || "Other";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [dashboard]);

  const COLORS = ["#2563eb", "#0f766e", "#8b5cf6", "#f59e0b", "#ef4444", "#0ea5e9"];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="h-12 w-48 bg-muted rounded animate-pulse"></div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.8fr_1fr]">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="h-80 w-full bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-red-500/10 p-3 mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <p className="font-semibold text-foreground text-lg">{error || "Failed to load dashboard"}</p>
        <p className="text-muted-foreground text-sm mt-1">Please check your connection and try again.</p>
        <Button
          onClick={() => fetchDashboard(true)}
          className="mt-6 bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      {/* Header with filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Seller Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor your performance, orders, and products in real-time</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRangeChange("monthly")}
              className={cn(
                "text-xs h-8 px-3 transition-all",
                range === "monthly" ? "bg-background shadow-sm font-bold text-blue-600" : "opacity-60 hover:opacity-100"
              )}
            >
              Monthly
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRangeChange("weekly")}
              className={cn(
                "text-xs h-8 px-3 transition-all",
                range === "weekly" ? "bg-background shadow-sm font-bold text-blue-600" : "opacity-60 hover:opacity-100"
              )}
            >
              Weekly
            </Button>
          </div>

          <Button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            variant="outline"
            className="gap-2 h-9 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>
        </div>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(dashboard.kpis.totalRevenue)}
          icon={DollarSign}
          description="Total earnings this month"
          trend={{ value: dashboard.kpis.revenueGrowth, isPositive: dashboard.kpis.revenueGrowth >= 0 }}
          color="emerald"
        />
        <KPICard
          title="New Orders"
          value={dashboard.kpis.ordersThisMonth}
          icon={ShoppingBag}
          description="Orders placed this month"
          color="blue"
        />
        <KPICard
          title="Pending Fulfillment"
          value={dashboard.kpis.pendingOrders}
          icon={Clock}
          description="Awaiting shipment"
          color="amber"
        />
        <KPICard
          title="Completion Rate"
          value={formatPercent(dashboard.kpis.completionRate)}
          icon={CheckCircle2}
          description="Success rate of orders"
          color="violet"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        {/* Revenue Trend Chart */}
        <Card className="glass-card border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
            <div>
              <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Daily revenue performance over the current month</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
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
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
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
                            <div className="rounded-lg border bg-background p-3 shadow-md border-border/50">
                              <p className="text-xs font-medium text-muted-foreground mb-1">{formatDate(String(label))}</p>
                              <p className="text-sm font-bold text-foreground">
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
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-border/40">
                  <TrendingUp className="h-10 w-10 opacity-20 mb-2" />
                  <p className="text-sm font-medium">No revenue data for this period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="glass-card border border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Order Status</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Distribution of orders by current state</p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1000}
                    >
                      {statusChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                              <span className="font-semibold">{payload[0].name}:</span> {payload[0].value}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p className="text-xs">No order data available</p>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {statusChartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Top Selling Products Bar Chart */}
        <Card className="glass-card border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Sales Performance by Product</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {topSellingChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSellingChartData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
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
                            <div className="rounded-lg border bg-background p-3 shadow-md border-border/50">
                              <p className="text-xs font-bold text-foreground mb-1">{data.name}</p>
                              <p className="text-[10px] font-bold text-blue-600">Units: {data.units}</p>
                              <p className="text-[10px] font-bold text-emerald-600">Revenue: {formatCurrency(data.revenue)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="units"
                      fill="#2563eb"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm font-medium">No sales data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="glass-card border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-red-600">Inventory Alerts</CardTitle>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Threshold: 5 units</span>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 h-[300px] overflow-y-auto no-scrollbar pr-2">
              {dashboard.lowStockAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 mb-2" />
                  <p className="text-sm font-medium text-emerald-700">All products well stocked</p>
                </div>
              ) : (
                dashboard.lowStockAlerts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-red-500/10 bg-red-500/5 transition-all hover:bg-red-500/10">
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-medium truncate">{product.productName}</p>
                      <p className="text-[10px] text-muted-foreground">Needs restocking soon</p>
                    </div>
                    <div className="text-center bg-white rounded-lg px-2.5 py-1 shadow-sm border border-red-200">
                      <p className="text-xs font-bold text-red-600 leading-none">{product.currentQuantity}</p>
                      <p className="text-[8px] uppercase tracking-tighter font-bold text-red-400 mt-0.5">Left</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <DashboardTable
        title="Recent Orders"
        description="Detailed view of your latest sales transactions"
        columns={["Order ID", "Customer", "Product", "Amount", "Date", "Status"]}
        rows={dashboard.ordersThisMonth.slice(0, 8).map((order) => [
          <span className="font-mono text-xs font-bold bg-muted px-2 py-1 rounded select-all cursor-copy hover:bg-muted/80 transition-colors" title={order.orderId}>
            {getOrderLabel(order.orderId)}
          </span>,
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-600">
              {order.customerName.charAt(0)}
            </div>
            <span className="font-medium text-sm truncate max-w-[120px]">{order.customerName}</span>
          </div>,
          <span className="text-sm text-muted-foreground truncate max-w-[180px] block">{order.productName}</span>,
          <span className="font-bold text-sm">{formatCurrency(order.orderAmount)}</span>,
          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(order.orderDate)}</span>,
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusClasses(order.orderStatus)}`}>
            {order.orderStatus}
          </span>,
        ])}
        emptyTitle="No recent orders"
        emptyDescription="Transactions for this month will appear here"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
         {/* Customer Reviews */}
         <Card className="glass-card border border-border/40 overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Latest Reviews</CardTitle>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-lg">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span className="text-xs font-bold text-amber-700">Feedback</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/20">
              {dashboard.monthlyReviews.slice(0, 4).map((review, idx) => (
                <div key={idx} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold uppercase">
                        {review.customerName.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold">{review.customerName}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-2.5 w-2.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">"{review.review}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-blue-600 truncate max-w-[150px]">{review.productName}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(review.reviewDate)}</span>
                  </div>
                </div>
              ))}
              {dashboard.monthlyReviews.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No reviews received this month
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Returns and Claims */}
        <Card className="glass-card border border-border/40 overflow-hidden">
          <CardHeader className="bg-red-500/5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-red-700">Returns & Claims</CardTitle>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-lg text-red-700">
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">Issues</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/20">
              {dashboard.returnOrders.slice(0, 4).map((order, idx) => (
                <div key={idx} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      {getOrderLabel(order.orderId)}
                    </span>
                    <span className="text-[10px] font-bold text-red-600">{formatCurrency(order.refundAmount)}</span>
                  </div>
                  <p className="text-xs font-medium truncate mb-1">{order.productName}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2 italic">Reason: {order.returnReason}</p>
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
                    <span>{order.customerName}</span>
                    <span>{formatDate(order.returnDate)}</span>
                  </div>
                </div>
              ))}
              {dashboard.returnOrders.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No return requests this month
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Banner */}
      <Card className="glass-card border border-border/40 bg-gradient-to-br from-blue-600/5 via-blue-600/[0.02] to-transparent">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">
              <Eye className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">Performance Overview</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[400px]">
                Live performance metrics are based on your real seller activity.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-2xl border border-border/30 bg-background/50 backdrop-blur-sm px-5 py-4 min-w-[120px]">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Growth</p>
              <div className="flex items-center gap-1.5">
                <span className={`text-lg font-black ${dashboard.kpis.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {dashboard.kpis.revenueGrowth >= 0 ? '+' : ''}{formatPercent(dashboard.kpis.revenueGrowth)}
                </span>
                {dashboard.kpis.revenueGrowth >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
              </div>
            </div>
            <div className="rounded-2xl border border-border/30 bg-background/50 backdrop-blur-sm px-5 py-4 min-w-[120px]">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Avg. Value</p>
              <p className="text-lg font-black text-blue-600">{formatCurrency(dashboard.kpis.avgOrderValue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
