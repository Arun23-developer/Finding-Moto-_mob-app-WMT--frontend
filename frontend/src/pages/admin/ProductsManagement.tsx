import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Package, Loader2, AlertCircle, RefreshCw, ImageIcon } from "lucide-react";
import api from "@/services/api";
import { resolveMediaUrl } from "@/lib/imageUrl";

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  status: string;
  images: string[];
  seller: { firstName: string; lastName: string; shopName?: string } | null;
}

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setError("");
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const { data } = await api.get("/admin/products", { params });
      if (data.success) setProducts(data.data || []);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const totalCount = products.length;
  const inStockCount = products.filter((p) => p.status === "active").length;
  const outOfStockCount = products.filter((p) => p.status === "out_of_stock").length;
  const categoryCount = new Set(products.map((p) => p.category)).size;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
        <p className="text-sm font-medium">Loading products…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-3 text-red-500" />
        <p className="font-medium">{error}</p>
        <button onClick={fetchProducts} className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Product Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage auto parts and services listings</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Products</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">{totalCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">In Stock</p>
            <p className="text-3xl font-bold mt-2 text-green-600">{inStockCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Out of Stock</p>
            <p className="text-3xl font-bold mt-2 text-red-600">{outOfStockCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categories</p>
            <p className="text-3xl font-bold mt-2 text-purple-600">{categoryCount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Product Inventory</h2>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-border">
                  <th className="text-left py-3 font-medium">Product</th>
                  <th className="text-left py-3 font-medium">SKU</th>
                  <th className="text-left py-3 font-medium">Price</th>
                  <th className="text-left py-3 font-medium">Stock</th>
                  <th className="text-left py-3 font-medium">Shop</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No products found</p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                            {product.images?.[0] ? (
                              <img src={resolveMediaUrl(product.images[0], "https://placehold.co/80x80?text=Item")} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                      <td className="py-3 font-semibold">LKR {product.price.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={product.stock === 0 ? "text-destructive font-medium" : "text-foreground"}>
                          {product.stock === 0 ? "Out of stock" : product.stock}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {product.seller?.shopName || `${product.seller?.firstName || ""} ${product.seller?.lastName || ""}`.trim() || "—"}
                      </td>
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
