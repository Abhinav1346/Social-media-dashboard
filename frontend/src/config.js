const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://social-media-dashboard-backend-6pb0.onrender.com';

export const API_URL = `${BASE_URL}/api`;
export const SOCKET_URL = BASE_URL;
export const MEDIA_URL = BASE_URL;