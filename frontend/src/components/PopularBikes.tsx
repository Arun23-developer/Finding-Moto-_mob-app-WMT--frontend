import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { formatLkr } from "@/lib/currency";
import { resolveProductImage } from "@/lib/imageUrl";

type TrendingProduct = {
  _id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  image?: string | null;
  images?: string[];
  inStock?: boolean;
};

type TrendingProductsResponse = { success: boolean; data: TrendingProduct[] };

const PopularBikes = () => {
  const [items, setItems] = useState<TrendingProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: res } = await api.get<TrendingProductsResponse>("/public/products/trending");
        if (!cancelled) {
          setItems(Array.isArray(res?.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) setItems([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section-padding bg-surface">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-2">
              Popular <span className="text-gradient">Products</span>
            </h2>
            <p className="text-muted-foreground">Trending items from our marketplace</p>
          </div>
          <Link
            to="/products"
            className="hidden md:inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.slice(0, 6).map((product, i) => {
            const imgUrl = resolveProductImage(product, undefined);
            const rating = typeof product.rating === "number" ? product.rating : 0;
            const categoryLabel = product.category || "Product";

            return (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.08, 0.25) }}
              >
                <Link
                  to={`/products/${product._id}`}
                  className="group block rounded-2xl bg-card border border-border hover:border-primary/30 overflow-hidden transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold">
                      {categoryLabel}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <h3 className="font-heading font-semibold text-lg truncate">{product.name}</h3>
                      <div className="flex items-center gap-1 text-primary text-sm shrink-0">
                        <Star className="h-3.5 w-3.5 fill-current" /> {rating}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                      {product.brand ? `${product.brand} • ` : ""}
                      {product.inStock === false ? "Out of stock" : "In stock"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-heading font-bold text-primary">
                        {formatLkr(product.price)}
                      </span>
                      <span className="text-sm text-accent font-medium group-hover:underline">View Details →</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PopularBikes;
