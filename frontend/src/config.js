// Central Configuration for Production/Development URLs

const PRODUCTION_BACKEND_URL = "https://social-media-dashboard-backend-6pb0.onrender.com/api";
const configuredApiUrl = import.meta.env.VITE_API_URL;
const isLocalApiUrl = configuredApiUrl?.includes("localhost") || configuredApiUrl?.includes("127.0.0.1");

export const API_URL =
  configuredApiUrl && !(import.meta.env.PROD && isLocalApiUrl)
    ? configuredApiUrl
    : `${PRODUCTION_BACKEND_URL}/api`;

export const SOCKET_URL = PRODUCTION_BACKEND_URL;

export const MEDIA_URL = PRODUCTION_BACKEND_URL;
