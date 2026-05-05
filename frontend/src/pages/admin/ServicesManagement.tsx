import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Wrench, Loader2, AlertCircle, RefreshCw, Clock } from "lucide-react";
import api from "@/services/api";

interface Service {
  _id: string;
  name: string;
  description: string;
  category: string;
  duration: string;
  price: number;
  active: boolean;
  mechanic:
    | {
        firstName?: string;
        lastName?: string;
        workshopName?: string;
      }
    | null;
}

export default function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchServices = useCallback(async () => {
    try {
      setError("");
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get("/admin/services", { params });
      if (data.success) setServices(data.data || []);
    } catch {
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchServices, 300);
    return () => clearTimeout(timer);
  }, [fetchServices]);

  const totalCount = services.length;
  const activeCount = services.filter((s) => s.active).length;
  const inactiveCount = services.filter((s) => !s.active).length;
  const categoryCount = new Set(services.map((s) => s.category)).size;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
        <p className="text-sm font-medium">Loading services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-3 text-red-500" />
        <p className="font-medium">{error}</p>
        <button onClick={fetchServices} className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Service Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all mechanic service listings</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Services", value: totalCount },
          { label: "Active Services", value: activeCount },
          { label: "Inactive Services", value: inactiveCount },
          { label: "Categories", value: categoryCount },
        ].map((s) => (
          <Card key={s.label} className="glass-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-display font-bold mt-1">{s.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-border">
                  <th className="text-left py-3 font-medium">Service</th>
                  <th className="text-left py-3 font-medium">Category</th>
                  <th className="text-left py-3 font-medium">Duration</th>
                  <th className="text-left py-3 font-medium">Price</th>
                  <th className="text-left py-3 font-medium">Mechanic</th>
                  <th className="text-left py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <Wrench className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No services found</p>
                    </td>
                  </tr>
                ) : (
                  services.map((service) => {
                    const mechanicName = `${service.mechanic?.firstName || ""} ${service.mechanic?.lastName || ""}`.trim();
                    const mechanicLabel = service.mechanic?.workshopName || mechanicName || "-";

                    return (
                      <tr key={service._id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{service.description || "No description"}</p>
                          </div>
                        </td>
                        <td className="py-3">{service.category}</td>
                        <td className="py-3">
                          <div className="inline-flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{service.duration}</span>
                          </div>
                        </td>
                        <td className="py-3 font-semibold">LKR {service.price.toLocaleString()}</td>
                        <td className="py-3 text-muted-foreground">{mechanicLabel}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              service.active
                                ? "bg-green-500/15 text-green-600 border-green-500/20"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {service.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
