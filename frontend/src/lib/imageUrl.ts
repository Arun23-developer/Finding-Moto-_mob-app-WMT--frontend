const DEFAULT_PRODUCT_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="24">Bike Part</text></svg>'
  );

function getApiOrigin(): string {
  const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim();
  const apiUrl = configuredApiUrl || "/api";
  if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
    return apiUrl.replace(/\/api\/?$/i, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export function resolveMediaUrl(input?: string | null, fallback = DEFAULT_PRODUCT_FALLBACK): string {
  if (!input) return fallback;

  const raw = input.trim();
  if (!raw) return fallback;

  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }

  const apiOrigin = getApiOrigin();
  const normalized = raw.replace(/\\/g, "/");

  let withoutApiPrefix = normalized.startsWith("/api/uploads/")
    ? normalized.replace("/api/uploads/", "/uploads/")
    : normalized;

  const uploadPos = withoutApiPrefix.toLowerCase().indexOf("uploads/");
  if (uploadPos > 0) {
    withoutApiPrefix = `/${withoutApiPrefix.slice(uploadPos)}`;
  }

  const absolutePath = withoutApiPrefix.startsWith("/") ? withoutApiPrefix : `/${withoutApiPrefix}`;
  const lowerPath = absolutePath.toLowerCase();
  const needsUploadsPrefix = lowerPath.startsWith("/products/") || lowerPath.startsWith("/avatars/");
  const normalizedPath = needsUploadsPrefix ? `/uploads${absolutePath}` : absolutePath;

  return apiOrigin ? `${apiOrigin}${normalizedPath}` : normalizedPath;
}

export function resolveProductImage(
  product: { image?: string | null; images?: string[] },
  fallback = DEFAULT_PRODUCT_FALLBACK
): string {
  const img = product.image || product.images?.[0] || null;
  return resolveMediaUrl(img, fallback);
}
