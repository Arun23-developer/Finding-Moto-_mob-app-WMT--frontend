import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Package, 
  Clock,
  MoreHorizontal,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Order, OrderBuyer } from "./types";
import { getBuyerName } from "./helpers";

interface OrdersTableProps {
  orders: Order[];
  allOrdersCount: number;
  error: string | null;
  onBuyerDetails: (order: Order) => void;
  onAssignDelivery: (order: Order) => void;
  onStatusChange: (orderId: string, status: Order["status"]) => void;
  updatingOrderId: string | null;
}

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "accepted":
    case "confirmed":
      return <Badge className="bg-sky-500/10 text-sky-600 border-sky-200 hover:bg-sky-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">Confirmed</Badge>;
    case "processing":
      return <Badge className="bg-violet-500/10 text-violet-600 border-violet-200 hover:bg-violet-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">Processing</Badge>;
    case "ready_for_dispatch":
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">Ready</Badge>;
    case "pickup_assigned":
    case "picked_up":
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">In Transit</Badge>;
    case "out_for_delivery":
      return <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-200 hover:bg-cyan-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">Out for Delivery</Badge>;
    case "delivered":
    case "completed":
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">Delivered</Badge>;
    case "cancelled":
    case "refunded":
      return <Badge className="bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">Cancelled</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">{status.replace(/_/g, ' ')}</Badge>;
  }
}

export function OrdersTable({
  orders,
  allOrdersCount,
  error,
  onBuyerDetails,
  onAssignDelivery,
  onStatusChange,
  updatingOrderId,
}: OrdersTableProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <XCircle className="h-10 w-10 text-red-500/40 mb-3" />
        <p className="text-sm font-medium text-foreground">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No orders found</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Showing {allOrdersCount} total orders</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30 text-left">
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Order ID</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Customer</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Order Items</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Amount</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground text-center">Status</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {orders.map((order) => (
              <tr key={order._id} className="group hover:bg-muted/30 transition-colors duration-200">
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit select-all cursor-copy">
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0 border border-border/40 group-hover:bg-white transition-colors">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{getBuyerName(order.buyer)}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {(typeof order.buyer === 'object' && (order.buyer as OrderBuyer).email) || "No email"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col max-w-[250px]">
                    <span className="font-medium text-foreground truncate">
                      {order.items?.[0]?.name || "Product"}
                    </span>
                    {order.items && order.items.length > 1 && (
                      <span className="text-[10px] text-blue-600 font-bold mt-0.5">
                        +{order.items.length - 1} more items
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 font-black text-foreground">
                  LKR {order.totalAmount?.toLocaleString() || "0"}
                </td>
                <td className="px-5 py-4 text-center">
                  {getStatusBadge(order.status)}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 border-border/60 font-bold text-xs gap-1.5 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                      onClick={() => onBuyerDetails(order)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Details
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted"
                          disabled={updatingOrderId === order._id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Manage Order</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-xs font-medium cursor-pointer"
                          onClick={() => onAssignDelivery(order)}
                        >
                          <Truck className="h-3.5 w-3.5 mr-2" />
                          Assign Delivery
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Quick Status</DropdownMenuLabel>
                        
                        <DropdownMenuItem 
                          className="text-xs font-medium cursor-pointer"
                          onClick={() => onStatusChange(order._id, "confirmed")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-sky-500" />
                          Confirm Order
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          className="text-xs font-medium cursor-pointer"
                          onClick={() => onStatusChange(order._id, "ready_for_dispatch")}
                        >
                          <Package className="h-3.5 w-3.5 mr-2 text-blue-500" />
                          Mark Ready
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          className="text-xs font-medium cursor-pointer text-red-600 hover:text-red-700"
                          onClick={() => onStatusChange(order._id, "cancelled")}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-2" />
                          Cancel Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}