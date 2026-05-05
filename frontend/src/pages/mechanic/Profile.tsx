import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wrench,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Edit3,
  Save,
  Camera,
  Shield,
  Award,
  Loader2,
  CheckCircle2,
  Briefcase,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { resolveMediaUrl } from "@/lib/imageUrl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MechanicProfileData {
  workshopName: string;
  specialization: string;
  experienceYears: number;
  shopDescription: string;
  workshopLocation: string;
  phone: string;
  email: string;
  website: string;
  openHours: string;
  servicesOffered: string[];
}

export default function MechanicProfile() {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<MechanicProfileData>({
    workshopName: "",
    specialization: "",
    experienceYears: 0,
    shopDescription: "",
    workshopLocation: "",
    phone: "",
    email: "",
    website: "",
    openHours: "",
    servicesOffered: [],
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/mechanic/profile");
        const p = data.data;
        setAvatar(p.avatar || user?.avatar || null);
        setForm({
          workshopName: p.workshopName || "",
          specialization: p.specialization || "",
          experienceYears: p.experienceYears || 0,
          shopDescription: p.shopDescription || "",
          workshopLocation: p.workshopLocation || "",
          phone: p.phone || "",
          email: p.email || "",
          website: p.website || "",
          openHours: p.openHours || "",
          servicesOffered: p.servicesOffered || (p.specialization ? p.specialization.split(",").map((s: string) => s.trim()) : []),
        });
      } catch (err) {
        console.error("Failed to load mechanic profile:", err);
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
        firstName: user?.firstName,
        lastName: user?.lastName,
        phone: form.phone,
        email: form.email,
        specialization: form.specialization,
        experienceYears: form.experienceYears,
        workshopLocation: form.workshopLocation,
        workshopName: form.workshopName,
        shopDescription: form.shopDescription,
        servicesOffered: form.servicesOffered,
      });
      setEditing(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Wrench size={24} />
            </div>
            Workshop Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium italic">Professional identity management for your service center.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              if (editing) handleSave();
              else setEditing(true);
            }}
            disabled={saving}
            className={cn(
              "h-12 px-8 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95",
              editing ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
            )}
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Syncing...</>
            ) : editing ? (
              <><Save className="h-4 w-4 mr-2" /> Save Changes</>
            ) : (
              <><Edit3 className="h-4 w-4 mr-2" /> Edit Profile</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Card with Banner */}
          <Card className="glass-card border border-border/40 overflow-hidden shadow-lg">
            <div className="relative h-48 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-30" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute top-4 right-4 h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all shadow-xl"
              >
                {uploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera size={20} />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingAvatar(true);
                try { await uploadAvatar(file); } finally { setUploadingAvatar(false); }
              }} />

              <div className="absolute -bottom-10 left-8">
                <div className="h-28 w-28 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-inner ring-4 ring-emerald-50">
                  {avatar ? (
                    <img src={resolveMediaUrl(avatar)} alt="Workshop" className="h-full w-full object-cover transition-transform hover:scale-110 duration-500" />
                  ) : (
                    <Wrench size={40} className="text-blue-600" />
                  )}
                </div>
              </div>
            </div>

            <CardContent className="pt-16 pb-8 px-8">
              {editing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Workshop Name</Label>
                      <Input value={form.workshopName} onChange={(e) => setForm({ ...form, workshopName: e.target.value })} className="bg-muted/10 h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Specialization</Label>
                      <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="bg-muted/10 h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location Address</Label>
                      <Input value={form.workshopLocation} onChange={(e) => setForm({ ...form, workshopLocation: e.target.value })} className="bg-muted/10 h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Experience (Years)</Label>
                      <Input type="number" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: parseInt(e.target.value) || 0 })} className="bg-muted/10 h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Public Phone</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-muted/10 h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Business Email</Label>
                      <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-muted/10 h-11 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Workshop Vision & Mission</Label>
                    <Textarea value={form.shopDescription} onChange={(e) => setForm({ ...form, shopDescription: e.target.value })} className="bg-muted/10 min-h-[120px] rounded-xl resize-none leading-relaxed text-xs" />
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-black text-foreground tracking-tight">{form.workshopName || "N/A"}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge className="bg-blue-600 border-none text-[9px] font-black uppercase tracking-widest px-2.5 py-1 shadow-lg shadow-blue-500/20">
                          {form.specialization || "N/A"}
                        </Badge>
                        <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 text-[9px] font-black uppercase tracking-widest px-2.5 py-1">
                          {form.experienceYears}+ Years Experience
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Business Hours</p>
                      <span className="text-xs font-black text-blue-600 flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                        <Clock size={12} /> {form.openHours || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-muted/10 border border-border/20 italic text-xs leading-relaxed font-medium text-muted-foreground">
                    "{form.shopDescription || "N/A"}"
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 px-2">
                    <div className="flex items-center gap-3 group">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Location</p>
                        <p className="text-sm font-bold text-foreground">{form.workshopLocation || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 group">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Direct Line</p>
                        <p className="text-sm font-bold text-foreground">{form.phone || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 group">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Support Email</p>
                        <p className="text-sm font-bold text-foreground">{form.email || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 group">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Globe size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Domain</p>
                        <p className="text-sm font-bold text-foreground">{form.website || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expert Services Section */}
          <Card className="glass-card border border-border/40 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-border/20 py-5 px-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-widest text-foreground">Services Architecture</CardTitle>
                <p className="text-[10px] text-muted-foreground mt-1 font-bold italic">Primary technical solutions provided by your workshop</p>
              </div>
              <Briefcase size={20} className="text-blue-600 opacity-40" />
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-wrap gap-2">
                {form.servicesOffered.length > 0 ? form.servicesOffered.map(s => (
                  <span key={s} className="px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-200/40 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all cursor-default">
                    {s}
                  </span>
                )) : <p className="text-sm text-muted-foreground">No services added.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           {/* Certification Card */}
           <Card className="glass-card border border-border/40 overflow-hidden shadow-sm bg-gradient-to-br from-emerald-500/5 to-transparent relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 scale-150">
                 <Shield size={64} className="text-emerald-600" />
              </div>
              <CardContent className="p-8 text-center relative z-10">
                 <div className="h-20 w-20 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-inner ring-4 ring-emerald-50">
                    <CheckCircle2 size={40} />
                 </div>
                 <h3 className="text-xl font-black text-emerald-700 uppercase tracking-widest mb-2">Verified Professional</h3>
                 <p className="text-[10px] text-emerald-800/60 font-black uppercase tracking-[0.2em] mb-6">Established Marketplace Vendor</p>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/60 border border-emerald-100 shadow-sm transition-all hover:shadow-md">
                       <Shield size={16} className="text-emerald-600" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Identity Secure</span>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/60 border border-emerald-100 shadow-sm transition-all hover:shadow-md">
                       <Award size={16} className="text-amber-600" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Service Certification</span>
                    </div>
                 </div>
              </CardContent>
           </Card>

        </div>
      </div>
    </div>
  );
}
