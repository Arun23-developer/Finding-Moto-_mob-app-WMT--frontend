import api from './api';

export interface ReviewData {
  rating: number;
  comment: string;
}

export interface Review {
  _id: string;
  productId?: string;
  sellerId?: string;
  mechanicId?: string;
  buyer?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string | null;
  };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  average: number;
  total: number;
  recommended: number;
}

export interface ReviewResponse {
  success: boolean;
  data: {
    stats: ReviewStats;
    distribution: Array<{ stars: number; count: number; percentage: number }>;
    reviews: Review[];
  };
}

// Product Reviews
const getReviews = async (productId: string): Promise<Review[]> => {
  const response = await api.get(`/reviews/${productId}`);
  return response.data;
};

const addReview = async (productId: string, reviewData: ReviewData): Promise<Review> => {
  const response = await api.post(`/reviews/${productId}`, reviewData);
  return response.data;
};

const getMyReviews = async (): Promise<Review[]> => {
  const response = await api.get('/reviews/my');
  return response.data;
};

// Seller Reviews
const getSellerReviews = async (sellerId: string): Promise<ReviewResponse> => {
  const response = await api.get(`/reviews/seller/${sellerId}`);
  return response.data;
};

const addSellerReview = async (sellerId: string, reviewData: ReviewData): Promise<Review> => {
  const response = await api.post(`/reviews/seller/${sellerId}`, reviewData);
  return response.data;
};

// Mechanic Reviews
const getMechanicReviews = async (mechanicId: string): Promise<ReviewResponse> => {
  const response = await api.get(`/reviews/mechanic/${mechanicId}`);
  return response.data;
};

const addMechanicReview = async (mechanicId: string, reviewData: ReviewData): Promise<Review> => {
  const response = await api.post(`/reviews/mechanic/${mechanicId}`, reviewData);
  return response.data;
};

export default {
  // Product Reviews
  getReviews,
  addReview,
  getMyReviews,
  // Seller Reviews
  getSellerReviews,
  addSellerReview,
  // Mechanic Reviews
  getMechanicReviews,
  addMechanicReview,
};
