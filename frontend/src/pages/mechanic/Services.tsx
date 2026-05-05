import { useEffect, useMemo, useRef, useState } from "react";
import { 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Upload, 
  Wrench, 
  X, 
  Plus, 
  Search, 
  Filter, 
  Image as ImageIcon, 
  Info,
  Power,
  Edit2,
  Layers,
  Clock,
  LayoutGrid
} from "lucide-react";
import api from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { resolveMediaUrl } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type ServiceStatus = "ENABLED" | "DISABLED";

interface MechanicService {
  _id: string;
  name?: string;
  price?: number;
  originalPrice?: number;
  active?: boolean;
  productStatus?: ServiceStatus;
  description?: string;
  duration?: string;
  category?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface ServiceFormValues {
  name: string;
  actualPrice: string;
  discountPrice: string;
  duration: string;
  category: string;
  status: ServiceStatus;
  description: string;
  images: string[];
}

type FormErrors = Partial<Record<"name" | "actualPrice" | "discountPrice", string>>;

interface AddServiceSectionProps {
  service: MechanicService | null;
  submitting: boolean;
  submitError: string;
  onSubmit: (values: ServiceFormValues) => Promise<void>;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const CATEGORY_OPTIONS = [
  "engine_system",
  "fuel_system",
  "air_intake_system",
  "ignition_system",
  "cooling_system",
  "lubrication_system",
  "exhaust_system",
  "transmission_system",
  "starting_system",
  "charging_system",
  "electrical_system",
  "braking_system",
  "suspension_system",
  "steering_system",
  "wheel_system",
  "chassis_system",
  "body_system",
  "lighting_system",
  "safety_system",
  "accessories_system",
] as const;

const MAX_SERVICE_IMAGES = 5;

const DEFAULT_SERVICE_FORM_VALUES: ServiceFormValues = {
  name: "",
  actualPrice: "",
  discountPrice: "",
  duration: "",
  category: CATEGORY_OPTIONS[0],
  status: "ENABLED",
  description: "",
  images: [],
};

function formatCurrency(value?: number) {
  return `LKR ${(value || 0).toLocaleString()}`;
}

function getFormValues(service: MechanicService | null): ServiceFormValues {
  return {
    name: service?.name ?? "",
    actualPrice: typeof service?.price === "number" ? String(service.price) : "",
    discountPrice: typeof service?.originalPrice === "number" ? String(service.originalPrice) : "",
    duration: service?.duration ?? "",
    category: service?.category ?? CATEGORY_OPTIONS[0],
    status: service?.productStatus === "DISABLED" ? "DISABLED" : "ENABLED",
    description: service?.description ?? "",
    images: service?.images ?? [],
  };
}

function readServiceForm(form: HTMLFormElement, existingImages: string[] = []): ServiceFormValues {
  const formData = new FormData(form);
  const status = formData.get("status") === "DISABLED" ? "DISABLED" : "ENABLED";

  return {
    name: String(formData.get("name") || "").trim(),
    actualPrice: String(formData.get("actualPrice") || "").trim(),
    discountPrice: String(formData.get("discountPrice") || "").trim(),
    duration: String(formData.get("duration") || "").trim(),
    category: String(formData.get("category") || CATEGORY_OPTIONS[0]),
    status,
    description: String(formData.get("description") || "").trim(),
    images: existingImages,
  };
}

export default function MechanicServices() {
  const [services, setServices] = useState<MechanicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<MechanicService | null>(null);
  const [deleteService, setDeleteService] = useState<MechanicService | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [serviceImageUrlInput, setServiceImageUrlInput] = useState("");
  const [uploadingServiceImages, setUploadingServiceImages] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim().toLowerCase());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setError("");
        setLoading(true);
        const { data } = await api.get("/mechanic/services");
        setServices(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setError("Failed to load your service catalog.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    fetchServices();
  }, [reloadKey]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const status = service.productStatus === "DISABLED" ? "DISABLED" : "ENABLED";
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        (service.name || "").toLowerCase().includes(searchQuery) ||
        (service.category || "").toLowerCase().includes(searchQuery);
      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, services, statusFilter]);

