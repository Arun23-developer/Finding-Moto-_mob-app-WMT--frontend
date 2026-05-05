import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  Package,
  Printer,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  Star,
  Truck,
  UserRound,
  Wrench,
  XCircle,
} from "lucide-react";
import api from "../services/api";
import { resolveMediaUrl } from "@/lib/imageUrl";
import reviewService from "@/services/reviewService";
import { useToast } from "@/hooks/use-toast";
import { createAuthedSocket, type OrderWorkflowSocketEvent, type ReturnWorkflowSocketEvent } from "@/lib/socket";
import { RETURN_STATUS_LABELS, RETURN_STATUS_STYLES, type ReturnRequest } from "@/lib/returns";
import { ReturnStatusTimeline } from "@/components/returns/ReturnStatusTimeline";

const returnableProductStatuses = new Set(["delivered"]);
const billableProductStatuses = new Set(["delivered", "completed"]);

interface OrderItem {
  product: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status:
    | "pending"
    | "awaiting_seller_confirmation"
    | "confirmed"
    | "rejected"
    | "processing"
    | "ready_for_dispatch"
    | "pickup_assigned"
    | "picked_up"
    | "out_for_delivery"
    | "delivery_failed"
    | "delivered"
    | "completed"
    | "cancelled"
    | "refunded"
    | "shipped";
  shippingAddress: string;
  paymentMethod: string;
  notes?: string;
  seller?: { firstName: string; lastName: string; shopName?: string };
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
  serviceName: string;
  servicePrice: number;
  bookingDate: string;
  notes?: string;
  status: ServiceOrderStatus;
  statusHistory?: Array<{ status: ServiceOrderStatus; changedAt: string; note?: string }>;
  mechanic: { firstName?: string; lastName?: string; workshopName?: string; email?: string };
  createdAt: string;
}

const productStatusConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  pending: { icon: <Clock className="h-4 w-4" />, label: "Pending", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" },
  awaiting_seller_confirmation: { icon: <Clock className="h-4 w-4" />, label: "Placed", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
  confirmed: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Confirmed", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
  rejected: { icon: <XCircle className="h-4 w-4" />, label: "Rejected", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
  processing: { icon: <ShoppingBag className="h-4 w-4" />, label: "Processing", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800" },
  ready_for_dispatch: { icon: <ShoppingBag className="h-4 w-4" />, label: "Package Ready", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800" },
  pickup_assigned: { icon: <Truck className="h-4 w-4" />, label: "Delivery Agent Assigned", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800" },
  picked_up: { icon: <Truck className="h-4 w-4" />, label: "Picked Up", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800" },
  out_for_delivery: { icon: <Truck className="h-4 w-4" />, label: "Out for Delivery", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" },
  delivery_failed: { icon: <XCircle className="h-4 w-4" />, label: "Delivery Failed", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
  delivered: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Delivered", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Completed", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
  cancelled: { icon: <XCircle className="h-4 w-4" />, label: "Cancelled", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
  refunded: { icon: <XCircle className="h-4 w-4" />, label: "Refunded", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800" },
  shipped: { icon: <Truck className="h-4 w-4" />, label: "Out for Delivery", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" },
};

const serviceStatusConfig: Record<ServiceOrderStatus, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  SERVICE_ORDER_PLACED: { icon: <Clock className="h-4 w-4" />, label: "Placed", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
  SERVICE_ORDER_CONFIRMED: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Confirmed", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
  BUYER_ARRIVED: { icon: <MapPin className="h-4 w-4" />, label: "Arrived", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800" },
  SERVICE_IN_PROGRESS: { icon: <Wrench className="h-4 w-4" />, label: "In Progress", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800" },
  SERVICE_COMPLETED: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Completed", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
  PAYMENT_RECEIVED: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Payment Sent", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
  SERVICE_ORDER_REJECTED: { icon: <XCircle className="h-4 w-4" />, label: "Rejected", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
};

const productStatusFilters = [
  "all",
  "pending",
  "awaiting_seller_confirmation",
  "confirmed",
  "processing",
  "ready_for_dispatch",
  "pickup_assigned",
  "picked_up",
  "out_for_delivery",
  "delivery_failed",
  "delivered",
  "completed",
  "cancelled",
  "refunded",
] as const;

const serviceStatusFilters = [
  "all",
  "SERVICE_ORDER_PLACED",
  "SERVICE_ORDER_CONFIRMED",
  "BUYER_ARRIVED",
  "SERVICE_IN_PROGRESS",
  "SERVICE_COMPLETED",
  "PAYMENT_RECEIVED",
  "SERVICE_ORDER_REJECTED",
] as const;

const serviceTrackingSteps: Array<{ key: ServiceOrderStatus; label: string }> = [
  { key: "SERVICE_ORDER_PLACED", label: "Placed" },
  { key: "SERVICE_ORDER_CONFIRMED", label: "Confirmed" },
  { key: "BUYER_ARRIVED", label: "Arrived" },
  { key: "SERVICE_IN_PROGRESS", label: "In Progress" },
  { key: "SERVICE_COMPLETED", label: "Completed" },
  { key: "PAYMENT_RECEIVED", label: "Payment Done" },
];

const serviceStatusRank: Record<ServiceOrderStatus, number> = {
  SERVICE_ORDER_PLACED: 0,
  SERVICE_ORDER_CONFIRMED: 1,
  BUYER_ARRIVED: 2,
  SERVICE_IN_PROGRESS: 3,
  SERVICE_COMPLETED: 4,
  PAYMENT_RECEIVED: 5,
  SERVICE_ORDER_REJECTED: -1,
};

const formatStatusLabel = (status: string) => {
  if (status === "all") return "All Orders";
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const orderDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function getServiceMechanicName(mechanic?: ServiceOrder["mechanic"]) {
  if (!mechanic) return "Mechanic";
  return mechanic.workshopName || `${mechanic.firstName || ""} ${mechanic.lastName || ""}`.trim() || mechanic.email || "Mechanic";
}

function getSellerName(seller?: Order["seller"]) {
  if (!seller) return "Seller";
  return seller.shopName || `${seller.firstName || ""} ${seller.lastName || ""}`.trim() || "Seller";
}

function ServiceTrackingFlow({ status }: { status: ServiceOrderStatus }) {
  const isRejected = status === "SERVICE_ORDER_REJECTED";
  const currentRank = serviceStatusRank[status];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tracking Flow</p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        {serviceTrackingSteps.map((step) => {
          const reached = !isRejected && currentRank >= serviceStatusRank[step.key];
          const isCurrent = step.key === status;
          return (
            <div
              key={step.key}
              className={`rounded-xl border px-3 py-2 text-center text-xs font-medium transition-colors ${
                reached
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                  : "border-border bg-secondary text-muted-foreground"
              } ${isCurrent ? "ring-2 ring-emerald-200 dark:ring-emerald-900" : ""}`}
            >
              {step.label}
            </div>
          );
        })}
      </div>
      {isRejected && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          This booking was rejected by the mechanic.
        </div>
      )}
    </div>
  );
}

const MyOrders: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"product" | "service">("product");
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [serviceError, setServiceError] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState<string>("all");
  const [serviceStatusFilter, setServiceStatusFilter] = useState<string>("all");
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [expandedReturnOrderId, setExpandedReturnOrderId] = useState<string | null>(null);
  const [billOrder, setBillOrder] = useState<Order | null>(null);
  const latestOrdersRequestIdRef = useRef(0);
  const latestServiceOrdersRequestIdRef = useRef(0);

  const fetchOrders = useCallback(async () => {
    const requestId = ++latestOrdersRequestIdRef.current;

    try {
      setProductLoading(true);
      setProductError("");
      const params: Record<string, string> = {};
      if (productStatusFilter !== "all") params.status = productStatusFilter;
      const { data: orderRes } = await api.get("/orders/my", { params });

      if (requestId !== latestOrdersRequestIdRef.current) return;

      if (orderRes.success) {
        setOrders(Array.isArray(orderRes.data) ? orderRes.data : []);
      } else {
        setOrders([]);
        setProductError("Failed to load product orders.");
      }
    } catch {
      if (requestId !== latestOrdersRequestIdRef.current) return;
      setProductError("Failed to load product orders.");
    } finally {
      if (requestId === latestOrdersRequestIdRef.current) {
        setProductLoading(false);
      }
    }
  }, [productStatusFilter]);

  const fetchServiceOrders = useCallback(async () => {
    const requestId = ++latestServiceOrdersRequestIdRef.current;

    try {
      setServiceLoading(true);
      setServiceError("");
      const { data: serviceRes } = await api.get("/service-orders/my");

      if (requestId !== latestServiceOrdersRequestIdRef.current) return;

      if (serviceRes.success) {
        const data = Array.isArray(serviceRes.data) ? serviceRes.data : [];
        const filtered =
          serviceStatusFilter === "all"
            ? data
            : data.filter((order: ServiceOrder) => order.status === serviceStatusFilter);
        setServiceOrders(filtered);
      } else {
        setServiceOrders([]);
        setServiceError("Failed to load service orders.");
      }
    } catch {
      if (requestId !== latestServiceOrdersRequestIdRef.current) return;
      setServiceError("Failed to load service orders.");
    } finally {
      if (requestId === latestServiceOrdersRequestIdRef.current) {
        setServiceLoading(false);
      }
    }
  }, [serviceStatusFilter]);

  const fetchReviewedProductIds = useCallback(async () => {
    try {
      const myReviews = await reviewService.getMyReviews();
      const reviewedIds = myReviews
        .map((review) => review.productId)
        .filter((id): id is string => Boolean(id));
      setReviewedProductIds(new Set(reviewedIds));
    } catch {
      // Ignore review fetch failure to avoid blocking order rendering.
    }
  }, []);

  const fetchReturnRequests = useCallback(async () => {
    try {
      const response = await api.get("/returns/my");
      setReturnRequests(Array.isArray(response.data.data) ? response.data.data : []);
    } catch {
      setReturnRequests([]);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchServiceOrders();
  }, [fetchServiceOrders]);

  useEffect(() => {
    fetchReviewedProductIds();
  }, [fetchReviewedProductIds]);

  useEffect(() => {
    fetchReturnRequests();
  }, [fetchReturnRequests]);

  useEffect(() => {
    const socket = createAuthedSocket();
    if (!socket) return;

    const handleWorkflowEvent = (event: OrderWorkflowSocketEvent) => {
      if (event.audience !== "buyer") return;

      fetchOrders();
      fetchServiceOrders();
      fetchReturnRequests();
      toast({
        title: event.title,
        description: event.message,
      });
    };

    const handleReturnWorkflowEvent = (event: ReturnWorkflowSocketEvent) => {
      if (event.audience !== "buyer") return;

      fetchReturnRequests();
      setExpandedReturnOrderId(event.orderId);
      toast({
        title: event.title,
        description: event.message,
      });
    };

    socket.on("order:workflow", handleWorkflowEvent);
    socket.on("return:workflow", handleReturnWorkflowEvent);

    return () => {
      socket.off("order:workflow", handleWorkflowEvent);
      socket.off("return:workflow", handleReturnWorkflowEvent);
      socket.disconnect();
    };
  }, [fetchOrders, fetchReturnRequests, fetchServiceOrders, toast]);

  const handleCancel = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      setBusyOrderId(orderId);
      await api.patch(`/orders/my/${orderId}/cancel`);
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleConfirmReceipt = async (orderId: string) => {
    try {
      setBusyOrderId(orderId);
      await api.patch(`/orders/my/${orderId}/confirm-received`);
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to confirm receipt");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleBuyerArrived = async (orderId: string) => {
    try {
      setBusyOrderId(orderId);
      await api.put(`/service-orders/${orderId}/status`, { action: "arrived" });
      await fetchServiceOrders();
      toast({
        title: "Arrival updated",
        description: "The mechanic has been notified that you arrived.",
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update arrival status");
    } finally {
      setBusyOrderId(null);
    }
  };

  const getImageUrl = (img?: string): string => {
    return resolveMediaUrl(img, "https://placehold.co/80x80?text=Item");
  };

  const productOrdersEmpty = !productLoading && !productError && orders.length === 0;
  const serviceOrdersEmpty = !serviceLoading && !serviceError && serviceOrders.length === 0;
  const billSubtotal = billOrder?.items.reduce((sum, item) => sum + item.price * item.qty, 0) ?? 0;
  const billBalance = billOrder ? Math.max(0, billOrder.totalAmount - billSubtotal) : 0;
  const returnRequestByOrderId = new Map(
    returnRequests
      .filter((item) => item.order?._id)
      .map((item) => [item.order._id, item])
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <section className="bg-secondary py-8 border-b border-border">
          <div className="container">
            <Button variant="ghost" className="mb-4" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Package className="h-8 w-8 text-accent" />
              My Orders
            </h1>
            <p className="text-muted-foreground">Track your product purchases and service bookings separately.</p>
          </div>
        </section>

        <div className="container py-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value === "service" ? "service" : "product")}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="product">Product Orders</TabsTrigger>
              <TabsTrigger value="service">Service Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="product" className="mt-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                {productStatusFilters.map((status) => (
                  <button
                    key={status}
                    onClick={() => setProductStatusFilter(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      productStatusFilter === status
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    }`}
                  >
                    {formatStatusLabel(status)}
                  </button>
                ))}
              </div>

              {productLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <span className="ml-3 text-muted-foreground">Loading product orders...</span>
                </div>
              )}

              {productError && !productLoading && (
                <div className="text-center py-20">
                  <p className="text-destructive mb-4">{productError}</p>
                  <Button variant="outline" onClick={fetchOrders}>Try Again</Button>
                </div>
              )}

              {productOrdersEmpty && (
                <div className="text-center py-20">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No product orders yet</h3>
                  <p className="text-muted-foreground mb-6">
                    {productStatusFilter !== "all"
                      ? `No ${formatStatusLabel(productStatusFilter).toLowerCase()} product orders found.`
                      : "Start shopping to see your product orders here."}
                  </p>
                  <Button onClick={() => navigate("/products")}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse Products
                  </Button>
                </div>
              )}

              {!productLoading && orders.length > 0 && (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const sc = productStatusConfig[order.status] || productStatusConfig.pending;
                    const returnRequest = returnRequestByOrderId.get(order._id);
                    const hasReturnRequest = Boolean(returnRequest);
                    const canRequestReturn = returnableProductStatuses.has(order.status);
                    const canConfirmReceipt = order.status === "delivered" && !hasReturnRequest;
                    const canViewBill = billableProductStatuses.has(order.status);
                    const isReturnExpanded = expandedReturnOrderId === order._id;
                    return (
                      <div key={order._id} className={`p-5 rounded-xl border ${sc.bg} transition-all`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Order #{order._id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {orderDateFormatter.format(new Date(order.createdAt))}
                            </p>
                          </div>
                          <div className={`flex items-center gap-1.5 text-sm font-medium min-w-0 ${sc.color}`}>
                            {sc.icon}
                            {sc.label}
                          </div>
                        </div>

                        {order.items.map((item, index) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-4 py-3 border-t border-border/50">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                              <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                LKR {item.price.toLocaleString()} x {item.qty}
                              </p>
                              {order.status === "delivered" && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  {reviewedProductIds.has(item.product) ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                      <Star className="h-3.5 w-3.5 fill-green-600 text-green-600" />
                                      Reviewed
                                    </span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => navigate(`/products/${item.product}`)}
                                    >
                                      <Star className="h-3.5 w-3.5 mr-1" />
                                      Rate & Review
                                    </Button>
                                  )}
                                  {canViewBill && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => setBillOrder(order)}
                                    >
                                      <ReceiptText className="h-3.5 w-3.5 mr-1" />
                                      View Bill
                                    </Button>
                                  )}
                                </div>
                              )}
                              {order.status === "completed" && canViewBill && (
                                <div className="mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => setBillOrder(order)}
                                  >
                                    <ReceiptText className="h-3.5 w-3.5 mr-1" />
                                    View Bill
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="text-right sm:text-right self-start sm:self-auto w-full sm:w-auto">
                              <p className="font-bold text-foreground">
                                LKR {(item.price * item.qty).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border/50">
                          <div className="text-sm text-muted-foreground space-y-1 min-w-0 break-words">
                            {order.seller && (
                              <p>
                                Seller: <strong className="text-foreground">
                                  {order.seller.shopName || `${order.seller.firstName} ${order.seller.lastName}`}
                                </strong>
                              </p>
                            )}
                            <p>Payment: {order.paymentMethod}</p>
                            {returnRequest && (
                              <p>
                                Return:{" "}
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${RETURN_STATUS_STYLES[returnRequest.status] || "border-border bg-background text-foreground"}`}>
                                  {RETURN_STATUS_LABELS[returnRequest.status] || returnRequest.status}
                                </span>
                              </p>
                            )}
                            <p className="flex items-start gap-1 break-words">
                              <ChevronDown className="h-3 w-3 mt-1 shrink-0" />
                              <span className="break-words">{order.shippingAddress}</span>
                            </p>
                          </div>
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto sm:shrink-0 justify-between sm:justify-end">
                            <div className="text-left sm:text-right">
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="text-xl font-bold text-foreground">
                                LKR {order.totalAmount.toLocaleString()}
                              </p>
                            </div>
                            {["pending", "awaiting_seller_confirmation", "confirmed", "processing", "ready_for_dispatch"].includes(order.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                                onClick={() => handleCancel(order._id)}
                                disabled={busyOrderId === order._id}
                              >
                                {busyOrderId === order._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                Cancel
                              </Button>
                            )}
                            {canConfirmReceipt && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 shrink-0"
                                onClick={() => handleConfirmReceipt(order._id)}
                                disabled={busyOrderId === order._id}
                              >
                                {busyOrderId === order._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                )}
                                Confirm Receipt
                              </Button>
                            )}
                            {canRequestReturn && !hasReturnRequest && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 shrink-0"
                                onClick={() => navigate(`/buyer/returns-claims?orderId=${order._id}`)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Return
                              </Button>
                            )}
                            {canRequestReturn && hasReturnRequest && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                onClick={() => setExpandedReturnOrderId((current) => (current === order._id ? null : order._id))}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                View Return Status
                              </Button>
                            )}
                          </div>
                        </div>
                        {returnRequest && isReturnExpanded && (
                          <div className="mt-4 border-t border-border/50 pt-4">
                            <ReturnStatusTimeline item={returnRequest} compact />
                            <div className="mt-3 flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => navigate("/buyer/returns-claims")}
                              >
                                Open Return & Claims
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="service" className="mt-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                {serviceStatusFilters.map((status) => (
                  <button
                    key={status}
                    onClick={() => setServiceStatusFilter(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      serviceStatusFilter === status
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    }`}
                  >
                    {formatStatusLabel(status)}
                  </button>
                ))}
              </div>

              {serviceLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <span className="ml-3 text-muted-foreground">Loading service orders...</span>
                </div>
              )}

              {serviceError && !serviceLoading && (
                <div className="text-center py-20">
                  <p className="text-destructive mb-4">{serviceError}</p>
                  <Button variant="outline" onClick={fetchServiceOrders}>Try Again</Button>
                </div>
              )}

              {serviceOrdersEmpty && (
                <div className="text-center py-20">
                  <Wrench className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No service orders yet</h3>
                  <p className="text-muted-foreground mb-6">
                    {serviceStatusFilter !== "all"
                      ? `No ${formatStatusLabel(serviceStatusFilter).toLowerCase()} service orders found.`
                      : "Book a service to start tracking your mechanic appointments here."}
                  </p>
                  <Button onClick={() => navigate("/services")}>
                    <Wrench className="h-4 w-4 mr-2" />
                    Browse Services
                  </Button>
                </div>
              )}

              {!serviceLoading && serviceOrders.length > 0 && (
                <div className="space-y-4">
                  {serviceOrders.map((order) => {
                    const sc = serviceStatusConfig[order.status];
                    const mechanicName = getServiceMechanicName(order.mechanic);
                    const canMarkArrived = order.status === "SERVICE_ORDER_CONFIRMED";

                    return (
                      <div key={order._id} className={`rounded-2xl border p-5 ${sc.bg}`}>
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Service Order #{order._id.slice(-8).toUpperCase()}
                                </p>
                                <h3 className="text-lg font-semibold text-foreground">{order.serviceName}</h3>
                              </div>
                              <div className={`inline-flex items-center gap-1.5 text-sm font-medium ${sc.color}`}>
                                {sc.icon}
                                {sc.label}
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                              <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mechanic Name</p>
                                <p className="mt-1 font-medium text-foreground flex items-center gap-2">
                                  <UserRound className="h-4 w-4 text-muted-foreground" />
                                  {mechanicName}
                                </p>
                              </div>
                              <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Booking Date / Time</p>
                                <p className="mt-1 font-medium text-foreground flex items-center gap-2">
                                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                  {orderDateFormatter.format(new Date(order.bookingDate))}
                                </p>
                              </div>
                              <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Service Price</p>
                                <p className="mt-1 font-medium text-foreground">LKR {order.servicePrice.toLocaleString()}</p>
                              </div>
                            </div>

                            <ServiceTrackingFlow status={order.status} />

                            {order.notes && (
                              <div className="rounded-xl border border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Notes:</span> {order.notes}
                              </div>
                            )}
                          </div>

                          <div className="w-full lg:w-auto lg:min-w-[200px] space-y-3">
                            {canMarkArrived && (
                              <Button
                                className="w-full"
                                onClick={() => handleBuyerArrived(order._id)}
                                disabled={busyOrderId === order._id}
                              >
                                {busyOrderId === order._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <MapPin className="h-4 w-4 mr-2" />
                                )}
                                I'm Arrived
                              </Button>
                            )}

                            {order.status === "PAYMENT_RECEIVED" && (
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                                Payment Sent ✅
                              </div>
                            )}

                            {!canMarkArrived && order.status !== "PAYMENT_RECEIVED" && (
                              <div className="rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                                {order.status === "SERVICE_ORDER_PLACED" && "Waiting for mechanic confirmation."}
                                {order.status === "BUYER_ARRIVED" && "The mechanic can now start the service."}
                                {order.status === "SERVICE_IN_PROGRESS" && "Your service is currently in progress."}
                                {order.status === "SERVICE_COMPLETED" && "Waiting for the mechanic to confirm payment received."}
                                {order.status === "SERVICE_ORDER_REJECTED" && "This booking was rejected by the mechanic."}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Dialog open={Boolean(billOrder)} onOpenChange={(open) => !open && setBillOrder(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-accent" />
              Product Bill
            </DialogTitle>
            <DialogDescription>
              Bill is available after the product order is delivered or completed.
            </DialogDescription>
          </DialogHeader>

          {billOrder && (
            <div className="space-y-5 rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground">Finding Moto</p>
                  <p className="text-sm text-muted-foreground">Product purchase bill</p>
                </div>
                <div className="text-sm sm:text-right">
                  <p className="font-semibold text-foreground">Bill #{billOrder._id.slice(-8).toUpperCase()}</p>
                  <p className="text-muted-foreground">{orderDateFormatter.format(new Date(billOrder.createdAt))}</p>
                </div>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-secondary/40 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Seller</p>
                  <p className="mt-1 font-semibold text-foreground">{getSellerName(billOrder.seller)}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-secondary/40 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment</p>
                  <p className="mt-1 font-semibold text-foreground">{billOrder.paymentMethod}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-secondary/40 p-3 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Delivery Address</p>
                  <p className="mt-1 text-foreground">{billOrder.shippingAddress}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-[1fr_70px_90px] gap-2 bg-secondary px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[1fr_90px_90px_110px]">
                  <span>Product</span>
                  <span className="text-right hidden sm:block">Price</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Amount</span>
                </div>
                {billOrder.items.map((item, index) => (
                  <div key={`${item.product}-${index}`} className="grid grid-cols-[1fr_70px_90px] gap-2 border-t border-border px-3 py-3 text-sm sm:grid-cols-[1fr_90px_90px_110px]">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-right text-muted-foreground hidden sm:block">LKR {item.price.toLocaleString()}</span>
                    <span className="text-right text-muted-foreground">{item.qty}</span>
                    <span className="text-right font-semibold text-foreground">LKR {(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>LKR {billSubtotal.toLocaleString()}</span>
                </div>
                {billBalance > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Other charges</span>
                    <span>LKR {billBalance.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-foreground">
                  <span>Total</span>
                  <span>LKR {billOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                This bill is generated for a delivered product order.
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBillOrder(null)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default MyOrders;
