import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Package, Plus, Trash2, Image as ImageIcon, Loader2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ProductFormValues, SellerProduct } from "./productTypes";
import api from "@/services/api";
import { resolveMediaUrl } from "@/lib/imageUrl";
import { PRODUCT_CATEGORIES } from "@/lib/productCategories";

interface AddProductSectionProps {
  product: SellerProduct | null;
  submitting: boolean;
  submitError: string;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}

const emptyValues: ProductFormValues = {
  name: "",
  sku: "",
  actualPrice: "",
  discountPrice: "",
  stock: "",
  category: "",
  brand: "",
  description: "",
  status: "active",
  visibilityStatus: "ENABLED",
  images: [],
};

export function AddProductSection({ product, submitting, submitError, onSubmit }: AddProductSectionProps) {
  const [values, setValues] = useState<ProductFormValues>(emptyValues);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});

  useEffect(() => {
    if (product) {
      setValues({
        name: product.name || "",
        sku: product.sku || "",
        actualPrice: product.price != null ? String(product.price) : "",
        discountPrice: product.originalPrice != null ? String(product.originalPrice) : "",
        stock: product.stock != null ? String(product.stock) : "",
        category: product.category || "",
        brand: product.brand || "",
        description: product.description || "",
        status: product.status || "active",
        visibilityStatus: product.productStatus || "ENABLED",
        images: product.images || [],
      });
      return;
    }

    setValues(emptyValues);
  }, [product]);

  const handleChange = (field: keyof ProductFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    if (values.images && values.images.length >= 5) {
      alert("Maximum 5 photos allowed");
      return;
    }
    
    setValues((current) => ({
      ...current,
      images: [...(current.images || []), imageUrlInput.trim()],
    }));
    setImageUrlInput("");
  };

  const handleImageUpload = async (files: FileList | null) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    const availableSlots = 5 - (values.images?.length || 0);
    if (availableSlots <= 0) {
      alert("Maximum 5 photos allowed");
      return;
    }

    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles.slice(0, availableSlots)) {
        const formData = new FormData();
        formData.append("image", file);
        const { data } = await api.post("/products/upload-image", formData);
        const url = data?.data?.url;
        if (url) uploadedUrls.push(url);
      }

      setValues((current) => ({
        ...current,
        images: [...(current.images || []), ...uploadedUrls].slice(0, 5),
      }));
    } catch (error: any) {
      alert(error?.response?.data?.message || "Image upload failed.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setValues((current) => ({
      ...current,
      images: (current.images || []).filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormValues, string>> = {};

    if (!values.name.trim()) newErrors.name = "Product name is required";
    if (!values.category.trim()) newErrors.category = "Category is required";
    const price = Number(values.actualPrice);
    const stock = Number(values.stock);
    const originalPrice = values.discountPrice.trim() ? Number(values.discountPrice) : undefined;

    if (!values.actualPrice.trim() || Number.isNaN(price)) {
      newErrors.actualPrice = "Valid price is required";
    } else if (price < 0) {
      newErrors.actualPrice = "Product price cannot be negative";
    }
    if (!values.stock.trim() || Number.isNaN(stock)) {
      newErrors.stock = "Stock quantity is required";
    } else if (stock < 0) {
      newErrors.stock = "Product stock cannot be negative";
    }
    if (originalPrice !== undefined && (Number.isNaN(originalPrice) || originalPrice < 0)) {
      newErrors.discountPrice = "Original price cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validate()) {
      await onSubmit(values);
    }
  };

  return (
    <form className="space-y-8 py-2" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            {product ? <ImageIcon className="text-blue-600" /> : <Plus className="text-blue-600" />}
            {product ? "Update Catalog Item" : "List New Product"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium italic">
            Enter detailed information to maximize your visibility and sales.
          </p>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Submission Error</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Basic Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <div className="bg-muted/30 px-6 py-3 border-b border-border/40 flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">General Information</span>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider">Product Title *</Label>
                <Input
                  id="name"
                  placeholder="e.g. 12V 7Ah Maintenance Free Battery"
                  value={values.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={errors.name ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500" : "bg-muted/10"}
                />
                {errors.name && <p className="text-[10px] font-black text-red-500 uppercase italic">{errors.name}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-xs font-bold uppercase tracking-wider">Brand / Manufacturer</Label>
                  <Input
                    id="brand"
                    placeholder="e.g. Exide, Bosch"
                    value={values.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                    className="bg-muted/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider">Category *</Label>
                  <Select value={values.category} onValueChange={(v) => handleChange("category", v)}>
                    <SelectTrigger
                      id="category"
                      className={errors.category ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500" : "bg-muted/10"}
                    >
                      <SelectValue placeholder="Select product category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category} className="text-xs font-semibold">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-[10px] font-black text-red-500 uppercase italic">{errors.category}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider">Full Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the condition, compatibility, and key features..."
                  className="min-h-[160px] bg-muted/10 resize-none leading-relaxed"
                  value={values.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-sm overflow-hidden">
            <div className="bg-muted/30 px-6 py-3 border-b border-border/40 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Product Media</span>
              <Badge variant="outline" className="ml-auto text-[9px] border-blue-200 text-blue-600 font-black">{values.images?.length || 0}/5</Badge>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    placeholder="Paste image URL here..."
                    className="pl-10 bg-muted/10"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                  />
                </div>
                <Button type="button" variant="outline" onClick={handleAddImage} className="font-bold border-blue-200 text-blue-600 hover:bg-blue-50">
                  <Plus className="h-4 w-4 mr-2" /> Add URL
                </Button>
                <label className={cn(
                  "inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-blue-200 px-4 py-2 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50",
                  uploadingImages && "pointer-events-none opacity-60"
                )}>
                  {uploadingImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      handleImageUpload(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {values.images?.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-border/40 bg-muted/20 shadow-inner">
                    <img src={resolveMediaUrl(url)} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="h-8 w-8 rounded-full shadow-lg"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!values.images || values.images.length === 0) && (
                  <div className="col-span-5 py-8 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-2xl bg-muted/5">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/20 mb-2" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No images added yet</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground italic flex items-center gap-1.5 px-1">
                <Info className="h-3 w-3" /> Add images from your device or paste hosted image URLs. Maximum 5 photos.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Inventory & Pricing */}
        <div className="space-y-6">
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <div className="bg-muted/30 px-6 py-3 border-b border-border/40 flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Inventory & Logistics</span>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-wider">SKU / Part Number</Label>
                <Input
                  id="sku"
                  placeholder="e.g. MOTO-BAT-12V"
                  value={values.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  className="bg-muted/10 font-mono text-xs uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock" className="text-xs font-bold uppercase tracking-wider">Current Stock *</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={values.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                    className={cn("pl-10 bg-muted/10 font-bold", errors.stock && "border-red-500")}
                  />
                </div>
                {errors.stock && <p className="text-[10px] font-black text-red-500 uppercase italic">{errors.stock}</p>}
              </div>

              <Separator className="bg-border/30" />

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider">Stock Status</Label>
                <Select value={values.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger className="bg-muted/10 font-medium">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-xs font-bold text-emerald-600">Active Stock</SelectItem>
                    <SelectItem value="inactive" className="text-xs font-bold text-slate-500">Temporarily Hidden</SelectItem>
                    <SelectItem value="out_of_stock" className="text-xs font-bold text-red-600">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider">Store Visibility</Label>
                <Select value={values.visibilityStatus} onValueChange={(v) => handleChange("visibilityStatus", v)}>
                  <SelectTrigger className="bg-muted/10 font-medium">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENABLED" className="text-xs font-bold text-blue-600">Enabled (Public)</SelectItem>
                    <SelectItem value="DISABLED" className="text-xs font-bold text-slate-500">Disabled (Draft)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-sm overflow-hidden bg-gradient-to-br from-blue-50/30 to-transparent">
            <div className="bg-blue-600/5 px-6 py-3 border-b border-blue-600/10 flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-700/70">Pricing & Discount</span>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="actualPrice" className="text-xs font-bold uppercase tracking-wider text-blue-800">Selling Price (LKR) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 text-xs font-black">LKR</span>
                  <Input
                    id="actualPrice"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={values.actualPrice}
                    onChange={(e) => handleChange("actualPrice", e.target.value)}
                    className={cn("pl-11 bg-white/50 font-black text-lg text-blue-600 border-blue-200 focus-visible:ring-blue-500", errors.actualPrice && "border-red-500 bg-red-50/30")}
                  />
                </div>
                {errors.actualPrice && <p className="text-[10px] font-black text-red-500 uppercase italic">{errors.actualPrice}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountPrice" className="text-xs font-bold uppercase tracking-wider text-slate-500">Original Price (Strike-through)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">LKR</span>
                  <Input
                    id="discountPrice"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={values.discountPrice}
                    onChange={(e) => handleChange("discountPrice", e.target.value)}
                    className="pl-11 bg-white/30 border-slate-200 text-slate-500 font-medium"
                  />
                </div>
                {errors.discountPrice && <p className="text-[10px] font-black text-red-500 uppercase italic">{errors.discountPrice}</p>}
                <p className="text-[9px] text-muted-foreground leading-tight px-1 font-medium">Leave blank if there is no discount applied to this item.</p>
              </div>
            </CardContent>
          </Card>

          <div className="pt-4 sticky bottom-0">
            <Button 
              type="submit" 
              className="w-full h-12 text-sm font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 rounded-xl transition-all active:scale-[0.98]" 
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Syncing Catalog...</>
              ) : (
                <>{product ? "Update Listing" : "Publish Listing"}</>
              )}
            </Button>
            <p className="text-[9px] text-center text-muted-foreground mt-3 font-medium uppercase tracking-tight">
              By publishing, you agree to our <span className="underline cursor-pointer hover:text-blue-600">Merchant Terms & Conditions</span>
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
