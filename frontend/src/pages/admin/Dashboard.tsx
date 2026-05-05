import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "@/services/api";

const statusColors: Record<string, string> = {
  delivered: "bg-success/15 text-success border-success/20",
  shipped: "bg-info/15 text-info border-info/20",
  confirmed: "bg-warning/15 text-warning border-warning/20",
  pending: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/15 text-destructive border-destructive/20",
};

const catColors = [
  "hsl(25, 95%, 53%)",
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(280, 65%, 60%)",
  "hsl(38, 92%, 50%)",
];

const CHART_COLORS = {
  primary: "hsl(25, 95%, 53%)",
  secondary: "hsl(217, 91%, 60%)",
  success: "hsl(142, 71%, 45%)",
  warning: "hsl(38, 92%, 50%)",
};

interface OverviewData {
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
  recentOrders: {
    _id: string;
    buyer: { firstName: string; lastName: string } | null;
    seller: { firstName: string; lastName: string; shopName?: string } | null;
    totalAmount: number;
    status: string;
    itemCount: number;
    createdAt: string;
  }[];
  categories: { name: string; value: number }[];
  monthlyRevenue: { _id: string; revenue: number }[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOverview = useCallback(async () => {
    try {
      setError("");
      const { data: res } = await api.get("/admin/overview");
      if (res.success) setData(res.data);
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
        <p className="text-sm font-medium">Loading dashboard…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-3 text-red-500" />
        <p className="font-medium">{error}</p>
        <button onClick={fetchOverview} className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  const { stats, recentOrders, categories, monthlyRevenue } = data;

  // Prepare chart data
  const revenueChartData = monthlyRevenue.map((item) => ({
    month: new Date(item._id + "-01").toLocaleString("default", { month: "short" }),
    revenue: item.revenue,
  }));

  const categoryPieData = categories.map((cat, idx) => ({
    name: cat.name,
    value: cat.value,
    fill: catColors[idx % catColors.length],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview and key metrics</p>
      </div>

      {/* Key Metrics - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  LKR {(stats.revenue / 1000).toFixed(1)}k
                </p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  From completed orders
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Orders</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  {stats.totalOrders.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-2">{stats.deliveredOrders} delivered</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Products</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  {stats.totalProducts.toLocaleString()}
                </p>
                <p className="text-xs text-purple-600 mt-2">{stats.activeProducts} active</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Package className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Sellers</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                  {stats.activeSellers.toLocaleString()}
                </p>
                <p className="text-xs text-orange-600 mt-2">Approved vendors</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Pending Orders</p>
                <p className="text-4xl font-bold mt-2 text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <Activity className="h-10 w-10 text-yellow-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Processing Orders</p>
                <p className="text-4xl font-bold mt-2 text-blue-600">{stats.processingOrders}</p>
              </div>
              <Activity className="h-10 w-10 text-blue-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Out of Stock Items</p>
                <p className="text-4xl font-bold mt-2 text-red-600">{stats.outOfStockProducts}</p>
              </div>
              <Package className="h-10 w-10 text-red-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No revenue data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
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
                  <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Top Categories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
            <a href="/admin/orders" className="text-xs text-primary flex items-center gap-1 hover:underline">
              View All <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-border">
                  <th className="text-left py-3 font-medium">Order ID</th>
                  <th className="text-left py-3 font-medium">Buyer</th>
                  <th className="text-left py-3 font-medium">Amount</th>
                  <th className="text-left py-3 font-medium">Status</th>
                  <th className="text-right py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No orders yet</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order._id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-mono font-medium text-primary text-xs">
                        {order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3">
                        {order.buyer ? `${order.buyer.firstName} ${order.buyer.lastName}` : "—"}
                      </td>
                      <td className="py-3 font-semibold">LKR {order.totalAmount.toLocaleString()}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusColors[order.status] || ""}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-muted-foreground">{timeAgo(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
