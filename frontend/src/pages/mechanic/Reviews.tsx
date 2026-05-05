import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, MessageSquare, RefreshCw, ShoppingBag, Star, TrendingUp, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/services/api";
import { cn } from "@/lib/utils";

interface MechanicReviewStats {
  average: number;
  total: number;
}

interface ProductRatingItem {
  productId: string;
  productName: string;
  averageRating: number;
  totalReviewCount: number;
}

interface ServiceRatingItem {
  serviceId: string;
  serviceName: string;
  averageRating: number;
  totalReviewCount: number;
}

interface CustomerReviewItem {
  _id: string;
  itemType: "product" | "service";
  itemName: string;
  customerName: string;
  rating: number;
  comment: string;
  reviewDate: string;
}

interface MechanicReviewsResponse {
  stats: MechanicReviewStats;
  productRatings: ProductRatingItem[];
  serviceRatings: ServiceRatingItem[];
  customerReviews: CustomerReviewItem[];
}

const emptyReviewsData: MechanicReviewsResponse = {
  stats: { average: 0, total: 0 },
  productRatings: [],
  serviceRatings: [],
  customerReviews: [],
};

function normalizeReviewsData(value: unknown): MechanicReviewsResponse {
  if (Array.isArray(value)) {
    const customerReviews = value.map((review: any) => ({
      _id: String(review?._id || crypto.randomUUID()),
      itemType: review?.productId ? "product" : "service",
      itemName: review?.productId?.name || review?.serviceName || "Workshop Service",
      customerName: `${review?.buyer?.firstName || ""} ${review?.buyer?.lastName || ""}`.trim() || "Customer",
      rating: Number(review?.rating) || 0,
      comment: String(review?.comment || ""),
      reviewDate: String(review?.createdAt || new Date().toISOString()),
    }));
    const total = customerReviews.length;
    const sum = customerReviews.reduce((acc, review) => acc + review.rating, 0);
    return {
      ...emptyReviewsData,
      stats: { average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0, total },
      customerReviews,
    };
  }

  const data = (value || {}) as Partial<MechanicReviewsResponse>;
  const stats = data.stats || emptyReviewsData.stats;

  return {
    stats: {
      average: Number(stats.average) || 0,
      total: Number(stats.total) || 0,
    },
    productRatings: Array.isArray(data.productRatings) ? data.productRatings : [],
    serviceRatings: Array.isArray(data.serviceRatings) ? data.serviceRatings : [],
    customerReviews: Array.isArray(data.customerReviews) ? data.customerReviews : [],
  };
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const starClass = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(starClass, star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200")}
        />
      ))}
    </div>
  );
}

const formatReviewDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function RatingGridCard({
  title,
  items,
  emptyLabel,
  icon: Icon,
}: {
  title: string;
  items: Array<{ id: string; name: string; averageRating: number; totalReviewCount: number }>;
  emptyLabel: string;
  icon: any;
}) {
  return (
    <Card className="glass-card border border-border/40 overflow-hidden shadow-sm">
      <CardHeader className="bg-muted/20 border-b border-border/20 py-4 px-6 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">{title}</CardTitle>
        <Icon size={16} className="text-blue-500 opacity-50" />
      </CardHeader>
      <CardContent className="p-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border/40 py-12 text-center text-muted-foreground flex flex-col items-center">
            <Icon className="h-10 w-10 opacity-10 mb-3" />
            <p className="text-xs font-black uppercase tracking-widest">{emptyLabel}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/40 bg-muted/5 p-4 hover:bg-muted/10 transition-colors group">
                <p className="line-clamp-1 text-xs font-black uppercase tracking-wider text-foreground group-hover:text-blue-600 transition-colors">{item.name}</p>
                <div className="mt-3 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-amber-500 leading-none">{item.averageRating.toFixed(1)}</span>
                      <StarRating rating={item.averageRating} />
                   </div>
                   <Badge variant="outline" className="text-[9px] font-black uppercase border-blue-100 text-blue-600">{item.totalReviewCount} Feedback</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MechanicReviews() {
  const [data, setData] = useState<MechanicReviewsResponse>({
    stats: { average: 0, total: 0 },
    productRatings: [],
    serviceRatings: [],
    customerReviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const response = await api.get("/mechanic/reviews");
      if (response.data?.success) {
        setData(normalizeReviewsData(response.data.data));
      } else {
        setError("Failed to load your workshop feedback.");
      }
    } catch {
      setError("Unable to connect to review service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const highlightedService = useMemo(
    () => [...data.serviceRatings].sort((a, b) => b.averageRating - a.averageRating).find((item) => item.totalReviewCount > 0),
    [data.serviceRatings]
  );

  if (loading) {
    return (
      <div className="space-y-6 p-4 animate-pulse">
        <div className="h-12 w-64 bg-muted rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
           <div className="h-40 bg-muted rounded-2xl" />
           <div className="h-40 bg-muted rounded-2xl" />
        </div>
        <div className="h-96 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <Star className="text-amber-500 fill-amber-500" size={32} />
             Workshop Feedback
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium italic">Comprehensive ratings for your workshop products and services.</p>
        </div>
        <Button variant="outline" onClick={fetchReviews} className="h-11 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest border-border/60">
           <RefreshCw size={14} className={cn(loading && "animate-spin")} />
           <span>Refresh Reviews</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.5fr]">
        <Card className="glass-card border border-border/40 overflow-hidden relative shadow-lg">
          <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150">
                <Star size={120} fill="white" />
             </div>
             <div className="relative z-10">
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Combined Performance</p>
                <div className="flex items-baseline gap-4">
                   <h2 className="text-6xl font-black tracking-tighter">{data.stats.average.toFixed(1)}</h2>
                   <div>
                      <StarRating rating={data.stats.average} size="lg" />
                      <p className="text-blue-100 text-[10px] font-bold mt-2 uppercase tracking-widest">Based on {data.stats.total} Total Reviews</p>
                   </div>
                </div>
             </div>
          </div>
          <CardContent className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/10 rounded-2xl p-4 border border-border/20">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Products Rated</p>
                   <p className="text-2xl font-black text-foreground">{data.productRatings.filter(i => i.totalReviewCount > 0).length}</p>
                </div>
                <div className="bg-muted/10 rounded-2xl p-4 border border-border/20">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Services Rated</p>
                   <p className="text-2xl font-black text-foreground">{data.serviceRatings.filter(i => i.totalReviewCount > 0).length}</p>
                </div>
             </div>
             <Separator className="bg-border/20" />
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                   <TrendingUp size={24} />
                </div>
                <div>
                   <p className="text-sm font-black text-foreground">Top Rated Focus</p>
                   <p className="text-xs text-muted-foreground italic truncate max-w-[200px]">{highlightedService?.serviceName || "No top highlight available"}</p>
                </div>
             </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <RatingGridCard
            title="Service Category Ratings"
            icon={Wrench}
            items={data.serviceRatings.map((item) => ({
              id: item.serviceId,
              name: item.serviceName,
              averageRating: item.averageRating,
              totalReviewCount: item.totalReviewCount,
            }))}
            emptyLabel="No rated services yet"
          />

          <RatingGridCard
            title="Retail Product Ratings"
            icon={ShoppingBag}
            items={data.productRatings.map((item) => ({
              id: item.productId,
              name: item.productName,
              averageRating: item.averageRating,
              totalReviewCount: item.totalReviewCount,
            }))}
            emptyLabel="No rated products yet"
          />
        </div>
      </div>

      <Card className="glass-card border border-border/40 overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/20 border-b border-border/20 py-4 px-6 flex flex-row items-center justify-between">
           <div>
              <CardTitle className="text-base font-black uppercase tracking-widest text-foreground">Detailed Customer Feedback</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-1 font-bold italic">Latest 50 reviews from workshop visitors</p>
           </div>
           <MessageSquare size={18} className="text-blue-600 opacity-40" />
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] w-full">
             <div className="divide-y divide-border/20">
                {data.customerReviews.length === 0 ? (
                   <div className="py-24 text-center">
                      <MessageSquare className="h-16 w-16 text-muted-foreground/10 mx-auto mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">No customer testimonials found</p>
                   </div>
                ) : (
                   data.customerReviews.map((review) => (
                      <div key={review._id} className="p-8 hover:bg-muted/10 transition-colors group">
                         <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex items-start gap-4">
                               <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 border border-border/40 uppercase group-hover:bg-white transition-colors">
                                  {review.customerName.charAt(0)}
                               </div>
                               <div>
                                  <div className="flex items-center gap-3 mb-1">
                                     <span className="font-black text-foreground uppercase tracking-wider">{review.customerName}</span>
                                     <span className="h-1 w-1 rounded-full bg-slate-300" />
                                     <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{review.itemType}</span>
                                  </div>
                                  <p className="text-sm font-black text-foreground group-hover:text-blue-600 transition-colors">{review.itemName}</p>
                                  <div className="mt-4 p-5 rounded-2xl bg-muted/20 border border-border/40 relative">
                                     <div className="absolute -top-2 left-4 px-2 bg-background border border-border/40 rounded flex items-center gap-1.5 py-0.5">
                                        <StarRating rating={review.rating} />
                                        <span className="text-[10px] font-black text-amber-600">{review.rating.toFixed(1)}</span>
                                     </div>
                                     <p className="text-xs leading-relaxed text-muted-foreground font-medium italic">"{review.comment || "The workshop provided professional service and was very thorough in their work."}"</p>
                                  </div>
                               </div>
                            </div>
                            <div className="text-left md:text-right shrink-0">
                               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1 flex items-center md:justify-end gap-1.5">
                                  <Clock size={10} className="text-blue-500" />
                                  {formatReviewDate(review.reviewDate)}
                               </p>
                               <Badge variant="outline" className="mt-2 text-[9px] font-black uppercase border-emerald-100 text-emerald-600 bg-emerald-50/30">Verified Purchase</Badge>
                            </div>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Card className="glass-card border border-border/40 bg-gradient-to-br from-amber-500/5 via-amber-500/[0.02] to-transparent overflow-hidden">
         <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-[3] -rotate-12">
               <Star size={100} className="text-amber-600" fill="currentColor" />
            </div>
            <div className="flex items-center gap-8 relative z-10 text-center md:text-left">
               <div className="h-20 w-20 rounded-3xl bg-amber-500 flex items-center justify-center text-white shadow-2xl shadow-amber-500/30 ring-8 ring-amber-500/10">
                  <CheckCircle2 size={40} />
               </div>
               <div>
                  <h3 className="text-3xl font-black text-foreground tracking-tighter">Maintain Excellence</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-[450px] font-medium leading-relaxed italic">
                     Your overall rating is <span className="text-amber-600 font-black">{data.stats.average.toFixed(1)}</span>. Consistently responding to feedback increases your workshop visibility in the <span className="text-blue-600 font-black uppercase tracking-widest text-xs not-italic">Finding Moto</span> marketplace.
                  </p>
               </div>
            </div>
            <Button className="h-14 px-10 rounded-2xl bg-foreground text-background font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all shadow-xl active:scale-95 relative z-10">
               View Strategy
            </Button>
         </CardContent>
      </Card>
    </div>
  );
}
