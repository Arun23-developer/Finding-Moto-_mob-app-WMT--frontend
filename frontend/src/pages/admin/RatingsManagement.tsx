import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Star,
  Loader2,
  AlertCircle,
  RefreshCw,
  Filter,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import api from "@/services/api";

interface Review {
  _id: string;
  rating: number;
  comment: string;
  buyer: { firstName: string; lastName: string; email: string } | null;
  productId?: string;
  sellerId?: string;
  mechanicId?: string;
  productName?: string;
  sellerName?: string;
  mechanicName?: string;
  createdAt: string;
}

interface RatingsStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  topRatedProducts: Array<{ name: string; rating: number; count: number }>;
  topRatedSellers: Array<{ name: string; rating: number; count: number }>;
  recentReviews: Review[];
}

function RatingStars({ rating, size = "small" }: { rating: number; size?: "small" | "large" }) {
  const sizeClass = size === "large" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function RatingsManagement() {
  const [stats, setStats] = useState<RatingsStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  const fetchReviews = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const params: Record<string, string | number> = {};
      if (search) params.search = search;
      if (ratingFilter !== "all") params.rating = ratingFilter;

      const { data } = await api.get("/admin/reviews", { params });
      if (data.success) {
        setStats(data.stats);
        setReviews(data.reviews || []);
      }
    } catch {
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [search, ratingFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchReviews(), 300);
    return () => clearTimeout(t);
  }, [fetchReviews]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
        <p className="text-sm font-medium">Loading reviews…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-3 text-red-500" />
        <p className="font-medium">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchReviews();
          }}
          className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Ratings & Reviews Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor and manage all product and seller ratings</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Reviews</p>
                  <p className="text-3xl font-bold mt-2 text-blue-600">{stats.totalReviews.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Average Rating</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-3xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                    <RatingStars rating={Math.round(stats.averageRating)} />
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">5-Star Reviews</p>
                  <p className="text-3xl font-bold mt-2 text-green-600">{stats.ratingDistribution[5] || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalReviews > 0
                      ? `${((((stats.ratingDistribution[5] || 0) / stats.totalReviews) * 100).toFixed(1))}%`
                      : "0%"}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Low Ratings (≤2)</p>
                  <p className="text-3xl font-bold mt-2 text-red-600">{(stats.ratingDistribution[1] || 0) + (stats.ratingDistribution[2] || 0)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingDistribution[rating] || 0;
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm font-semibold">{rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Top Rated Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topRatedProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No product ratings yet</p>
                ) : (
                  stats.topRatedProducts.slice(0, 5).map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.count} reviews</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm font-semibold">{product.rating.toFixed(1)}</span>
                        <RatingStars rating={Math.round(product.rating)} size="small" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Reviews */}
      <Card className="glass-card shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-base">Recent Reviews</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reviewer, product, or comment..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 items-center">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                  className="text-sm bg-transparent border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="all">All Ratings</option>
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No reviews found</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-sm">{review.buyer?.firstName} {review.buyer?.lastName}</p>
                        <RatingStars rating={review.rating} size="small" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {review.buyer?.email} • {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm">{review.comment}</p>
                      {(review.productName || review.sellerName || review.mechanicName) && (
                        <p className="text-xs text-muted-foreground mt-2">
                          For: {review.productName || review.sellerName || review.mechanicName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
