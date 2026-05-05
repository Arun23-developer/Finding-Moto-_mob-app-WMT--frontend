import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Loader2, Store, Star, Package, MapPin, Phone, ArrowLeft } from "lucide-react";
import api from "../services/api";
import { formatLkr } from "@/lib/currency";
import { resolveProductImage, resolveMediaUrl } from "@/lib/imageUrl";
import { ReportDialog } from "@/components/ReportDialog";

interface Seller {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string | null;
  shopName?: string;
  shopDescription?: string;
  shopLocation?: string;
  sellerSpecializations?: string[];
  sellerBrands?: string[];
  name: string;
}

interface SellerStats {
  rating: number;
  reviewCount: number;
  productCount: number;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string | null;
  images: string[];
  brand: string;
  category: string;
  inStock: boolean;
}

interface SellerProfileResponse {
  seller: Seller;
  stats: SellerStats;
  products: Product[];
}

const PublicSellerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<SellerProfileResponse | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError("");
        const { data: res } = await api.get(`/public/sellers/${id}`);
        if (res.success) {
          setProfile(res.data);
        }
      } catch {
        setError("Failed to load seller profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="ml-3 text-muted-foreground">Loading seller profile...</span>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || "Seller not found"}</p>
            <Button variant="outline" onClick={() => navigate("/products")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Header />
      <main className="page-main">
        <div className="container py-8">
          <Button variant="ghost" className="mb-6" onClick={() => navigate("/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>

          <section className="panel-card p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                {profile.seller.avatar ? (
                  <img
                    src={resolveMediaUrl(profile.seller.avatar, "https://placehold.co/200x200?text=Seller")}
                    alt={profile.seller.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{profile.seller.name}</h1>
                <p className="text-muted-foreground mb-3">
                  by {profile.seller.firstName} {profile.seller.lastName}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile.seller.shopLocation && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {profile.seller.shopLocation}
                    </span>
                  )}
                  {profile.seller.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      {profile.seller.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                <div className="px-4 py-3 rounded-lg bg-secondary text-center">
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="font-bold text-foreground">{profile.stats.rating}</p>
                </div>
                <div className="px-4 py-3 rounded-lg bg-secondary text-center">
                  <p className="text-sm text-muted-foreground">Reviews</p>
                  <p className="font-bold text-foreground">{profile.stats.reviewCount}</p>
                </div>
                <div className="px-4 py-3 rounded-lg bg-secondary text-center">
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="font-bold text-foreground">{profile.stats.productCount}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <ReportDialog
                category="ACCOUNT"
                targetId={profile.seller._id}
                title="Report Seller Account"
                triggerLabel="Report Account"
              />
            </div>

            {profile.seller.shopDescription && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{profile.seller.shopDescription}</p>
            )}

            {Array.isArray(profile.seller.sellerSpecializations) && profile.seller.sellerSpecializations.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-foreground mb-2">Services Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.seller.sellerSpecializations.map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Products by this seller</h2>

            {profile.products.length === 0 ? (
              <div className="panel-card p-8 text-center">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No products available right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {profile.products.map((product) => {
                  const imageUrl = resolveProductImage(product, "https://placehold.co/400x400?text=No+Image");
                  return (
                    <div
                      key={product._id}
                      className="panel-card-interactive cursor-pointer"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-secondary">
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4">
                        <p className="text-xs font-medium text-accent mb-1">{product.brand}</p>
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{product.name}</h3>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span className="text-sm font-medium">{product.rating}</span>
                          <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-foreground">{formatLkr(product.price)}</span>
                          <span className={`text-xs font-semibold ${product.inStock ? "text-green-600" : "text-red-600"}`}>
                            {product.inStock ? "In stock" : "Out of stock"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicSellerProfile;
