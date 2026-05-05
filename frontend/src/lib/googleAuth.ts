const DEFAULT_DEV_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const hasExplicitAllowedOrigins = (): boolean =>
  Boolean((import.meta.env.VITE_GOOGLE_ALLOWED_ORIGINS || '').trim());

const parseAllowedOrigins = (): string[] => {
  const configured = (import.meta.env.VITE_GOOGLE_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value: string) => value.trim())
    .filter(Boolean);

  return configured.length > 0 ? configured : DEFAULT_DEV_ALLOWED_ORIGINS;
};

export const getGoogleClientId = (): string => (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

export const getGoogleAuthIssue = (): string | null => {
  const clientId = getGoogleClientId();
  if (!clientId) {
    return 'Google sign-in is unavailable because VITE_GOOGLE_CLIENT_ID is not configured.';
  }

  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return null;
  }

  const allowedOrigins = parseAllowedOrigins();
  const currentOrigin = window.location.origin;

  if (!hasExplicitAllowedOrigins() && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(currentOrigin)) {
    return 'Google sign-in is disabled for local development until VITE_GOOGLE_ALLOWED_ORIGINS includes this origin and the same origin is added in Google Cloud OAuth settings.';
  }

  if (!allowedOrigins.includes(currentOrigin)) {
    return `Google sign-in is disabled on ${currentOrigin}. Add this origin to the Google OAuth client's Authorized JavaScript origins.`;
  }

  return null;
};

export const canUseGoogleAuth = (): boolean => getGoogleAuthIssue() === null;