  const paginatedServices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredServices.slice(start, start + pageSize);
  }, [filteredServices, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));

  const handleRefresh = () => {
    setRefreshing(true);
    setReloadKey((c) => c + 1);
  };

  const openAddDialog = () => {
    setSubmitError("");
    setEditingService(null);
    setFormImages([]);
    setServiceImageUrlInput("");
    setIsAddOpen(true);
  };

  const openEditDialog = (service: MechanicService) => {
    setSubmitError("");
    setEditingService(service);
    setFormImages(service.images ?? []);
    setServiceImageUrlInput("");
    setIsAddOpen(true);
  };

  const handleAddServiceImageUrl = () => {
    const url = serviceImageUrlInput.trim();
    if (!url) return;
    if (formImages.length >= MAX_SERVICE_IMAGES) {
      alert(`Maximum ${MAX_SERVICE_IMAGES} photos allowed`);
      return;
    }

    setFormImages((current) => [...current, url].slice(0, MAX_SERVICE_IMAGES));
    setServiceImageUrlInput("");
  };

  const handleServiceImageUpload = async (files: FileList | null) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    const availableSlots = MAX_SERVICE_IMAGES - formImages.length;
    if (availableSlots <= 0) {
      alert(`Maximum ${MAX_SERVICE_IMAGES} photos allowed`);
      return;
    }

    setUploadingServiceImages(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles.slice(0, availableSlots)) {
        const formData = new FormData();
        formData.append("image", file);
        const { data } = await api.post("/mechanic/services/upload-image", formData);
        const url = data?.data?.url;
        if (url) uploadedUrls.push(url);
      }

      setFormImages((current) => [...current, ...uploadedUrls].slice(0, MAX_SERVICE_IMAGES));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Service image upload failed.");
    } finally {
      setUploadingServiceImages(false);
    }
  };

  const handleRemoveServiceImage = (index: number) => {
    setFormImages((current) => current.filter((_, i) => i !== index));
  };

  const handleToggleVisibility = async (service: MechanicService) => {
    setTogglingServiceId(service._id);
    try {
      const nextStatus = service.productStatus === "DISABLED" ? "ENABLED" : "DISABLED";
      await api.put(`/mechanic/services/${service._id}`, {
        productStatus: nextStatus,
        active: nextStatus === "ENABLED",
      });
      setServices(prev => prev.map(s => s._id === service._id ? { ...s, productStatus: nextStatus, active: nextStatus === "ENABLED" } : s));
    } catch {
      alert("Visibility update failed.");
    } finally {
      setTogglingServiceId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteService) return;
    try {
      await api.delete(`/mechanic/services/${deleteService._id}`);
      setServices(prev => prev.filter(s => s._id !== deleteService._id));
      setDeleteService(null);
    } catch {
      alert("Deletion failed.");
    }
  };

  const handleFormSubmit = async (values: ServiceFormValues) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const price = Number(values.actualPrice);
      const originalPrice = values.discountPrice ? Number(values.discountPrice) : undefined;

      if (!values.name) {
        setSubmitError("Service name is required.");
        return;
      }
      if (!values.duration) {
        setSubmitError("Service duration is required.");
        return;
      }
      if (!Number.isFinite(price) || price < 0) {
        setSubmitError("Service price must be 0 or greater.");
        return;
      }
      if (originalPrice !== undefined && (!Number.isFinite(originalPrice) || originalPrice < 0)) {
        setSubmitError("Original price must be 0 or greater.");
        return;
      }

      const payload = {
        name: values.name,
        description: values.description,
        duration: values.duration,
        category: values.category,
        images: values.images,
        price,
        originalPrice,
        active: values.status === "ENABLED",
        productStatus: values.status,
      };
      
      if (editingService) {
        await api.put(`/mechanic/services/${editingService._id}`, payload);
      } else {
        await api.post("/mechanic/services", payload);
      }
      
      setReloadKey(c => c + 1);
      setIsAddOpen(false);
      setEditingService(null);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Service operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <Wrench size={32} className="text-blue-600" />
             Service Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium italic">Manage the professional services listed in your workshop.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={handleRefresh} className="h-11 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest border-border/60">
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              <span>Refresh</span>
           </Button>
           <Button onClick={openAddDialog} className="h-11 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
              <Plus size={16} />
              <span>New Service</span>
           </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="glass-card border-border/40 p-4 shadow-sm">
         <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="relative flex-1 group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
               <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search service name or category..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
               />
            </div>
            <div className="flex gap-1.5">
               {["all", "ENABLED", "DISABLED"].map(f => (
                  <button
                     key={f}
                     onClick={() => setStatusFilter(f)}
                     className={cn(
                        "whitespace-nowrap rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all border",
                        statusFilter === f ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-background border-border/60 text-muted-foreground hover:border-blue-500/40"
                     )}
                  >
                     {f === "all" ? "All Services" : f === "ENABLED" ? "Public" : "Hidden"}
                  </button>
               ))}
            </div>
         </div>
      </Card>

      {/* Table */}
      <Card className="glass-card border-border/40 overflow-hidden shadow-sm">
         <CardContent className="p-0">
            <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead>
                     <tr className="bg-muted/20 border-b border-border/20 text-left">
                        <th className="px-6 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Service Details</th>
                        <th className="px-6 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Billing</th>
                        <th className="px-6 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em] text-center">Visibility</th>
                        <th className="px-6 py-4 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em] text-right">Operations</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                     {loading ? (
                        [1,2,3].map(i => (
                           <tr key={i} className="animate-pulse">
                              <td colSpan={4} className="h-16 px-6 bg-muted/5"></td>
                           </tr>
                        ))
                     ) : paginatedServices.length === 0 ? (
                        <tr>
                           <td colSpan={4} className="py-24 text-center">
                              <LayoutGrid size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">No services found in this category</p>
                           </td>
                        </tr>
                     ) : paginatedServices.map(service => (
                        <tr key={service._id} className="group hover:bg-muted/30 transition-all">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-center overflow-hidden shrink-0 group-hover:bg-white transition-colors">
                                    {service.images?.[0] ? (
                                       <img src={resolveMediaUrl(service.images[0])} alt={service.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    ) : (
                                       <Wrench size={20} className="text-muted-foreground/40" />
                                    )}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="font-bold text-foreground truncate group-hover:text-blue-600 transition-colors">{service.name}</p>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5 mt-1">
                                       <Layers size={10} /> {service.category?.replace("_", " ")}
                                    </span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex flex-col">
                                 <span className="font-black text-foreground">{formatCurrency(service.price)}</span>
                                 {service.originalPrice && service.originalPrice > (service.price || 0) && (
                                    <span className="text-[10px] text-muted-foreground line-through decoration-red-400">LKR {service.originalPrice.toLocaleString()}</span>
                                 )}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <Badge className={cn("text-[9px] font-black uppercase tracking-widest border-none px-2.5 py-0.5", service.productStatus === "DISABLED" ? "bg-slate-200 text-slate-600" : "bg-emerald-500 text-white shadow-md shadow-emerald-500/20")}>
                                 {service.productStatus === "DISABLED" ? "Draft" : "Active"}
                              </Badge>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                 <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all" onClick={() => openEditDialog(service)} title="Edit Service">
                                    <Edit2 size={16} />
                                 </Button>
                                 <Button variant="ghost" size="icon" className={cn("h-9 w-9 transition-all", service.productStatus === "DISABLED" ? "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50" : "text-muted-foreground hover:text-red-600 hover:bg-red-50")} onClick={() => handleToggleVisibility(service)} disabled={togglingServiceId === service._id} title={service.productStatus === "DISABLED" ? "Enable" : "Disable"}>
                                    {togglingServiceId === service._id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Power size={16} />}
                                 </Button>
                                 <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all" onClick={() => setDeleteService(service)} title="Delete Service">
                                    <Trash2 size={16} />
                                 </Button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
         <div className="flex items-center justify-between px-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl border-border/60">Previous</Button>
               <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl border-border/60">Next</Button>
            </div>
         </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(v) => { if(!v) { setIsAddOpen(false); setEditingService(null); setFormImages([]); setServiceImageUrlInput(""); setSubmitError(""); } }}>
         <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-none shadow-2xl">
            <ScrollArea className="max-h-[90vh]">
               <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150">
                     <Wrench size={120} />
                  </div>
                  <div className="relative z-10">
                     <h2 className="text-3xl font-black tracking-tight">{editingService ? "Update Service" : "New Service Listing"}</h2>
                     <p className="text-blue-100 mt-2 font-medium italic">Enter precise details to attract more workshop bookings.</p>
                  </div>
               </div>
               
               <form
                  onSubmit={(e) => {
                     e.preventDefault();
                     handleFormSubmit(readServiceForm(e.currentTarget, formImages));
                  }}
                  className="p-8 space-y-8 bg-background"
               >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 mb-2">
                              <Info size={16} className="text-blue-600" />
                              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">General Info</h3>
                           </div>
                           <div className="space-y-4">
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest">Service Name *</Label>
                                 <Input defaultValue={editingService?.name} name="name" required className="bg-muted/10 h-11 rounded-xl" placeholder="Full service, Brake repair, etc." />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest">Duration *</Label>
                                 <Input defaultValue={editingService?.duration} name="duration" required className="bg-muted/10 h-11 rounded-xl" placeholder="2 hours, 1 day, etc." />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest">Category</Label>
                                 <select name="category" defaultValue={editingService?.category || CATEGORY_OPTIONS[0]} className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                                 </select>
                              </div>
                           </div>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 mb-2">
                              <Clock size={16} className="text-blue-600" />
                              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Pricing & Logic</h3>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest">Price (LKR) *</Label>
                                 <Input type="number" min="0" name="actualPrice" defaultValue={editingService?.price} required className="bg-muted/10 h-11 rounded-xl" placeholder="0.00" />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest">Original Price</Label>
                                 <Input type="number" min="0" name="discountPrice" defaultValue={editingService?.originalPrice} className="bg-muted/10 h-11 rounded-xl" placeholder="Optional" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest">Status</Label>
                              <select name="status" defaultValue={editingService?.productStatus || "ENABLED"} className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                                 <option value="ENABLED">Active Listing</option>
                                 <option value="DISABLED">Draft / Hidden</option>
                              </select>
                           </div>
                           {submitError && (
                              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                                 {submitError}
                              </p>
                           )}
                        </div>
                     </div>
                     
                     <div className="space-y-6">
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 mb-2">
                              <ImageIcon size={16} className="text-blue-600" />
                              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Visual Presence</h3>
                              <Badge variant="outline" className="ml-auto text-[9px] border-blue-200 text-blue-600 font-black">
                                 {formImages.length}/{MAX_SERVICE_IMAGES}
                              </Badge>
                           </div>
                           <div className="space-y-3">
                              <div className="flex flex-col gap-2 sm:flex-row">
                                 <div className="relative flex-1">
                                    <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                                    <Input
                                       value={serviceImageUrlInput}
                                       onChange={(event) => setServiceImageUrlInput(event.target.value)}
                                       onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), handleAddServiceImageUrl())}
                                       className="bg-muted/10 h-11 rounded-xl pl-10"
                                       placeholder="Paste service image URL..."
                                    />
                                 </div>
                                 <Button type="button" variant="outline" onClick={handleAddServiceImageUrl} className="h-11 rounded-xl font-black text-[10px] uppercase tracking-widest border-blue-200 text-blue-600">
                                    <Plus className="h-4 w-4 mr-2" /> Add URL
                                 </Button>
                              </div>

                              <label className={cn(
                                 "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/5 p-5 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40",
                                 uploadingServiceImages && "pointer-events-none opacity-60"
                              )}>
                                 {uploadingServiceImages ? (
                                    <RefreshCw size={28} className="text-blue-600 mb-2 animate-spin" />
                                 ) : (
                                    <Upload size={30} className="text-muted-foreground/40 mb-2" />
                                 )}
                                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {uploadingServiceImages ? "Uploading images..." : "Upload from device"}
                                 </p>
                                 <p className="text-[9px] text-muted-foreground/60 mt-1">PNG, JPG, WEBP up to 5MB each</p>
                                 <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="sr-only"
                                    onChange={(event) => {
                                       handleServiceImageUpload(event.target.files);
                                       event.target.value = "";
                                    }}
                                 />
                              </label>

                              {formImages.length > 0 ? (
                                 <div className="grid grid-cols-5 gap-2">
                                    {formImages.map((url, index) => (
                                       <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                                          <img src={resolveMediaUrl(url)} alt={`Service preview ${index + 1}`} className="h-full w-full object-cover" />
                                          <button
                                             type="button"
                                             onClick={() => handleRemoveServiceImage(index)}
                                             className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                             aria-label="Remove service image"
                                          >
                                             <Trash2 className="h-4 w-4" />
                                          </button>
                                       </div>
                                    ))}
                                 </div>
                              ) : (
                                 <div className="rounded-2xl border border-dashed border-border/50 bg-muted/5 p-4 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No service images added yet</p>
                                 </div>
                              )}
                           </div>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 mb-2">
                              <Info size={16} className="text-blue-600" />
                              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Description</h3>
                           </div>
                           <Textarea name="description" defaultValue={editingService?.description} className="bg-muted/10 rounded-xl min-h-[120px] resize-none leading-relaxed text-xs" placeholder="Describe the service workflow, parts included, and estimated time..." />
                        </div>
                     </div>
                  </div>
                  
                  <Separator className="bg-border/40" />
                  
                  <div className="flex items-center justify-end gap-3 pt-2">
                     <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-12 font-black uppercase tracking-widest text-[10px] rounded-xl px-8 border-border/60">Cancel</Button>
                     <Button type="submit" disabled={submitting} className="h-12 font-black uppercase tracking-widest text-[10px] rounded-xl px-12 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20">
                        {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        {editingService ? "Update Service" : "Publish Service"}
                     </Button>
                  </div>
               </form>
            </ScrollArea>
         </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteService)} onOpenChange={(v) => !v && setDeleteService(null)}>
         <DialogContent className="sm:max-w-md p-8 text-center rounded-3xl">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-6">
               <Trash2 size={32} />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-widest text-foreground mb-2">Confirm Removal</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium italic mb-8">Are you sure you want to permanently delete this service? This action cannot be reversed.</p>
            <div className="flex gap-3">
               <Button variant="outline" onClick={() => setDeleteService(null)} className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px]">Keep Service</Button>
               <Button variant="destructive" onClick={handleDelete} className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-red-600 hover:bg-red-700">Delete Forever</Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
