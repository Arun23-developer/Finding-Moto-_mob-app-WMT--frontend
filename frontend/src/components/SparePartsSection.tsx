import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";

type PublicProduct = {
  _id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
};

type PublicProductsResponse = { success: boolean; data: PublicProduct[] };

const SparePartsSection = () => {
  const [items, setItems] = useState<PublicProduct[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: res } = await api.get<PublicProductsResponse>("/public/products", {
          params: { page: 1, limit: 6, sort: "popular" },
        });
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
    <section id="spare-parts" className="section-padding">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Spare Parts <span className="text-gradient">Marketplace</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Genuine parts from verified sellers at competitive prices.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((part, i) => (
            <motion.div
              key={part._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.05, 0.25) }}
              className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-secondary/30 transition-all"
            >
              <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-secondary/40 flex items-center justify-center text-foreground">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-sm truncate">{part.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {(part.brand || "Brand") + " · " + (part.category || "Category")}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-heading font-bold text-primary">LKR {Number(part.price || 0).toLocaleString()}</p>
                <button
                  type="button"
                  disabled={busyId === part._id}
                  onClick={async () => {
                    if (!user) {
                      toast({
                        variant: "destructive",
                        title: "Sign in required",
                        description: "Please sign in as a buyer to add items to your cart.",
                      });
                      navigate("/login");
                      return;
                    }

                    if (user.role !== "buyer") {
                      toast({
                        variant: "destructive",
                        title: "Buyer account required",
                        description: "Please switch to a buyer account to add items to your cart.",
                      });
                      return;
                    }

                    try {
                      setBusyId(part._id);
                      const result = await addToCart({ productId: part._id, quantity: 1 });
                      toast({ title: "Added to cart", description: result.message });
                    } catch (e: any) {
                      toast({
                        variant: "destructive",
                        title: "Unable to add to cart",
                        description: e?.response?.data?.message || "Please try again.",
                      });
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  className="text-xs text-primary font-semibold hover:underline mt-1 disabled:opacity-60"
                >
                  {busyId === part._id ? "Adding..." : "Add to Cart"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SparePartsSection;
