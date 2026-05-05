import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Package, RefreshCw } from "lucide-react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AddProductSection } from "./components/AddProductSection";
import { ProductDetailsModal } from "./components/ProductDetailsModal";
import { ProductsTable } from "./components/ProductsTable";
import { ProductsToolbar } from "./components/ProductsToolbar";
import { StatusFilterBar } from "./components/StatusFilterBar";
import {
  type ProductFormValues,
  type ProductListMeta,
  type SellerProduct,
} from "./components/productTypes";

const FETCH_LIMIT = 100;
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const PRODUCT_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "enabled", label: "Enable" },
  { value: "disabled", label: "Disable" },
  { value: "out_of_stock", label: "Out Of Stock" },
];

const getProductFilterKey = (product: SellerProduct): "enabled" | "disabled" | "out_of_stock" => {
  if (product.productStatus === "DISABLED") {
    return "disabled";
  }

  if ((product.stock ?? 0) <= 0) {
    return "out_of_stock";
  }

  return "enabled";
};

export default function SellerProducts() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<SellerProduct | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim().toLowerCase());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let ignore = false;

    const fetchAllProducts = async () => {
      try {
        setError("");
        setLoading(true);

        const collected: SellerProduct[] = [];
        let nextPage = 1;
        let totalPages = 1;

        while (nextPage <= totalPages) {
          const { data } = await api.get("/products", {
            params: { page: nextPage, limit: FETCH_LIMIT },
          });

          const batch = Array.isArray(data?.data) ? data.data : [];
          collected.push(...batch);

          totalPages = data?.meta?.pages ?? 1;
          nextPage += 1;
        }

        if (ignore) return;

        setProducts(collected.filter((product) => product.type !== "service"));
      } catch {
        if (ignore) return;
        setProducts([]);
        setError("Failed to load products.");
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchAllProducts();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const counts = useMemo(() => {
    const totals = {
      all: products.length,
      enabled: 0,
      disabled: 0,
      out_of_stock: 0,
    };

    products.forEach((product) => {
      const status = getProductFilterKey(product);
      totals[status] += 1;
    });

    return totals;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesStatus = statusFilter === "all" || getProductFilterKey(product) === statusFilter;
      const matchesSearch =
        !searchQuery ||
        (product.name || "").toLowerCase().includes(searchQuery) ||
        (product.brand || "").toLowerCase().includes(searchQuery) ||
        (product.sku || product._id || "").toLowerCase().includes(searchQuery) ||
        (product.category || "").toLowerCase().includes(searchQuery);

      return matchesStatus && matchesSearch;
    });
  }, [products, searchQuery, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  const pageMeta: ProductListMeta = useMemo(() => {
    const total = filteredProducts.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pages);

    return {
      page: safePage,
      limit: pageSize,
      total,
      pages,
    };
  }, [filteredProducts.length, page, pageSize]);

  const paginatedProducts = useMemo(() => {
    const start = (pageMeta.page - 1) * pageMeta.limit;
    return filteredProducts.slice(start, start + pageMeta.limit);
  }, [filteredProducts, pageMeta.limit, pageMeta.page]);

  const handleRefresh = () => {
    setRefreshing(true);
    setReloadKey((current) => current + 1);
  };

  const handleOpenAdd = () => {
    setSubmitError("");
    setEditingProduct(null);
    setIsAddOpen(true);
  };

  const handleEdit = (product: SellerProduct) => {
    setSubmitError("");
    setEditingProduct(product);
    setIsAddOpen(true);
  };

  const handleSubmit = async (values: ProductFormValues) => {
    const price = Number(values.actualPrice);
    const stock = Number(values.stock);
    const originalPrice = values.discountPrice.trim() ? Number(values.discountPrice) : undefined;

    if (!values.name.trim()) {
      setSubmitError("Product name is required.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setSubmitError("Product price must be 0 or greater.");
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setSubmitError("Product stock must be 0 or greater.");
      return;
    }
    if (originalPrice !== undefined && (!Number.isFinite(originalPrice) || originalPrice < 0)) {
      setSubmitError("Original price must be 0 or greater.");
      return;
    }

    const payload = {
      name: values.name.trim(),
      sku: values.sku.trim(),
      price,
      originalPrice,
      stock,
      category: values.category.trim(),
      brand: values.brand.trim(),
      description: values.description.trim(),
      status: values.status,
      productStatus: values.visibilityStatus,
      images: values.images ?? [],
    };

    setSubmitError("");
    setSubmitting(true);

    try {
      if (editingProduct?._id) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setEditingProduct(null);
      setIsAddOpen(false);
      setRefreshing(true);
      setReloadKey((current) => current + 1);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Unable to save the product right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (product: SellerProduct) => {
    if (!product._id) return;

    setError("");
    setTogglingProductId(product._id);

    try {
      const nextProductStatus = product.productStatus === "DISABLED" ? "ENABLED" : "DISABLED";
      await api.put(`/products/${product._id}`, { productStatus: nextProductStatus });
      setProducts((current) =>
        current.map((item) =>
          item._id === product._id ? { ...item, productStatus: nextProductStatus } : item,
        ),
      );
      if (editingProduct?._id === product._id) {
        setEditingProduct((current) => (current ? { ...current, productStatus: nextProductStatus } : current));
      }
      if (selectedProduct?._id === product._id) {
        setSelectedProduct((current) => (current ? { ...current, productStatus: nextProductStatus } : current));
      }
    } catch {
      setError("Unable to update product visibility.");
    } finally {
      setTogglingProductId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct?._id) {
      setDeleteProduct(null);
      return;
    }

    setError("");

    try {
      await api.delete(`/products/${deleteProduct._id}`);
      setProducts((current) => current.filter((item) => item._id !== deleteProduct._id));
      if (selectedProduct?._id === deleteProduct._id) {
        setSelectedProduct(null);
      }
      if (editingProduct?._id === deleteProduct._id) {
        setEditingProduct(null);
        setIsAddOpen(false);
      }
      setDeleteProduct(null);
    } catch {
      setError("Unable to delete product.");
      setDeleteProduct(null);
    }
  };

  const renderLoadingState = () => (
    <Card className="glass-card">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-sm text-muted-foreground">
          Manage your seller product catalog with search, filters, and product details.
        </p>
      </div>

      <ProductsToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        onAddProduct={handleOpenAdd}
      />

      <div className="flex flex-col gap-4">
        <StatusFilterBar
          activeFilter={statusFilter}
          counts={counts}
          onChange={setStatusFilter}
          options={PRODUCT_FILTER_OPTIONS}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Total visible products: {pageMeta.total}</span>
            <span>|</span>
            <span>
              Page {pageMeta.page} of {pageMeta.pages}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" onClick={handleRefresh} disabled={refreshing || loading}>
              <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
            <select
              value={String(pageSize)}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-[140px]"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} / page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? renderLoadingState() : null}

      {!loading && error ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <AlertCircle className="mb-3 h-8 w-8 text-destructive" />
          <p className="font-medium">{error}</p>
          <Button type="button" variant="outline" className="mt-3" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      ) : null}

      {!loading && !error && pageMeta.total === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center text-muted-foreground">
            <Package className="h-10 w-10" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">No products found</p>
              <p className="text-sm">Adjust your filters or add a new product to get started.</p>
            </div>
            <Button type="button" onClick={handleOpenAdd}>
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error && pageMeta.total > 0 ? (
        <div className="space-y-4">
          <ProductsTable
            products={paginatedProducts}
            togglingProductId={togglingProductId}
            onViewDetails={setSelectedProduct}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={setDeleteProduct}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(pageMeta.page - 1) * pageMeta.limit + 1}-{Math.min(pageMeta.page * pageMeta.limit, pageMeta.total)} of {pageMeta.total} products
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={pageMeta.page <= 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((current) => Math.min(pageMeta.pages, current + 1))}
                disabled={pageMeta.page >= pageMeta.pages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ProductDetailsModal
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
      />

      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setEditingProduct(null);
            setSubmitError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <AddProductSection
            product={editingProduct}
            submitting={submitting}
            submitError={submitError}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteProduct)}
        onOpenChange={(open) => {
          if (!open) setDeleteProduct(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteProduct(null)}>
              No
            </Button>
            <Button type="button" onClick={handleDelete}>
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
