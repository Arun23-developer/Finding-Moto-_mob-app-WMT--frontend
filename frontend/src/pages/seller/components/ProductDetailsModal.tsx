import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Tag, 
  BarChart3, 
  Info, 
  DollarSign, 
  Layers, 
  Eye, 
  Image as ImageIcon,
  Truck
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { resolveMediaUrl } from "@/lib/imageUrl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { SellerProduct } from "./productTypes";

interface ProductDetailsModalProps {
  product: SellerProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailsModal({ product, open, onOpenChange }: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 border-none shadow-2xl">
        <ScrollArea className="max-h-[90vh]">
          {/* Hero Image Section */}
          <div className="relative h-64 w-full bg-muted flex items-center justify-center overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img 
                src={resolveMediaUrl(product.images[0])} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                <ImageIcon size={64} />
                <span className="text-xs font-bold uppercase tracking-widest">No Image Available</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-600 border-none text-[10px] font-black uppercase tracking-widest px-2.5 py-1 shadow-lg">
                  {product.category || "General"}
                </Badge>
                {product.brand && (
                  <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 shadow-lg">
                    {product.brand}
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-black text-white leading-tight tracking-tight drop-shadow-md truncate">
                {product.name}
              </h2>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">SKU Identification</p>
                <code className="text-sm font-mono font-bold bg-muted px-3 py-1 rounded-lg border border-border/40 text-blue-600">
                  {product.sku || product._id.slice(-12).toUpperCase()}
                </code>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Stock Level</p>
                  <p className={cn("text-lg font-black", (product.stock || 0) <= 5 ? "text-red-600" : "text-emerald-600")}>
                    {product.stock || 0} Units
                  </p>
                </div>
                <Separator orientation="vertical" className="h-10 mx-2 hidden md:block" />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Current Status</p>
                  <Badge 
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest border-none px-3 py-1",
                      product.productStatus === "ENABLED" ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-slate-400"
                    )}
                  >
                    {product.productStatus === "ENABLED" ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="bg-border/40" />

            {/* Price Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 p-6 rounded-2xl bg-blue-600/5 border border-blue-100 flex flex-col items-center justify-center text-center group transition-all hover:bg-blue-600/10">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-3 shadow-lg group-hover:scale-110 transition-transform">
                  <DollarSign size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/60 mb-1">Selling Price</p>
                <p className="text-2xl font-black text-blue-700">LKR {(product.price || 0).toLocaleString()}</p>
                {product.originalPrice && product.originalPrice > (product.price || 0) && (
                  <p className="text-xs text-muted-foreground line-through mt-1 decoration-red-400">LKR {product.originalPrice.toLocaleString()}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="h-4 w-4 text-blue-600" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Specifications</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Layers size={10} /> Category
                      </span>
                      <span className="text-xs font-black text-foreground">{product.category || "N/A"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Tag size={10} /> Brand
                      </span>
                      <span className="text-xs font-black text-foreground">{product.brand || "Generic"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart3 size={10} /> Type
                      </span>
                      <span className="text-xs font-black text-foreground uppercase tracking-widest">{product.type || "Product"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Truck size={10} /> Logistics Status
                      </span>
                      <span className="text-xs font-black text-foreground uppercase tracking-widest">{product.status || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Product Description</h3>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/40 min-h-[100px]">
                    <p className="text-xs leading-relaxed text-muted-foreground font-medium italic">
                      {product.description || "Detailed description was not provided for this catalog item."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Image Gallery</h3>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {product.images.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-border/40 group hover:border-blue-400 transition-all cursor-zoom-in shadow-sm">
                      <img 
                        src={resolveMediaUrl(img)} 
                        alt={`${product.name} ${idx + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer Footer */}
          <div className="p-6 bg-muted/20 border-t border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Visibility: {product.productStatus === "ENABLED" ? "Public Storefront" : "Hidden Listing"}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Finding Moto Catalog v1.0</p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}