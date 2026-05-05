import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Edit3,
  Save,
  Camera,
  Plus,
  Package,
  ShoppingCart,
  Star,
  Eye,
  CheckCircle,
  Shield,
  Loader2,
  X,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { resolveMediaUrl } from "@/lib/imageUrl";

// ─── Profile Page ───────────────────────────────────────────────────────────
export default function SellerProfile() {
  const allBrands = ["Bajaj", "TVS", "Hero", "Honda", "Yamaha", "Suzuki", "KTM", "Kawasaki", "BMW", "Royal Enfield"];
  const defaultSpecializations: string[] = [];
  const defaultBrands: string[] = [];

  const { user, updateProfile, uploadAvatar } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalViews: 0 });
  const [sellerSpecializations, setSellerSpecializations] = useState<string[]>(defaultSpecializations);
  const [sellerBrands, setSellerBrands] = useState<string[]>(defaultBrands);
  const [brandInput, setBrandInput] = useState("");
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [editingBrands, setEditingBrands] = useState(false);
  const [savingBrands, setSavingBrands] = useState(false);
  const [form, setForm] = useState({
    shopName: "",
    shopDescription: "",
    shopLocation: "",
    phone: "",
    email: "",
    firstName: "",
    lastName: "",
    website: "",
    openHours: "",
  });

  // Fetch profile + stats
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [profileRes, overviewRes] = await Promise.all([
          api.get("/seller/profile"),
          api.get("/seller/overview"),
        ]);

        const p = profileRes.data.data;
        setAvatar(p.avatar || user?.avatar || null);
        setSellerSpecializations(
          Array.isArray(p.sellerSpecializations) ? p.sellerSpecializations : defaultSpecializations
        );
        setSellerBrands(
          Array.isArray(p.sellerBrands) && p.sellerBrands.length > 0
            ? p.sellerBrands
            : defaultBrands
        );
        setBrandInput("");
        setEditingBrands(false);
        setForm({
          shopName: p.shopName || "",
          shopDescription: p.shopDescription || "",
          shopLocation: p.shopLocation || "",
          phone: p.phone || "",
          email: p.email || "",
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          website: p.website || "",
          openHours: p.openHours || "",
        });

        const s = overviewRes.data.data?.stats || {};
        setStats({
          totalProducts: s.totalProducts || 0,
          totalOrders: s.totalOrders || 0,
          totalViews: s.totalViews || 0,
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.avatar]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        shopName: form.shopName,
        shopDescription: form.shopDescription,
        shopLocation: form.shopLocation,
        sellerSpecializations,
      });
      setEditing(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const addBrandTag = () => {
    const trimmed = brandInput.trim();
    if (trimmed && !sellerBrands.includes(trimmed)) {
      setSellerBrands([...sellerBrands, trimmed]);
      setBrandInput("");
      setBrandSuggestions([]);
    }
  };

  const selectBrandSuggestion = (brand: string) => {
    if (!sellerBrands.includes(brand)) {
      setSellerBrands([...sellerBrands, brand]);
    }
    setBrandInput("");
    setBrandSuggestions([]);
  };

  const handleBrandInputChange = (value: string) => {
    setBrandInput(value);
    if (value.trim()) {
      const filtered = allBrands.filter(
        (brand) =>
          brand.toLowerCase().includes(value.toLowerCase()) &&
          !sellerBrands.includes(brand)
      );
      setBrandSuggestions(filtered);
    } else {
      setBrandSuggestions([]);
    }
  };

  const removeBrandTag = (brand: string) => {
    setSellerBrands(sellerBrands.filter((b) => b !== brand));
  };

  const saveBrands = async () => {
    setSavingBrands(true);
    try {
      await updateProfile({
        firstName: user?.firstName,
        lastName: user?.lastName,
        sellerBrands: sellerBrands,
      });
      setEditingBrands(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save brands");
    } finally {
      setSavingBrands(false);
    }
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const res = await uploadAvatar(file);
      setAvatar(res.avatar || null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const shopStats = [
    { icon: Package, label: "Total Products", value: stats.totalProducts.toString(), color: "text-blue-600", bg: "bg-blue-600/10" },
    { icon: ShoppingCart, label: "Total Orders", value: stats.totalOrders.toString(), color: "text-emerald-600", bg: "bg-emerald-600/10" },
    { icon: Star, label: "Average Rating", value: "N/A", color: "text-amber-600", bg: "bg-amber-600/10" },
    { icon: Eye, label: "Profile Views", value: stats.totalViews.toLocaleString(), color: "text-purple-600", bg: "bg-purple-600/10" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Shop Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your shop details and appearance</p>
        </div>
        <button
          onClick={() => {
            if (editing) {
              handleSave();
            } else {
              setEditing(true);
            }
          }}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/25 disabled:opacity-50"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : editing ? (
            <><Save className="h-4 w-4" /> Save Changes</>
          ) : (
            <><Edit3 className="h-4 w-4" /> Edit Profile</>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shop Banner & Info */}
          <Card className="glass-card overflow-hidden">
            {/* Banner */}
            <div className="relative h-40 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-50" />
              <button
                onClick={handleAvatarPick}
                disabled={uploadingAvatar}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors disabled:opacity-60"
                title="Change profile picture"
              >
                {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              {/* Shop logo */}
              <div className="absolute -bottom-8 left-6">
                <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-lg overflow-hidden">
                  {avatar ? (
                    <img
                      src={resolveMediaUrl(avatar, "https://placehold.co/120x120?text=Shop")}
                      alt="Shop profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="h-10 w-10 text-blue-600" />
                  )}
                </div>
              </div>
            </div>

            <CardContent className="pt-12 pb-6 px-6">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Shop Name</label>
                      <input
                        type="text"
                        value={form.shopName}
                        onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Location</label>
                      <input
                        type="text"
                        value={form.shopLocation}
                        onChange={(e) => setForm({ ...form, shopLocation: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Phone</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Website</label>
                      <input
                        type="text"
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Business Hours</label>
                      <input
                        type="text"
                        value={form.openHours}
                        onChange={(e) => setForm({ ...form, openHours: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Shop Description</label>
                    <textarea
                      value={form.shopDescription}
                      onChange={(e) => setForm({ ...form, shopDescription: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold mb-1">{form.shopName}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{form.shopDescription}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-blue-600" /> {form.shopLocation || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 text-blue-600" /> {form.phone || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 text-blue-600" /> {form.email || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4 text-blue-600" /> {form.website || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                      <Clock className="h-4 w-4 text-blue-600" /> {form.openHours || "N/A"}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Brands */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Brands We Stock</CardTitle>
                {!editingBrands && (
                  <button onClick={() => setEditingBrands(true)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingBrands ? (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={brandInput}
                        onChange={(e) => handleBrandInputChange(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addBrandTag()}
                        placeholder="Enter brand name (e.g., Yamaha)"
                        className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      <button
                        onClick={addBrandTag}
                        className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-1 transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add
                      </button>
                    </div>
                    {brandSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-12 mt-1 bg-background border border-input rounded-lg shadow-lg z-10">
                        {brandSuggestions.map((brand) => (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => selectBrandSuggestion(brand)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors border-b border-input last:border-b-0"
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sellerBrands.map((brand) => (
                      <span
                        key={brand}
                        className="px-3 py-1.5 rounded-full bg-blue-600/10 text-blue-600 text-xs font-medium flex items-center gap-2"
                      >
                        {brand}
                        <button
                          onClick={() => removeBrandTag(brand)}
                          className="hover:text-blue-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={saveBrands}
                      disabled={savingBrands}
                      className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {savingBrands ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingBrands(false)}
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sellerBrands.length > 0 ? sellerBrands.map((brand) => (
                    <span key={brand} className="px-3 py-1.5 rounded-full bg-blue-600/10 text-blue-600 text-xs font-medium">
                      {brand}
                    </span>
                  )) : <p className="text-sm text-muted-foreground">No brands added.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-bold text-emerald-600">Verified Seller</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Member since January 2025
                </p>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Identity Verified</span>
              </div>
            </CardContent>
          </Card>

          {/* Shop Statistics */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Shop Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shopStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Performance */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Response Rate", value: 98, color: "bg-emerald-500" },
                { label: "Order Fulfillment", value: 95, color: "bg-blue-500" },
                { label: "Customer Satisfaction", value: 92, color: "bg-amber-500" },
                { label: "On-time Delivery", value: 88, color: "bg-purple-500" },
              ].map((metric) => (
                <div key={metric.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{metric.label}</span>
                    <span className="font-semibold">{metric.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${metric.color} transition-all duration-500`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
