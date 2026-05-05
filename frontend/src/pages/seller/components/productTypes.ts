export interface SellerProduct {
  _id: string;
  name?: string;
  sku?: string;
  brand?: string;
  category?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  stock?: number;
  status?: string;
  productStatus?: string;
  images?: string[];
  type?: string;
}

export interface ProductFormValues {
  name: string;
  sku: string;
  actualPrice: string;
  discountPrice: string;
  stock: string;
  category: string;
  brand: string;
  description: string;
  status: string;
  visibilityStatus: string;
  images?: string[];
}

export interface ProductListMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}