import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Star, 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronRight, 
  Filter,
  Package,
  ShoppingBag,
  Heart,
  ArrowUpDown,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

import api from "@/services/api";
import { formatLkr } from "@/lib/currency";
import { resolveProductImage } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";

type PublicProduct = {
  _id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  image?: string | null;
  images?: string[];
  stock?: number;
  inStock?: boolean;
};

type PublicProductsResponse = {
  success: boolean;
  data: PublicProduct[];
  filters: {
    categories: string[];
    brands: string[];
  };
  meta?: { page: number; limit: number; total: number; pages: number };
};

const Products = () => {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("All Brands");
  const [sort, setSort] = useState("popular");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [brands, setBrands] = useState<string[]>(["All Brands"]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get<PublicProductsResponse>("/public/products", {
        params: { 
          page: 1, 
          limit: 100, 
          sort,
          search: search || undefined,
          category: category !== "All" ? category : undefined,
          brand: brand !== "All Brands" ? brand : undefined,
          minPrice: priceRange[0],
          maxPrice: priceRange[1]
        },
      });

      if (data?.success) {
        setProducts(data.data);
        if (data.filters) {
          setCategories(data.filters.categories);
          setBrands(data.filters.brands);
        }
      }
    } catch (e) {
      setError("Failed to load products. Please try again.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, brand, sort, priceRange]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 400);
    return () => clearTimeout(timeout);
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      
      <div className="pt-28 pb-20 container mx-auto px-4 md:px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-3">
              <Package size={14} />
              <span>Premium Inventory</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
              Explore Our <span className="text-blue-600 italic">Marketplace</span>
            </h1>
            <p className="text-slate-500 max-w-xl font-medium leading-relaxed">
              Find genuine spare parts and accessories from certified dealers across the country. Quality guaranteed.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <Input 
                placeholder="Search parts, brands..." 
                className="pl-11 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="h-12 w-12 rounded-2xl md:hidden border-slate-200"
              onClick={() => setIsFilterOpen(true)}
            >
              <SlidersHorizontal size={18} />
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-24 h-fit">
            <div className="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 text-slate-900 font-black uppercase tracking-widest text-xs">
                <Filter size={14} className="text-blue-600" />
                <span>Filters</span>
              </div>

              <div className="space-y-8">
                {/* Category Filter */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                  <ScrollArea className="h-64 pr-4 -mr-4">
                    <div className="space-y-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={cn(
                            "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                            category === cat 
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Separator className="bg-slate-100" />

                {/* Price Range */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price Range</label>
                    <span className="text-xs font-black text-blue-600">LKR {priceRange[1].toLocaleString()}</span>
                  </div>
                  <Slider
                    defaultValue={[0, 50000]}
                    max={100000}
                    step={1000}
                    onValueChange={(val: number[]) => setPriceRange([priceRange[0], val[0]])}
                    className="py-4"
                  />
                </div>

                <Separator className="bg-slate-100" />

                {/* Brand Filter */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brand</label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold text-sm">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {brands.map((b) => (
                        <SelectItem key={b} value={b} className="font-bold text-sm">{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-red-500 hover:bg-red-50"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                    setBrand("All Brands");
                    setPriceRange([0, 50000]);
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sorting and Summary */}
            <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-sm font-bold text-slate-500">
                Found <span className="text-slate-900">{products.length}</span> Results
              </p>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <ArrowUpDown size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sort By</span>
                </div>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-9 w-40 rounded-lg border-slate-200 font-bold text-xs bg-slate-50/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="popular" className="font-bold text-xs">Popularity</SelectItem>
                    <SelectItem value="newest" className="font-bold text-xs">Newest First</SelectItem>
                    <SelectItem value="price_asc" className="font-bold text-xs">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc" className="font-bold text-xs">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-red-100 shadow-sm"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4 text-red-600">
                      <AlertCircle size={32} />
                    </div>
                    <p className="text-red-600 font-bold mb-4">{error}</p>
                    <Button variant="outline" onClick={() => fetchProducts()}>Try Again</Button>
                  </motion.div>
                ) : loading ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-32 space-y-4"
                  >
                    <div className="relative">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                      <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-blue-600/50" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Updating Catalog...</p>
                  </motion.div>
                ) : products.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-dashed border-slate-200"
                  >
                    <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
                      <ShoppingBag size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No matching parts found</h3>
                    <p className="text-slate-500 font-medium italic">Try adjusting your filters or search terms.</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key={`${category}-${brand}-${sort}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {products.map((product, i) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group"
                      >
                        <Link to={`/products/${product._id}`}>
                          <Card className="rounded-[2rem] border-slate-200 overflow-hidden bg-white hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500">
                            <div className="relative aspect-square overflow-hidden bg-slate-50">
                              <img
                                src={resolveProductImage(product)}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                loading="lazy"
                              />
                              
                              {/* Overlay Labels */}
                              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                <Badge className="bg-white/90 backdrop-blur-md text-blue-600 border-none px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm">
                                  {product.category?.split('/')[0] || "Parts"}
                                </Badge>
                                <button className="h-9 w-9 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white transition-all shadow-sm">
                                  <Heart size={16} />
                                </button>
                              </div>

                              {!product.inStock && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                                  <span className="text-white font-black uppercase tracking-[0.2em] text-xs rotate-[-10deg] border-2 border-white px-4 py-2 rounded-lg">Out of Stock</span>
                                </div>
                              )}
                            </div>
                            
                            <CardContent className="p-6">
                              <div className="flex items-center gap-1 text-amber-500 mb-3">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star 
                                    key={s} 
                                    size={10} 
                                    className={cn("fill-current", s > (product.rating || 0) && "text-slate-200 fill-slate-200")} 
                                  />
                                ))}
                                <span className="text-[10px] font-black text-slate-400 ml-1">({product.reviewCount || 0})</span>
                              </div>
                              
                              <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors truncate">
                                {product.name}
                              </h3>
                              
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                {product.brand || "Genuine Part"}
                              </p>
                              
                              <div className="flex items-center justify-between mt-auto">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Price</p>
                                  <p className="text-xl font-black text-slate-900">{formatLkr(product.price)}</p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/20 group-hover:shadow-blue-500/20">
                                  <ChevronRight size={20} />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Sheet Mockup */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed inset-y-0 right-0 z-[101] w-full max-w-xs overflow-y-auto bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900">Filters</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
                  <X size={20} />
                </Button>
              </div>
              
              {/* Reuse sidebar contents for mobile drawer */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="font-bold text-sm">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* ... other mobile filters could go here ... */}
                <Button 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Show Results
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Products;

