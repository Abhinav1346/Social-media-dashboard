// Central Configuration for Production/Development URLs

const PRODUCTION_BACKEND_ORIGIN = "https://social-media-dashboard-backend-6pb0.onrender.com";
const DEVELOPMENT_BACKEND_ORIGIN = "http://localhost:5000";
const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const isLocalApiUrl = configuredApiUrl?.includes("localhost") || configuredApiUrl?.includes("127.0.0.1");
const apiUrl =
  configuredApiUrl && !(import.meta.env.PROD && isLocalApiUrl)
    ? configuredApiUrl
    : `${import.meta.env.DEV ? DEVELOPMENT_BACKEND_ORIGIN : PRODUCTION_BACKEND_ORIGIN}/api`;

const backendOrigin = apiUrl.replace(/\/api$/, "");

export const API_URL = apiUrl;

export const SOCKET_URL = backendOrigin;

export const MEDIA_URL = backendOrigin;
