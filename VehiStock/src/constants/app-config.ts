export const APP_CONFIG = {
  name: 'VehiStock',
  tagline: 'Vehicle Parts Selling & Inventory Management System',
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ??
    'http://localhost:5000',
  authStorageKey: 'vehistock.auth.session',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
} as const
