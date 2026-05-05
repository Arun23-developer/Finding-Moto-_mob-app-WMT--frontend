import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  FileText, 
  Package, 
  ShoppingBag,
  CheckCircle2,
  ExternalLink,
  Info
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBuyerName } from "./helpers";
import type { Order, OrderBuyer } from "./types";

interface BuyerDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "accepted":
    case "confirmed":
      return <Badge className="bg-sky-500/10 text-sky-600 border-sky-200 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">Confirmed</Badge>;
    case "delivered":
    case "completed":
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">Delivered</Badge>;
    case "cancelled":
      return <Badge className="bg-red-500/10 text-red-600 border-red-200 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">Cancelled</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5">{status.replace(/_/g, ' ')}</Badge>;
  }
}

export function BuyerDetailsModal({ order, open, onOpenChange }: BuyerDetailsModalProps) {
  if (!order) return null;

  const buyer = order.buyer;
  const buyerName = getBuyerName(buyer);
  const buyerEmail = (typeof buyer === "object" && (buyer as OrderBuyer).email) || "";
  const buyerPhone = (typeof buyer === "object" && (buyer as OrderBuyer).phone) || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
        <ScrollArea className="max-h-[90vh]">
          {/* Header Banner */}
          <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150">
              <ShoppingBag size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-white/20 hover:bg-white/30 border-white/30 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 backdrop-blur-sm">
                  Order #{order._id.slice(-6).toUpperCase()}
                </Badge>
                {getStatusBadge(order.status)}
              </div>
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Customer Profile</p>
                  <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md">
                      <User size={24} className="text-white" />
                    </div>
                    {buyerName}
                  </h2>
                </div>
                
                <div className="text-left md:text-right">
                  <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Transaction</p>
                  <p className="text-3xl font-black tracking-tighter">
                    LKR {order.totalAmount?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8 bg-background">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Mail size={16} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Contact Details</h3>
                </div>
                
                <div className="space-y-4 px-1">
                  <div className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</span>
                      <span className="text-sm font-bold text-foreground truncate max-w-[200px]">{buyerEmail || "Not provided"}</span>
                    </div>
                    {buyerEmail && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" asChild>
                        <a href={`mailto:${buyerEmail}`}><ExternalLink size={14} /></a>
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</span>
                      <span className="text-sm font-bold text-foreground">{buyerPhone || "Not provided"}</span>
                    </div>
                    {buyerPhone && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" asChild>
                        <a href={`tel:${buyerPhone}`}><Phone size={14} /></a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Package size={16} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Order Summary</h3>
                </div>
                
                <div className="space-y-4 px-1">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Order Date</span>
                      <span className="text-sm font-bold text-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' }) : "N/A"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment Method</span>
                      <div className="flex items-center gap-2 mt-1">
                        <CreditCard size={14} className="text-blue-600" />
                        <span className="text-sm font-black text-foreground uppercase">{order.paymentMethod || "Cash on Delivery"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-border/40" />

            {/* Items Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <ShoppingBag size={16} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Ordered Items</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-black border-blue-100 text-blue-600">{order.items?.length || 0} Items</Badge>
              </div>
              
              <div className="rounded-2xl border border-border/40 overflow-hidden bg-muted/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/20 border-b border-border/40 text-left">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Qty</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {order.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-foreground truncate max-w-[200px] block">{item.name}</span>
                            <span className="text-[9px] text-muted-foreground uppercase font-medium">Product ID: {item.product?.slice(-8).toUpperCase() || "N/A"}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-black text-blue-600 bg-blue-500/5">{item.qty || 1}</td>
                          <td className="px-4 py-3 text-right font-bold">LKR {(item.price || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Shipping Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <MapPin size={16} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Delivery Address</h3>
                </div>
                <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 min-h-[100px] flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                  <p className="text-xs font-bold leading-relaxed text-foreground">
                    {order.shippingAddress || "Delivery address details were not provided."}
                  </p>
                </div>
              </div>

              {/* Order Notes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <FileText size={16} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Special Instructions</h3>
                </div>
                <div className="p-5 rounded-2xl bg-amber-50/30 border border-amber-100 min-h-[100px] flex items-start gap-3">
                  <Info size={14} className="mt-1 text-amber-600 shrink-0" />
                  <p className="text-xs font-bold leading-relaxed text-amber-900/70 italic">
                    {order.notes || "No special instructions or customer notes for this order."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-6 bg-muted/30 border-t border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Order Verification Successful</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Finding Moto Ops v2.4</p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}