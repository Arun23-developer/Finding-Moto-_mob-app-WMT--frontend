import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = (() => {
  const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();
  const proxyTarget = (import.meta.env.VITE_API_PROXY_TARGET || '').trim();
  const devProxyTarget = import.meta.env.DEV
    ? (proxyTarget || 'http://127.0.0.1:5000').trim()
    : proxyTarget;

  const normalizeApiUrl = (value: string) => value.replace(/\/$/, '');
  const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);
  const joinBaseAndPath = (base: string, apiPath: string) => {
    const normalizedBase = normalizeApiUrl(base);
    const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
    return `${normalizedBase}${normalizedPath}`;
  };

  const ensureApiSuffix = (base: string) => {
    const normalized = normalizeApiUrl(base);
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  };

  if (configuredApiUrl) {
    const normalizedConfiguredUrl = normalizeApiUrl(configuredApiUrl);

    if (import.meta.env.DEV && devProxyTarget && !isAbsoluteUrl(normalizedConfiguredUrl)) {
      return joinBaseAndPath(devProxyTarget, normalizedConfiguredUrl);
    }

    if (import.meta.env.DEV && devProxyTarget && isAbsoluteUrl(normalizedConfiguredUrl)) {
      try {
        const configuredUrl = new URL(normalizedConfiguredUrl);
        const isLocalHost = configuredUrl.hostname === 'localhost' || configuredUrl.hostname === '127.0.0.1';
        const isLikelyFrontendPort = configuredUrl.port === '3000' || configuredUrl.port === '5173';

        if (isLocalHost && isLikelyFrontendPort) {
          return ensureApiSuffix(devProxyTarget);
        }
      } catch {
      }
    }

    return normalizedConfiguredUrl;
  }

  if (import.meta.env.DEV && devProxyTarget) return ensureApiSuffix(devProxyTarget);
  return '/api';
})();

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');

    if (config.data instanceof FormData && config.headers) {
      // Let browser/axios set multipart boundary automatically for file uploads.
      delete config.headers['Content-Type'];
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login on 401 if we were on a protected route (not /public/)
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isPublicRoute = url.includes('/public/');
      if (!isPublicRoute) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
