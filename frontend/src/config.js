// Central Configuration for Production/Development URLs
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_URL = `${BASE_URL}/api`;
export const SOCKET_URL = BASE_URL;
export const MEDIA_URL = BASE_URL;
