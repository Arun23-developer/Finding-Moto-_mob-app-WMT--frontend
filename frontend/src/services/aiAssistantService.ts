import axios from 'axios';
import api from './api';

export type AIRole = 'buyer' | 'seller' | 'mechanic';

export interface SellerAIReport {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  reviewCount: number;
  averageRating: number;
  topSellingProducts: Array<{
    name: string;
    sales: number;
    stock: number;
    price: number;
  }>;
  lowStockList: Array<{
    name: string;
    stock: number;
  }>;
}

export interface SellerAIResponse {
  answer: string;
  report?: SellerAIReport;
}

export interface MechanicAIReport {
  totalServices: number;
  activeServices: number;
  totalJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageJobValue: number;
  reviewCount: number;
  averageRating: number;
  topRequestedServices: Array<{
    name: string;
    requests: number;
  }>;
}

export interface MechanicAIResponse {
  answer: string;
  report?: MechanicAIReport;
}

interface AskAIOptions {
  imageDataUrl?: string;
  productName?: string;
}

interface AskAIResponse {
  success: boolean;
  data?: {
    answer: string;
    report?: SellerAIReport | MechanicAIReport;
  };
  message?: string;
}

const buildConnectionFallback = (message: string, role: AIRole): string => {
  const clean = message.trim();

  if (role === 'seller') {
    return `I could not reach live AI right now, but I can still help.\n\nFor your seller request: "${clean}", share product name, vehicle model, and your cost price, and I will give:\n- A clean product description\n- Suggested selling price tiers\n- Quick listing tips for better conversion.`;
  }

  if (role === 'mechanic') {
    return `I could not reach live AI right now, but I can still help.\n\nPlease share bike model, issue symptoms, and repair goal, and I will provide:\n- Likely causes\n- Step-by-step checks\n- Basic service cost range.`;
  }

  return `I could not reach live AI right now, but I can still help.\n\nShare your bike model and what you need (part, issue, or budget), and I will give a practical recommendation.`;
};

export const askAIAssistant = async (message: string, role: AIRole, options?: AskAIOptions): Promise<string> => {
  try {
    const { data } = await api.post<AskAIResponse>('/ai/chat', {
      message,
      role,
      imageDataUrl: options?.imageDataUrl,
      productName: options?.productName,
    });

    if (!data.success || !data.data?.answer) {
      throw new Error(data.message || 'Unable to get AI response');
    }

    return data.data.answer;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        throw new Error(error.response?.data?.message || 'Not authorized for AI chat');
      }

      return buildConnectionFallback(message, role);
    }

    return buildConnectionFallback(message, role);
  }
};

export const askSellerAIAssistant = async (message: string, options?: AskAIOptions): Promise<SellerAIResponse> => {
  try {
    const { data } = await api.post<AskAIResponse>('/ai/chat', {
      message,
      role: 'seller',
      imageDataUrl: options?.imageDataUrl,
      productName: options?.productName,
    });

    if (!data.success || !data.data?.answer) {
      throw new Error(data.message || 'Unable to get AI response');
    }

    return {
      answer: data.data.answer,
      report: data.data.report,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        throw new Error(error.response?.data?.message || 'Not authorized for AI chat');
      }
    }

    return {
      answer: buildConnectionFallback(message, 'seller'),
    };
  }
};

export const askMechanicAIAssistant = async (message: string, options?: AskAIOptions): Promise<MechanicAIResponse> => {
  try {
    const { data } = await api.post<AskAIResponse>('/ai/chat', {
      message,
      role: 'mechanic',
      imageDataUrl: options?.imageDataUrl,
      productName: options?.productName,
    });

    if (!data.success || !data.data?.answer) {
      throw new Error(data.message || 'Unable to get AI response');
    }

    return {
      answer: data.data.answer,
      report: data.data.report as MechanicAIReport | undefined,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        throw new Error(error.response?.data?.message || 'Not authorized for AI chat');
      }
    }

    return {
      answer: buildConnectionFallback(message, 'mechanic'),
    };
  }
};
