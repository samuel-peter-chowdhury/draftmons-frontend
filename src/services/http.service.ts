import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_URL } from '../utils/constants';

class HttpService {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: API_URL,
      withCredentials: true, // Always send cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.http.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Session expired - trigger logout
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.http.get<T>(url, config);
  }

  post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.http.post<T>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.http.put<T>(url, data, config);
  }

  patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.http.patch<T>(url, data, config);
  }

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.http.delete<T>(url, config);
  }
}

export default new HttpService();