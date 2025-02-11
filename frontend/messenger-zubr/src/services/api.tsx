import axios, { AxiosError, AxiosRequestConfig } from "axios";
import store  from "../store";
import { setAuth, removeAuth } from "../store/authSlice";

const API_URL = "http://127.0.0.1:8000/"; 

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Интерсептор для автоматического добавления access-токена в запросы
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.access; // Достаем access из store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерсептор для обновления токена, если получили 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError
  ) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const state = store.getState();
        const refreshToken = state.auth.refresh; // Достаем refresh

        if (!refreshToken) {
          store.dispatch(removeAuth()); // Если нет refresh, разлогиниваем
          return Promise.reject(error);
        }

        // Запрос на обновление токена
        const res = await axios.post<{ access: string }>(`${API_URL}/api/token/refresh/`, { refresh: refreshToken });

        const newAccess = res.data.access;

        store.dispatch(setAuth({ 
          username: state.auth.username, 
          access: newAccess, 
          refresh: refreshToken,
          isAuth: true,
          confermAut: { headers: { Authorization: `Bearer ${newAccess}` } }
        }));

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        }
        return axios(originalRequest);
      } catch (refreshError) {
        store.dispatch(removeAuth()); // Разлогиниваем, если refresh невалидный
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
