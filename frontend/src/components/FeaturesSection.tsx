import { motion } from "framer-motion";
import { Brain, Search, MapPin, CalendarCheck, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Bike Recommendation",
    desc: "Get personalized bike suggestions based on your riding style.",
  },
  { icon: Search, title: "Smart Parts Finder", desc: "Find the right spare parts using our intelligent search." },
  { icon: MapPin, title: "Verified Mechanics", desc: "Locate trusted mechanics near you with verified reviews." },
  { icon: CalendarCheck, title: "Service Booking", desc: "Book bike servicing online with real-time slot availability." },
  { icon: Shield, title: "Secure Payments", desc: "Industry-grade encryption for all your transactions." },
];

const FeaturesSection = () => (
  <section className="section-padding">
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
          Why Choose <span className="text-gradient">FindingMoto</span>?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Smart features powered by AI to enhance your riding experience.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300 text-center"
          >
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-4 group-hover:neon-glow-orange transition-all">
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
