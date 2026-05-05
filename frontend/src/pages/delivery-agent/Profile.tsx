import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BadgeCheck,
  Camera,
  CreditCard,
  Edit3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Truck,
  UserCircle2,
  Wallet,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { resolveMediaUrl } from "@/lib/imageUrl";

type DeliveryStatus = "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED";

interface DeliveryRow {
  _id: string;
  status: DeliveryStatus;
  order?: {
    totalAmount?: number;
  } | null;
}

interface DeliveryAgentProfileResponse {
  avatar?: string | null;
  role?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  payoutMethod?: string;
  payoutAccountName?: string;
}

export default function DeliveryAgentProfile() {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    handledValue: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    vehicleType: "",
    vehicleNumber: "",
    licenseNumber: "",
    payoutMethod: "",
    payoutAccountName: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, deliveriesRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/deliveries/my"),
        ]);

        const profile = (profileRes.data || {}) as DeliveryAgentProfileResponse;
        if (profile.role !== "delivery_agent") {
          setForm({
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            address: "",
            vehicleType: "",
            vehicleNumber: "",
            licenseNumber: "",
            payoutMethod: "",
            payoutAccountName: "",
          });
          setStats({
            totalDeliveries: 0,
            activeDeliveries: 0,
            completedDeliveries: 0,
            handledValue: 0,
          });
          return;
        }

        const deliveries = Array.isArray(deliveriesRes.data?.data)
          ? (deliveriesRes.data.data as DeliveryRow[])
          : [];

        const completedDeliveries = deliveries.filter((delivery) => delivery.status === "DELIVERED");
        const activeDeliveries = deliveries.filter((delivery) => delivery.status !== "DELIVERED");
        const handledValue = deliveries.reduce((total, delivery) => {
          const amount = delivery.order?.totalAmount;
          return total + (typeof amount === "number" ? amount : 0);
        }, 0);

        setAvatar(profile.avatar || user?.avatar || null);
        setForm({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          phone: profile.phone || "",
          email: profile.email || "",
          address: profile.address || "",
          vehicleType: profile.vehicleType || "",
          vehicleNumber: profile.vehicleNumber || "",
          licenseNumber: profile.licenseNumber || "",
          payoutMethod: profile.payoutMethod || "",
          payoutAccountName: profile.payoutAccountName || "",
        });
        setStats({
          totalDeliveries: deliveries.length,
          activeDeliveries: activeDeliveries.length,
          completedDeliveries: completedDeliveries.length,
          handledValue,
        });
      } catch (error) {
        console.error("Failed to load delivery agent profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.avatar]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        address: form.address,
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber,
        licenseNumber: form.licenseNumber,
        payoutMethod: form.payoutMethod,
        payoutAccountName: form.payoutAccountName,
      });
      setEditing(false);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const res = await uploadAvatar(file);
      setAvatar(res.avatar || null);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deliveryStats = [
    {
      icon: Truck,
      label: "Total Deliveries",
      value: stats.totalDeliveries.toString(),
      color: "text-blue-600",
      bg: "bg-blue-600/10",
    },
    {
      icon: BadgeCheck,
      label: "Completed Deliveries",
      value: stats.completedDeliveries.toString(),
      color: "text-emerald-600",
      bg: "bg-emerald-600/10",
    },
    {
      icon: UserCircle2,
      label: "Active Deliveries",
      value: stats.activeDeliveries.toString(),
      color: "text-amber-600",
      bg: "bg-amber-600/10",
    },
    {
      icon: Wallet,
      label: "Handled Order Value",
      value: `LKR ${stats.handledValue.toLocaleString()}`,
      color: "text-violet-600",
      bg: "bg-violet-600/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user?.role !== "delivery_agent") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Agent Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your delivery account details, vehicle information, and payout setup
          </p>
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
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-600/25 transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : editing ? (
            <>
              <Save className="h-4 w-4" /> Save Changes
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4" /> Edit Profile
            </>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="glass-card overflow-hidden">
            <div className="relative h-40 bg-gradient-to-r from-blue-600 via-sky-700 to-cyan-800">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-50" />
              <button
                onClick={handleAvatarPick}
                disabled={uploadingAvatar}
                className="absolute right-3 top-3 rounded-lg bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30 disabled:opacity-60"
                title="Change profile picture"
              >
                {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <div className="absolute -bottom-8 left-6">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-card shadow-lg">
                  {avatar ? (
                    <img
                      src={resolveMediaUrl(avatar, "https://placehold.co/120x120?text=Agent")}
                      alt="Delivery agent profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Truck className="h-10 w-10 text-blue-600" />
                  )}
                </div>
              </div>
            </div>

            <CardContent className="px-6 pb-6 pt-12">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">First Name</label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Last Name</label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Phone</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        disabled
                        className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Delivery Area / Address</label>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="mb-1 text-xl font-bold">
                    {[form.firstName, form.lastName].filter(Boolean).join(" ") || "Delivery Agent"}
                  </h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Authenticated delivery agent account details shown only for your active login
                  </p>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 text-blue-600" /> {form.phone || "-"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 text-blue-600" /> {form.email || "-"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                      <MapPin className="h-4 w-4 text-blue-600" /> {form.address || "-"}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Vehicle And Payout Details</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Vehicle Type</label>
                    <input
                      type="text"
                      value={form.vehicleType}
                      onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Vehicle Number</label>
                    <input
                      type="text"
                      value={form.vehicleNumber}
                      onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">License Number</label>
                    <input
                      type="text"
                      value={form.licenseNumber}
                      onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Payout Method</label>
                    <input
                      type="text"
                      value={form.payoutMethod}
                      onChange={(e) => setForm({ ...form, payoutMethod: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium">Payout Account Name</label>
                    <input
                      type="text"
                      value={form.payoutAccountName}
                      onChange={(e) => setForm({ ...form, payoutAccountName: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">Vehicle Type</p>
                    <p className="mt-1 font-medium">{form.vehicleType || "-"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">Vehicle Number</p>
                    <p className="mt-1 font-medium">{form.vehicleNumber || "-"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">License Number</p>
                    <p className="mt-1 font-medium">{form.licenseNumber || "-"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">Payout Method</p>
                    <p className="mt-1 font-medium">{form.payoutMethod || "-"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground">Payout Account Name</p>
                    <p className="mt-1 font-medium">{form.payoutAccountName || "-"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="mb-4 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
                  <BadgeCheck className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-bold text-emerald-600">Verified Delivery Agent</h3>
                <p className="mt-1 text-xs text-muted-foreground">Authenticated delivery account profile</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Profile restricted to your delivery-agent login
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Delivery Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {deliveryStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
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

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Payout Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Method</p>
                  <p className="text-sm font-medium">{form.payoutMethod || "Not added yet"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <Wallet className="h-5 w-5 text-violet-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="text-sm font-medium">{form.payoutAccountName || "Not added yet"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
