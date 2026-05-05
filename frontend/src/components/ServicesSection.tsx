import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Cog, Disc3, Loader2, Paintbrush, Plug, Wrench } from "lucide-react";
import api from "@/services/api";

type PublicService = {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  price?: number;
};

type PublicServicesResponse = {
  success: boolean;
  data: PublicService[];
};

const iconForCategory = (category?: string) => {
  const value = (category || "").toLowerCase();
  if (value.includes("engine")) return Cog;
  if (value.includes("brake") || value.includes("suspension")) return Disc3;
  if (value.includes("electric") || value.includes("wiring") || value.includes("ecu")) return Plug;
  if (value.includes("custom") || value.includes("paint")) return Paintbrush;
  return Wrench;
};

const ServicesSection = () => {
  const [items, setItems] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get<PublicServicesResponse>("/public/services");
        if (!cancelled) {
          setItems(Array.isArray(res?.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const topFive = useMemo(() => items.slice(0, 5), [items]);

  return (
    <section id="services" className="section-padding">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Our <span className="text-gradient">Services</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Complete bike care from certified professionals.</p>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center text-muted-foreground mb-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2">Loading services...</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {topFive.map((s, i) => {
            const Icon = iconForCategory(s.category);
            return (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.1, 0.3) }}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-secondary/40 transition-all text-center"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-secondary/40 text-foreground mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold mb-2">{s.name}</h3>
                <p className="text-sm text-muted-foreground">{s.description || s.category || "Service"}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
