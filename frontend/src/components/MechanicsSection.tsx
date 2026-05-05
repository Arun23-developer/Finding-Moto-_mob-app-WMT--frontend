import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, User } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { resolveMediaUrl } from "@/lib/imageUrl";

type PublicGarage = {
  _id: string;
  name: string;
  specialization?: string;
  experienceYears?: number;
  avatar?: string | null;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
};

type PublicMechanicsResponse = {
  success: boolean;
  data: PublicGarage[];
};

const MechanicsSection = () => {
  const [items, setItems] = useState<PublicGarage[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: res } = await api.get<PublicMechanicsResponse>("/public/mechanics");
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
    <section id="mechanics" className="section-padding bg-surface">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Trusted <span className="text-gradient">Mechanics</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Verified professionals ready to take care of your ride.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.slice(0, 4).map((m, i) => {
            const rating = typeof m.rating === "number" ? m.rating : 0;
            const avatarUrl = m.avatar ? resolveMediaUrl(m.avatar, "") : "";

            return (
              <motion.div
                key={m._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.1, 0.3) }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all text-center"
              >
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-heading font-semibold text-lg mb-1 truncate">{m.name}</h3>
                <p className="text-sm text-primary font-medium mb-1">{m.specialization || "General Service"}</p>
                <p className="text-sm text-muted-foreground mb-3">
                  {m.experienceYears ? `${m.experienceYears} Years` : "—"} Experience
                </p>
                <div className="flex items-center justify-center gap-1 text-primary text-sm mb-4">
                  <Star className="h-4 w-4 fill-current" /> {rating}
                </div>
                <Link
                  to={`/mechanic/${m._id}`}
                  className="block w-full py-2.5 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  View Profile
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MechanicsSection;
