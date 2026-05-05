import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "+94", message: "" });
  const [sending, setSending] = useState(false);

  const handleNameChange = (value: string) => {
    setForm((prev) => ({ ...prev, name: value.replace(/[^A-Za-z\s.'-]/g, "") }));
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const withoutCountry = digits.startsWith("94") ? digits.slice(2) : digits;
    setForm((prev) => ({ ...prev, phone: `+94${withoutCountry.slice(0, 9)}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in Name, Email, and Message.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[A-Za-z\s.'-]+$/.test(form.name.trim())) {
      toast({
        title: "Invalid name",
        description: "Name can contain only letters and spaces.",
        variant: "destructive",
      });
      return;
    }

    if (form.phone !== "+94" && !/^\+94\d{9}$/.test(form.phone)) {
      toast({
        title: "Invalid phone number",
        description: "Phone number must start with +94 and contain 9 digits after it.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      await api.post("/public/contact", {
        ...form,
        phone: form.phone === "+94" ? "" : form.phone,
      });
      toast({ title: "Message sent", description: "Your message has been sent to admin." });
      setForm({ name: "", email: "", phone: "+94", message: "" });
    } catch (error: any) {
      toast({
        title: "Message not sent",
        description: error?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 section-padding">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Contact <span className="text-gradient">Us</span>
            </h1>
            <p className="text-muted-foreground mb-12">Have a question? We'd love to hear from you.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.form
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {[
                { key: "name", label: "Name *", type: "text", placeholder: "Your name" },
                { key: "email", label: "Email *", type: "email", placeholder: "your@email.com" },
                { key: "phone", label: "Phone", type: "tel", placeholder: "+94 771234567" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-2">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => {
                      if (field.key === "name") handleNameChange(e.target.value);
                      else if (field.key === "phone") handlePhoneChange(e.target.value);
                      else setForm({ ...form, [field.key]: e.target.value });
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    maxLength={field.key === "name" ? 100 : field.key === "email" ? 255 : 20}
                    inputMode={field.key === "phone" ? "tel" : undefined}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <textarea
                  rows={5}
                  placeholder="Tell us what you need..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity neon-glow-orange"
              >
                <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Message"}
              </button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                {[
                  { icon: Mail, label: "support@motomindai.com" },
                  { icon: Phone, label: "+94 77 123 4567" },
                  { icon: MapPin, label: "Nallur North, Jaffna" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
