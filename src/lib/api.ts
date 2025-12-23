import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const getApiBase = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  return process.env.NEXT_PUBLIC_API_BASE || process.env.VITE_API_BASE || '';
};

const API_BASE = getApiBase();

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Validate API base URL when making requests (not at module load time)
// Nota: Si no hay API configurada, el servicio userService usará automáticamente el mock
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Solo validar si realmente se está intentando hacer una llamada
    // El userService ya maneja el caso de API no configurada usando mocks
    if (!API_BASE && typeof window !== 'undefined') {
      throw new Error(
        'API base URL is not configured. Please set NEXT_PUBLIC_API_BASE or VITE_API_BASE environment variable in your .env.local file.',
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);

export { apiClient };
