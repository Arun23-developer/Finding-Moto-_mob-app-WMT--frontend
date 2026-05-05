import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Loader2,
  AlertCircle,
  RefreshCw,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import api from "@/services/api";

interface AnalyticsData {
  stats: {
    revenue: number;
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    deliveredOrders: number;
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number;
    activeSellers: number;
  };
  monthlyRevenue: { _id: string; revenue: number }[];
  categories: { name: string; value: number }[];
}

const COLORS = [
  "#FF6B35", // Orange
  "#4ECDC4", // Teal
  "#95E1D3", // Mint
  "#F38181", // Pink
  "#AA96DA", // Purple
  "#FCBAD3", // Light Pink
  "#FFFFD2", // Light Yellow
];

const CHART_COLORS = {
  primary: "hsl(25, 95%, 53%)",
  secondary: "hsl(217, 91%, 60%)",
  success: "hsl(142, 71%, 45%)",
  warning: "hsl(38, 92%, 50%)",
  danger: "hsl(0, 84%, 60%)",
  info: "hsl(199, 89%, 48%)",
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("7months");

  const fetchAnalytics = useCallback(async () => {
    try {
      setError("");
      const { data: res } = await api.get("/admin/overview");
      if (res.success) setData(res.data);
    } catch {
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
        <p className="text-sm font-medium">Loading analytics…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-3 text-red-500" />
        <p className="font-medium">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  const { stats, monthlyRevenue, categories } = data;

  // Calculate growth metrics
  const revenueGrowth = monthlyRevenue.length >= 2
    ? ((monthlyRevenue[monthlyRevenue.length - 1].revenue - monthlyRevenue[monthlyRevenue.length - 2].revenue) /
        monthlyRevenue[monthlyRevenue.length - 2].revenue) * 100
    : 0;

  // Prepare data for charts
  const revenueChartData = monthlyRevenue.map((item) => ({
    month: new Date(item._id + "-01").toLocaleString("default", { month: "short" }),
    revenue: item.revenue,
    orders: Math.floor(item.revenue / 5000), // Estimated orders
  }));

  const orderStatusData = [
    { name: "Delivered", value: stats.deliveredOrders, color: CHART_COLORS.success },
    { name: "Processing", value: stats.processingOrders, color: CHART_COLORS.info },
    { name: "Pending", value: stats.pendingOrders, color: CHART_COLORS.warning },
  ];

  const productStatusData = [
    { name: "Active", value: stats.activeProducts, color: CHART_COLORS.success },
    { name: "Out of Stock", value: stats.outOfStockProducts, color: CHART_COLORS.danger },
  ];

  const categoryChartData = categories.map((cat, idx) => ({
    name: cat.name,
    value: cat.value,
    fill: COLORS[idx % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2"
          >
            <option value="7months">Last 7 Months</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border border-border/40 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-600 group-hover:scale-110 transition-transform">
            <DollarSign size={48} />
          </div>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-black mt-1 text-emerald-600">
                  LKR {(stats.revenue / 1000).toFixed(1)}k
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${revenueGrowth >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                    {revenueGrowth >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {Math.abs(revenueGrowth).toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-border/40 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-blue-600 group-hover:scale-110 transition-transform">
            <ShoppingCart size={48} />
          </div>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-black mt-1 text-blue-600">{stats.totalOrders.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[10px] font-bold">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {stats.deliveredOrders} Completed
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-border/40 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-purple-600 group-hover:scale-110 transition-transform">
            <Package size={48} />
          </div>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Products</p>
                <p className="text-2xl font-black mt-1 text-purple-600">{stats.totalProducts.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 text-[10px] font-bold">
                    <Package className="h-2.5 w-2.5" />
                    {stats.activeProducts} Active
                  </div>
                </div>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-border/40 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-orange-600 group-hover:scale-110 transition-transform">
            <Users size={48} />
          </div>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Sellers</p>
                <p className="text-2xl font-black mt-1 text-orange-600">{stats.activeSellers.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 text-[10px] font-bold">
                    <Users className="h-2.5 w-2.5" />
                    Verified Vendors
                  </div>
                </div>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-xl text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="glass-card border border-border/40 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-7">
          <div>
            <CardTitle className="text-lg font-bold">Revenue & Orders Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Monthly revenue performance and growth insights</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `LKR ${value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md border-border/50">
                          <p className="text-xs font-bold text-muted-foreground mb-1">{label}</p>
                          <p className="text-sm font-black text-primary">
                            LKR {Number(payload[0].value).toLocaleString()}
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
                  stroke={CHART_COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={3}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Order Status Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Product Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {productStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Revenue Bar Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Monthly Revenue Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Conversion Rate</h3>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-3xl font-bold">
              {stats.totalOrders > 0
                ? ((stats.deliveredOrders / stats.totalOrders) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-muted-foreground mt-2">Orders successfully delivered</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Avg Order Value</h3>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-3xl font-bold">
              LKR {stats.totalOrders > 0 ? (stats.revenue / stats.totalOrders).toFixed(0) : 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Per order average</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Stock Health</h3>
              <Package className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-3xl font-bold">
              {stats.totalProducts > 0
                ? ((stats.activeProducts / stats.totalProducts) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-muted-foreground mt-2">Products in stock</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
