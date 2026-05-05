import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Truck,
  UserRound,
  Wrench,
  X,
  XCircle,
  CheckCircle2,
  MoreHorizontal,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { createAuthedSocket, type OrderWorkflowSocketEvent } from "@/lib/socket";

interface OrderItem {
  product: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

interface Order {
  _id: string;
  buyer: { _id: string; name?: string; firstName?: string; lastName?: string; email: string; phone?: string } | string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  order_type?: "product" | "service" | string;
  shippingAddress: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

type ServiceOrderStatus =
  | "SERVICE_ORDER_PLACED"
  | "SERVICE_ORDER_CONFIRMED"
  | "BUYER_ARRIVED"
  | "SERVICE_IN_PROGRESS"
  | "SERVICE_COMPLETED"
  | "PAYMENT_RECEIVED"
  | "SERVICE_ORDER_REJECTED";

interface ServiceOrder {
  _id: string;
  buyer: { _id?: string; firstName?: string; lastName?: string; email?: string; phone?: string };
  serviceName: string;
  servicePrice: number;
  bookingDate: string;
  notes?: string;
  status: ServiceOrderStatus;
  statusHistory?: Array<{ status: ServiceOrderStatus; changedAt: string; note?: string }>;
  createdAt: string;
}

const productStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  confirmed: { label: "Accepted", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle },
  shipped: { label: "In Progress", color: "bg-violet-100 text-violet-700 border-violet-200", icon: Truck },
  delivered: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

const serviceStatusConfig: Record<ServiceOrderStatus, { label: string; color: string; icon: any }> = {
  SERVICE_ORDER_PLACED: { label: "Placed", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  SERVICE_ORDER_CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle },
  BUYER_ARRIVED: { label: "Arrived", color: "bg-sky-100 text-sky-700 border-sky-200", icon: MapPin },
  SERVICE_IN_PROGRESS: { label: "In Progress", color: "bg-violet-100 text-violet-700 border-violet-200", icon: Truck },
  SERVICE_COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  PAYMENT_RECEIVED: { label: "Payment Done", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
  SERVICE_ORDER_REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

const nextProductStatus: Record<string, { status: string; label: string }> = {
  pending: { status: "confirmed", label: "Accept Job" },
  confirmed: { status: "shipped", label: "Start Work" },
  shipped: { status: "delivered", label: "Mark Completed" },
};

function getStatusMeta(status?: string) {
  const meta = status ? productStatusConfig[status] : undefined;
  return (
    meta || {
      label: status ? status.split("_").join(" ") : "Unknown",
      color: "bg-muted text-muted-foreground border-border",
      icon: Clock,
    }
  );
}

function getBuyerName(buyer: Order["buyer"] | ServiceOrder["buyer"]): string {
  if (typeof buyer === "string") return buyer;
  return (buyer as any)?.name || `${(buyer as any)?.firstName || ""} ${(buyer as any)?.lastName || ""}`.trim() || (buyer as any)?.email || "Customer";
}

function getBuyerEmail(buyer: Order["buyer"] | ServiceOrder["buyer"]): string {
  if (typeof buyer === "string") return "";
  return (buyer as any)?.email || "";
}

function getBuyerPhone(buyer: Order["buyer"] | ServiceOrder["buyer"]): string {
  if (typeof buyer === "string") return "";
  return (buyer as any)?.phone || "";
}

function getOrderType(order: Order): "product" | "service" | "unknown" {
  const raw = (order.order_type || "").toString().toLowerCase();
  if (raw === "product" || raw === "service") return raw;
  return "unknown";
}

function getPrimaryItemName(items: OrderItem[]): string {
  if (!items?.length) return "--";
  if (items.length === 1) return items[0]?.name || "--";
  const names = items.map((item) => item.name).filter(Boolean);
  return names.length ? `${names[0]} +${Math.max(0, names.length - 1)}` : "--";
}

export default function MechanicOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"product" | "service">("product");
  const [productStatusFilter, setProductStatusFilter] = useState<string>("all");
  const [serviceStatusFilter, setServiceStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setProductLoading(true);
    setProductError(null);
    try {
      const res = await api.get("/orders");
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      setOrders(data.filter((order: Order) => getOrderType(order) === "product"));
    } catch (err: any) {
      setProductError(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setProductLoading(false);
    }
  }, []);

  const fetchServiceOrders = useCallback(async () => {
    setServiceLoading(true);
    setServiceError(null);
    try {
      const res = await api.get("/service-orders/mechanic");
      setServiceOrders(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err: any) {
      setServiceError(err?.response?.data?.message || "Failed to load service orders");
    } finally {
      setServiceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchServiceOrders();
  }, [fetchOrders, fetchServiceOrders]);

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdating(true);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      await fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const handleServiceOrderStatusChange = async (orderId: string, action: string) => {
    setUpdating(true);
    try {
      await api.put(`/service-orders/${orderId}/status`, { action });
      await fetchServiceOrders();
      setSelectedServiceOrder(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update service order status");
    } finally {
      setUpdating(false);
    }
  };

  const filteredProductOrders = orders
    .filter((order) => productStatusFilter === "all" || order.status === productStatusFilter)
    .filter((order) => {
      const query = search.toLowerCase();
      return (
        getBuyerName(order.buyer).toLowerCase().includes(query) ||
        order._id.toLowerCase().includes(query) ||
        getPrimaryItemName(order.items).toLowerCase().includes(query)
      );
    });

  const filteredServiceOrders = serviceOrders
    .filter((order) => serviceStatusFilter === "all" || order.status === serviceStatusFilter)
    .filter((order) => {
      const query = search.toLowerCase();
      return (
        getBuyerName(order.buyer).toLowerCase().includes(query) ||
        order._id.toLowerCase().includes(query) ||
        (order.serviceName || "").toLowerCase().includes(query)
      );
    });

  const productStatusCounts = {
    all: orders.length,
    pending: orders.filter((order) => order.status === "pending").length,
    confirmed: orders.filter((order) => order.status === "confirmed").length,
    shipped: orders.filter((order) => order.status === "shipped").length,
    delivered: orders.filter((order) => order.status === "delivered").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
  };

  const serviceStatusCounts = {
    all: serviceOrders.length,
    SERVICE_ORDER_PLACED: serviceOrders.filter((order) => order.status === "SERVICE_ORDER_PLACED").length,
    SERVICE_ORDER_CONFIRMED: serviceOrders.filter((order) => order.status === "SERVICE_ORDER_CONFIRMED").length,
    BUYER_ARRIVED: serviceOrders.filter((order) => order.status === "BUYER_ARRIVED").length,
    SERVICE_IN_PROGRESS: serviceOrders.filter((order) => order.status === "SERVICE_IN_PROGRESS").length,
    SERVICE_COMPLETED: serviceOrders.filter((order) => order.status === "SERVICE_COMPLETED").length,
    PAYMENT_RECEIVED: serviceOrders.filter((order) => order.status === "PAYMENT_RECEIVED").length,
    SERVICE_ORDER_REJECTED: serviceOrders.filter((order) => order.status === "SERVICE_ORDER_REJECTED").length,
  };

  const isRefreshing = activeTab === "product" ? productLoading : serviceLoading;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <Wrench size={32} className="text-blue-600" />
             Work Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium italic">
            Manage your service bookings and product sales transactions.
          </p>
        </div>
        <Button
          onClick={() => {
            fetchOrders();
            fetchServiceOrders();
          }}
          variant="outline"
          className="h-11 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-widest border-border/60"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="glass-card border-border/40 overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-3 opacity-5 text-blue-600 group-hover:scale-110 transition-transform">
              <ShoppingBag size={48} />
           </div>
           <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total</p>
              <p className="text-3xl font-black text-foreground">
                 {activeTab === "product" ? productStatusCounts.all : serviceStatusCounts.all}
              </p>
           </CardContent>
        </Card>
        <Card className="glass-card border-border/40 overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-3 opacity-5 text-amber-600 group-hover:scale-110 transition-transform">
              <Clock size={48} />
           </div>
           <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Awaiting</p>
              <p className="text-3xl font-black text-amber-600">
                 {activeTab === "product" ? productStatusCounts.pending : serviceStatusCounts.SERVICE_ORDER_PLACED}
              </p>
           </CardContent>
        </Card>
        <Card className="glass-card border-border/40 overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-3 opacity-5 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={48} />
           </div>
           <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Completed</p>
              <p className="text-3xl font-black text-emerald-600">
                 {activeTab === "product" ? productStatusCounts.delivered : serviceStatusCounts.SERVICE_COMPLETED}
              </p>
           </CardContent>
        </Card>
        <Card className="glass-card border-border/40 overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-3 opacity-5 text-red-600 group-hover:scale-110 transition-transform">
              <XCircle size={48} />
           </div>
           <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Cancelled</p>
              <p className="text-3xl font-black text-red-600">
                 {activeTab === "product" ? productStatusCounts.cancelled : serviceStatusCounts.SERVICE_ORDER_REJECTED}
              </p>
           </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="bg-muted/50 rounded-xl p-1 h-11 border border-border/40">
          <TabsTrigger value="product" className="rounded-lg px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white">Product Orders</TabsTrigger>
          <TabsTrigger value="service" className="rounded-lg px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white">Service Bookings</TabsTrigger>
        </TabsList>

        <Card className="glass-card border border-border/40 overflow-hidden shadow-sm">
           <div className="bg-muted/20 p-4 border-b border-border/40">
              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                 <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                    <input
                       type="text"
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                       placeholder="Search ID, customer name or items..."
                       className="w-full h-10 pl-10 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                 </div>
                 <div className="flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {activeTab === "product" ? (
                       ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map(f => (
                          <button
                             key={f}
                             onClick={() => setProductStatusFilter(f)}
                             className={cn(
                                "whitespace-nowrap rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all border",
                                productStatusFilter === f ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-background border-border/60 text-muted-foreground hover:border-blue-500/40"
                             )}
                          >
                             {f}
                          </button>
                       ))
                    ) : (
                       ["all", "SERVICE_ORDER_PLACED", "SERVICE_ORDER_CONFIRMED", "BUYER_ARRIVED", "SERVICE_IN_PROGRESS", "SERVICE_COMPLETED", "PAYMENT_RECEIVED", "SERVICE_ORDER_REJECTED"].map(f => (
                          <button
                             key={f}
                             onClick={() => setServiceStatusFilter(f)}
                             className={cn(
                                "whitespace-nowrap rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all border",
                                serviceStatusFilter === f ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-background border-border/60 text-muted-foreground hover:border-blue-500/40"
                             )}
                          >
                             {f.replace("SERVICE_ORDER_", "").replace("_", " ")}
                          </button>
                       ))
                    )}
                 </div>
              </div>
           </div>

           <CardContent className="p-0">
              <ScrollArea className="w-full h-[600px]">
                 <table className="w-full text-sm">
                    <thead>
                       <tr className="bg-muted/10 border-b border-border/20 text-left">
                          <th className="px-5 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Identification</th>
                          <th className="px-5 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Customer Profile</th>
                          <th className="px-5 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Details</th>
                          <th className="px-5 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Transaction</th>
                          <th className="px-5 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em] text-center">Current Status</th>
                          <th className="px-5 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em] text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                       {activeTab === "product" ? (
                          filteredProductOrders.map(order => {
                             const statusMeta = getStatusMeta(order.status);
                             const next = nextProductStatus[order.status];
                             return (
                                <tr key={order._id} className="group hover:bg-muted/30 transition-all">
                                   <td className="px-5 py-4">
                                      <div className="flex flex-col">
                                         <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">#{order._id.slice(-6).toUpperCase()}</span>
                                         <span className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                                            <Clock size={10} className="text-blue-500" />
                                            {new Date(order.createdAt).toLocaleDateString()}
                                         </span>
                                      </div>
                                   </td>
                                   <td className="px-5 py-4">
                                      <div className="flex items-center gap-3">
                                         <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-border/40 group-hover:bg-white transition-colors uppercase">
                                            {getBuyerName(order.buyer).charAt(0)}
                                         </div>
                                         <div className="min-w-0">
                                            <p className="font-bold text-foreground truncate">{getBuyerName(order.buyer)}</p>
                                            <p className="text-[10px] text-muted-foreground truncate italic">{getBuyerEmail(order.buyer)}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-5 py-4">
                                      <div className="flex flex-col max-w-[200px]">
                                         <span className="font-medium text-foreground truncate">{getPrimaryItemName(order.items)}</span>
                                         <span className="text-[9px] font-black uppercase text-blue-600/60 mt-0.5">Physical Product</span>
                                      </div>
                                   </td>
                                   <td className="px-5 py-4">
                                      <span className="font-black text-foreground">LKR {order.totalAmount?.toLocaleString()}</span>
                                   </td>
                                   <td className="px-5 py-4 text-center">
                                      <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", statusMeta.color)}>
                                         {statusMeta.label}
                                      </span>
                                   </td>
                                   <td className="px-5 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                         <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="h-8 border-border/60 font-bold text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all"
                                            onClick={() => setSelectedOrder(order)}
                                         >
                                            <Eye className="h-3 w-3 mr-1.5" /> View
                                         </Button>
                                         
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted" disabled={updating}>
                                                  <MoreHorizontal className="h-4 w-4" />
                                               </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                               <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Management</DropdownMenuLabel>
                                               <DropdownMenuSeparator />
                                               {next && (
                                                  <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => handleStatusChange(order._id, next.status)}>
                                                     <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                                     {next.label}
                                                  </DropdownMenuItem>
                                               )}
                                               {order.status === "pending" && (
                                                  <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-red-600" onClick={() => handleStatusChange(order._id, "cancelled")}>
                                                     <XCircle className="h-3.5 w-3.5 mr-2" />
                                                     Decline Order
                                                  </DropdownMenuItem>
                                               )}
                                               <DropdownMenuSeparator />
                                               <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => (window as any).location.href = `mailto:${getBuyerEmail(order.buyer)}`}>
                                                  <UserRound className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                                  Contact Customer
                                               </DropdownMenuItem>
                                            </DropdownMenuContent>
                                         </DropdownMenu>
                                      </div>
                                   </td>
                                </tr>
                             );
                          })
                       ) : (
                          filteredServiceOrders.map(order => {
                             const config = serviceStatusConfig[order.status] || { label: order.status, color: "bg-muted text-muted-foreground" };
                             return (
                                <tr key={order._id} className="group hover:bg-muted/30 transition-all">
                                   <td className="px-5 py-4">
                                      <div className="flex flex-col">
                                         <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">#{order._id.slice(-6).toUpperCase()}</span>
                                         <span className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                                            <CalendarClock size={10} className="text-blue-500" />
                                            {new Date(order.bookingDate).toLocaleDateString()}
                                         </span>
                                      </div>
                                   </td>
                                   <td className="px-5 py-4">
                                      <div className="flex items-center gap-3">
                                         <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-border/40 group-hover:bg-white transition-colors uppercase">
                                            {getBuyerName(order.buyer).charAt(0)}
                                         </div>
                                         <div className="min-w-0">
                                            <p className="font-bold text-foreground truncate">{getBuyerName(order.buyer)}</p>
                                            <p className="text-[10px] text-muted-foreground truncate italic">{getBuyerEmail(order.buyer)}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-5 py-4">
                                      <div className="flex flex-col max-w-[200px]">
                                         <span className="font-medium text-foreground truncate">{order.serviceName}</span>
                                         <span className="text-[9px] font-black uppercase text-violet-600/60 mt-0.5">Workshop Service</span>
                                      </div>
                                   </td>
                                   <td className="px-5 py-4">
                                      <span className="font-black text-foreground">LKR {order.servicePrice?.toLocaleString()}</span>
                                   </td>
                                   <td className="px-5 py-4 text-center">
                                      <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", config.color)}>
                                         {config.label}
                                      </span>
                                   </td>
                                   <td className="px-5 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                         <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="h-8 border-border/60 font-bold text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all"
                                            onClick={() => setSelectedServiceOrder(order)}
                                         >
                                            <Eye className="h-3 w-3 mr-1.5" /> Details
                                         </Button>
                                         
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted" disabled={updating}>
                                                  <MoreHorizontal className="h-4 w-4" />
                                               </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                               <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Booking Actions</DropdownMenuLabel>
                                               <DropdownMenuSeparator />
                                               {order.status === "SERVICE_ORDER_PLACED" && (
                                                  <>
                                                     <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => handleServiceOrderStatusChange(order._id, "accept")}>
                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                                        Accept Booking
                                                     </DropdownMenuItem>
                                                     <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-red-600" onClick={() => handleServiceOrderStatusChange(order._id, "reject")}>
                                                        <XCircle className="h-3.5 w-3.5 mr-2" />
                                                        Reject Booking
                                                     </DropdownMenuItem>
                                                  </>
                                               )}
                                               {order.status === "BUYER_ARRIVED" && (
                                                  <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-blue-600" onClick={() => handleServiceOrderStatusChange(order._id, "start")}>
                                                     <Truck className="h-3.5 w-3.5 mr-2" />
                                                     Start Work
                                                  </DropdownMenuItem>
                                               )}
                                               {order.status === "SERVICE_IN_PROGRESS" && (
                                                  <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-emerald-600" onClick={() => handleServiceOrderStatusChange(order._id, "complete")}>
                                                     <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                                     Finish Job
                                                  </DropdownMenuItem>
                                               )}
                                               {order.status === "SERVICE_COMPLETED" && (
                                                  <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-blue-600" onClick={() => handleServiceOrderStatusChange(order._id, "payment_received")}>
                                                     <CreditCard className="h-3.5 w-3.5 mr-2" />
                                                     Payment Received
                                                  </DropdownMenuItem>
                                               )}
                                               <DropdownMenuSeparator />
                                               <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => (window as any).location.href = `mailto:${getBuyerEmail(order.buyer)}`}>
                                                  <UserRound className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                                  Customer Email
                                               </DropdownMenuItem>
                                            </DropdownMenuContent>
                                         </DropdownMenu>
                                      </div>
                                   </td>
                                </tr>
                             );
                          })
                       )}
                       {(activeTab === "product" ? filteredProductOrders.length : filteredServiceOrders.length) === 0 && (
                          <tr>
                             <td colSpan={6} className="py-24 text-center">
                                <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">No matching entries found</p>
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </ScrollArea>
           </CardContent>
        </Card>
      </Tabs>

      {/* Details Modals */}
      <ProductOrderDetailModal 
         order={selectedOrder} 
         onClose={() => setSelectedOrder(null)} 
         updating={updating} 
         onStatusChange={handleStatusChange} 
      />
      
      {/* Service Modal remains similar but styled */}
      <Dialog open={Boolean(selectedServiceOrder)} onOpenChange={(v) => !v && setSelectedServiceOrder(null)}>
         <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
            <ScrollArea className="max-h-[90vh]">
               {selectedServiceOrder && (
                  <>
                     <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150">
                           <Wrench size={120} />
                        </div>
                        <div className="relative z-10">
                           <div className="flex items-center gap-3 mb-4">
                              <Badge className="bg-white/20 border-white/30 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 backdrop-blur-sm">
                                 Booking #{selectedServiceOrder._id.slice(-6).toUpperCase()}
                              </Badge>
                              <Badge className={cn("text-[10px] font-black uppercase tracking-widest border-none px-3 py-1", serviceStatusConfig[selectedServiceOrder.status]?.color)}>
                                 {serviceStatusConfig[selectedServiceOrder.status]?.label}
                              </Badge>
                           </div>
                           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                              <div>
                                 <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Customer Profile</p>
                                 <h2 className="text-3xl font-black tracking-tight">{getBuyerName(selectedServiceOrder.buyer)}</h2>
                              </div>
                              <div className="text-left md:text-right">
                                 <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Service Fee</p>
                                 <p className="text-3xl font-black tracking-tighter">LKR {selectedServiceOrder.servicePrice?.toLocaleString()}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="p-8 space-y-8 bg-background">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-2">
                                 <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <UserRound size={16} />
                                 </div>
                                 <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Contact Details</h3>
                              </div>
                              <div className="space-y-3 px-1">
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</span>
                                    <span className="text-sm font-bold text-foreground">{getBuyerEmail(selectedServiceOrder.buyer) || "N/A"}</span>
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</span>
                                    <span className="text-sm font-bold text-foreground">{getBuyerPhone(selectedServiceOrder.buyer) || "N/A"}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-2">
                                 <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <CalendarClock size={16} />
                                 </div>
                                 <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Booking Info</h3>
                              </div>
                              <div className="space-y-3 px-1">
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Service Selected</span>
                                    <span className="text-sm font-bold text-foreground">{selectedServiceOrder.serviceName}</span>
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Scheduled Date</span>
                                    <span className="text-sm font-bold text-foreground">{new Date(selectedServiceOrder.bookingDate).toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <Separator className="bg-border/40" />
                        <div className="space-y-4">
                           <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                                 <FileText size={16} />
                              </div>
                              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Special Instructions</h3>
                           </div>
                           <div className="p-5 rounded-2xl bg-amber-50/30 border border-amber-100 italic text-xs font-bold leading-relaxed text-amber-900/70">
                              {selectedServiceOrder.notes || "No special instructions provided."}
                           </div>
                        </div>
                     </div>
                     <div className="p-6 bg-muted/30 border-t border-border/40 flex items-center justify-end gap-3">
                        <Button variant="outline" onClick={() => setSelectedServiceOrder(null)} className="font-bold text-xs uppercase tracking-widest rounded-xl px-6">Close</Button>
                        {selectedServiceOrder.status === "SERVICE_ORDER_PLACED" && (
                           <Button onClick={() => handleServiceOrderStatusChange(selectedServiceOrder._id, "accept")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl px-6">Accept Booking</Button>
                        )}
                     </div>
                  </>
               )}
            </ScrollArea>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductOrderDetailModal({
  order,
  onClose,
  onStatusChange,
  updating,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (orderId: string, status: string) => void;
  updating: boolean;
}) {
  if (!order) return null;
  const statusMeta = getStatusMeta(order.status);
  const next = nextProductStatus[order.status];

  return (
    <Dialog open={Boolean(order)} onOpenChange={(v) => !v && onClose()}>
       <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
          <ScrollArea className="max-h-[90vh]">
             <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150">
                   <Package size={120} />
                </div>
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-white/20 border-white/30 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 backdrop-blur-sm">
                         Order #{order._id.slice(-6).toUpperCase()}
                      </Badge>
                      <Badge className={cn("text-[10px] font-black uppercase tracking-widest border-none px-3 py-1", statusMeta.color)}>
                         {statusMeta.label}
                      </Badge>
                   </div>
                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                         <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Customer Profile</p>
                         <h2 className="text-3xl font-black tracking-tight">{getBuyerName(order.buyer)}</h2>
                      </div>
                      <div className="text-left md:text-right">
                         <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Bill</p>
                         <p className="text-3xl font-black tracking-tighter">LKR {order.totalAmount?.toLocaleString()}</p>
                      </div>
                   </div>
                </div>
             </div>
             <div className="p-8 space-y-8 bg-background">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <UserRound size={16} />
                         </div>
                         <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Contact Details</h3>
                      </div>
                      <div className="space-y-3 px-1">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</span>
                            <span className="text-sm font-bold text-foreground">{getBuyerEmail(order.buyer) || "N/A"}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</span>
                            <span className="text-sm font-bold text-foreground">{getBuyerPhone(order.buyer) || "N/A"}</span>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <MapPin size={16} />
                         </div>
                         <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Shipping Info</h3>
                      </div>
                      <div className="space-y-3 px-1">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Delivery Address</span>
                            <span className="text-sm font-bold text-foreground leading-relaxed">{order.shippingAddress}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment</span>
                            <span className="text-sm font-black text-foreground uppercase">{order.paymentMethod}</span>
                         </div>
                      </div>
                   </div>
                </div>
                <Separator className="bg-border/40" />
                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                         <ShoppingBag size={16} />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Purchased Items</h3>
                   </div>
                   <div className="rounded-2xl border border-border/40 overflow-hidden bg-muted/5">
                      <table className="w-full text-sm">
                         <thead>
                            <tr className="bg-muted/20 border-b border-border/40 text-left">
                               <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item</th>
                               <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Qty</th>
                               <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Price</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-border/20">
                            {order.items.map((item, idx) => (
                               <tr key={idx}>
                                  <td className="px-4 py-3 font-bold text-foreground">{item.name}</td>
                                  <td className="px-4 py-3 text-center font-black text-blue-600">{item.qty}</td>
                                  <td className="px-4 py-3 text-right font-bold">LKR {item.price.toLocaleString()}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
             <div className="p-6 bg-muted/30 border-t border-border/40 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={onClose} className="font-bold text-xs uppercase tracking-widest rounded-xl px-6">Close</Button>
                {next && (
                   <Button disabled={updating} onClick={() => onStatusChange(order._id, next.status)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl px-6">
                      {updating && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                      {next.label}
                   </Button>
                )}
             </div>
          </ScrollArea>
       </DialogContent>
    </Dialog>
  );
}
