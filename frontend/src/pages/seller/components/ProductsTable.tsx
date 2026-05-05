import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit2, Power, Trash2, Package, RefreshCw } from "lucide-react";
import { resolveMediaUrl } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";
import type { SellerProduct } from "./productTypes";

interface ProductsTableProps {
  products: SellerProduct[];
  togglingProductId: string | null;
  onViewDetails: (product: SellerProduct) => void;
  onEdit: (product: SellerProduct) => void;
  onToggleStatus: (product: SellerProduct) => void;
  onDelete: (product: SellerProduct) => void;
}

export function ProductsTable({
  products,
  togglingProductId,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onDelete,
}: ProductsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30 text-left">
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Product Details</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Inventory</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Price Info</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Status</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {products.map((product) => (
              <tr key={product._id} className="group hover:bg-muted/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg border border-border/40 bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {product.images && product.images[0] ? (
                        <img 
                          src={resolveMediaUrl(product.images[0])} 
                          alt={product.name} 
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate group-hover:text-blue-600 transition-colors">{product.name || "Unnamed Product"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">{product.brand || "No Brand"}</span>
                        <span className="text-[10px] text-muted-foreground/60">SKU: {product.sku || product._id.slice(-8).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <span className={`text-sm font-bold ${(product.stock ?? 0) <= 5 ? "text-red-600" : "text-foreground"}`}>
                      {product.stock ?? 0} <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Units</span>
                    </span>
                    {(product.stock ?? 0) <= 5 && (
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">Low Stock</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground">LKR {(product.price || 0).toLocaleString()}</span>
                    {product.originalPrice && product.originalPrice > (product.price || 0) && (
                      <span className="text-[10px] text-muted-foreground line-through decoration-red-400/40 decoration-1">LKR {product.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge 
                    variant={product.productStatus === "ENABLED" ? "default" : "secondary"}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 border-none",
                      product.productStatus === "ENABLED" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {product.productStatus === "ENABLED" ? "Active" : "Hidden"}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all"
                      onClick={() => onViewDetails(product)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-all"
                      onClick={() => onEdit(product)}
                      title="Edit Product"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "h-8 w-8 rounded-lg transition-all",
                        product.productStatus === "ENABLED" 
                          ? "text-muted-foreground hover:text-red-600 hover:bg-red-50" 
                          : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                      )}
                      onClick={() => onToggleStatus(product)}
                      disabled={togglingProductId === product._id}
                      title={product.productStatus === "ENABLED" ? "Deactivate" : "Activate"}
                    >
                      {togglingProductId === product._id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
                      onClick={() => onDelete(product)}
                      title="Delete Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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