import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Loader2, 
  Wrench, 
  MessageSquare,
  Star,
  ShieldCheck,
  ChevronRight,
  Clock,
  Briefcase
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { resolveMediaUrl } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface ServiceDetail {
  name: string;
  category: string;
  price: number;
}

interface Garage {
  _id: string;
  name: string;
  ownerName: string;
  address: string;
  phone: string;
  specialization: string;
  experienceYears: number;
  avatar: string | null;
  services: string[];
  serviceDetails: ServiceDetail[];
  verified: boolean;
  rating: number;
  reviewCount: number;
}

const Services: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("All Services");

  const [garages, setGarages] = useState<Garage[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>(["All Services"]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(Number.MAX_SAFE_INTEGER);

  const fetchMechanics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedService !== "All Services") params.specialization = selectedService;

      const { data: res } = await api.get("/public/mechanics", { params });

      if (res.success) {
        setGarages(res.data);
        if (res.filters?.specializations) {
          setServiceTypes(res.filters.specializations);
        }
      }
    } catch (err) {
      console.error("Failed to fetch mechanics:", err);
      setError("Failed to load service centers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedService]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchMechanics();
    }, 400);
    return () => clearTimeout(timeout);
  }, [fetchMechanics]);

  const visibleGarages = garages.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      
      <main className="pt-20">
        {/* Modern Hero Section */}
        <section className="relative py-20 overflow-hidden bg-slate-900 text-white">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/60 to-slate-900" />
          
          <div className="container relative z-10 mx-auto px-4 md:px-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest mb-6">
                Verified Service Network
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
                Find Expert <span className="text-blue-500">Mechanics</span> Near You
              </h1>
              <p className="text-slate-400 text-lg md:text-xl font-medium mb-10 leading-relaxed max-w-2xl mx-auto">
                Connect with certified service centers for everything from basic oil changes to complete engine overhauls.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 p-2 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search by workshop name or location..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 bg-white/95 text-slate-900 border-0 rounded-2xl placeholder:text-slate-500"
                  />
                </div>
                <Button className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                  Search Workshops
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Dynamic Filters */}
        <section className="sticky top-[80px] z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="container mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
              <div className="flex items-center gap-2 text-slate-400 shrink-0 pr-2 border-r border-slate-200">
                <Wrench size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Specialization</span>
              </div>
              <div className="flex items-center gap-2">
                {serviceTypes.map((service) => (
                  <button
                    key={service}
                    onClick={() => setSelectedService(service)}
                    className={cn(
                      "px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                      selectedService === service 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Listings Section */}
        <section className="py-16 container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Available Workshops</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Showing {visibleGarages.length} verified centers in your area
              </p>
            </div>
            
            <Select defaultValue="nearest">
              <SelectTrigger className="w-44 h-10 rounded-xl border-slate-200 font-bold text-xs bg-white">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearest" className="text-xs font-bold">Nearest First</SelectItem>
                <SelectItem value="rating" className="text-xs font-bold">Top Rated</SelectItem>
                <SelectItem value="experience" className="text-xs font-bold">Most Experienced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="wait">
              {loading && garages.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    <Wrench className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-blue-600/50" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Scanning verified network...</p>
                </div>
              ) : error ? (
                <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-destructive font-bold mb-6">{error}</p>
                  <Button variant="outline" className="rounded-xl px-8" onClick={() => fetchMechanics()}>Try Again</Button>
                </div>
              ) : visibleGarages.length === 0 ? (
                <div className="col-span-full text-center py-32 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                  <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-6">
                    <Search size={40} className="text-slate-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No workshops found</h3>
                  <p className="text-slate-500 font-medium italic">Try adjusting your search or specialization filter.</p>
                </div>
              ) : (
                visibleGarages.map((garage, index) => (
                  <motion.div
                    key={garage._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <Card className="rounded-[2.5rem] border-slate-200 overflow-hidden bg-white hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
                      <div className="relative h-56 overflow-hidden bg-slate-100">
                        {garage.avatar ? (
                          <img
                            src={resolveMediaUrl(garage.avatar)}
                            alt={garage.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-300">
                            <Wrench size={60} className="mb-2 opacity-20" />
                          </div>
                        )}
                        
                        {/* Status Overlays */}
                        <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
                          {garage.verified && (
                            <Badge className="bg-emerald-500 text-white border-none px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                              <ShieldCheck size={12} className="mr-1" />
                              Verified
                            </Badge>
                          )}
                          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm border border-white/20">
                            <Star size={12} className="text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black text-slate-900">{garage.rating || 4.5}</span>
                            <span className="text-[9px] font-bold text-slate-400 ml-0.5">({garage.reviewCount || 0})</span>
                          </div>
                        </div>

                        {garage.experienceYears > 0 && (
                          <div className="absolute bottom-5 left-5 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
                            {garage.experienceYears}+ Years Expert
                          </div>
                        )}
                      </div>

                      <CardContent className="p-7">
                        <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors truncate">
                          {garage.name}
                        </h3>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                              <MapPin size={14} />
                            </div>
                            <span className="text-xs font-bold text-slate-500 leading-relaxed line-clamp-2">{garage.address}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                              <Briefcase size={14} />
                            </div>
                            <span className="text-xs font-bold text-slate-500">Specializes in {garage.specialization}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-8">
                          {(garage.serviceDetails?.length > 0 ? garage.serviceDetails : garage.services).slice(0, 3).map((svc: any) => (
                            <Badge key={typeof svc === 'string' ? svc : svc.name} variant="outline" className="rounded-lg border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-500 px-2.5 py-1">
                              {typeof svc === 'string' ? svc : svc.name}
                            </Badge>
                          ))}
                          {(garage.serviceDetails?.length || garage.services.length) > 3 && (
                            <Badge variant="outline" className="rounded-lg border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 px-2 py-1">
                              +{(garage.serviceDetails?.length || garage.services.length) - 3}
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="h-12 flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] border-slate-200"
                            onClick={() => navigate(`/mechanic/${garage._id}`)}
                          >
                            Profile
                          </Button>
                          <Button
                            className="h-12 flex-[2] rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                            onClick={() => {
                              if (!user) { navigate('/login'); return; }
                              navigate(`/mechanic/${garage._id}`);
                            }}
                          >
                            <Calendar size={14} className="mr-2" />
                            Book Now
                          </Button>
                          <Button
                            variant="outline"
                            className="h-12 w-12 rounded-2xl border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-0"
                            onClick={() => {
                              if (!user) { navigate('/login'); return; }
                              navigate(`/chat?user=${garage._id}`);
                            }}
                          >
                            <MessageSquare size={18} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="text-center mt-16">
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-xs border-slate-200 hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
              onClick={() => setVisibleCount((prev) => prev + 6)}
              disabled={visibleCount >= garages.length}
            >
              {visibleCount >= garages.length ? "All Workshops Displayed" : "Load More Locations"}
              {visibleCount < garages.length && <ChevronRight size={16} className="ml-2" />}
            </Button>
          </div>
        </section>

        {/* Professional Value Props */}
        <section className="py-24 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 mx-auto shadow-sm">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Verified Professionals</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Every mechanic on Finding Moto is manually verified by our team for certification and skill.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                  <Clock size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Priority Booking</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Skip the queue with our online booking system. Schedule maintenance at your convenience.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-600 mx-auto shadow-sm">
                  <Star size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Trusted Reviews</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Read genuine feedback from fellow riders to find the perfect specialist for your bike.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-slate-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600 skew-x-[-20deg] translate-x-1/2 opacity-10" />
          <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Own a Garage?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-lg font-medium">
              Join the Finding Moto network to reach thousands of local riders. Manage bookings, services, and grow your reputation.
            </p>
            <Button 
              size="lg" 
              className="h-16 px-12 bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest rounded-2xl shadow-2xl transition-all active:scale-95"
              onClick={() => navigate("/register")}
            >
              Partner With Us
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Services;

