import axios, { AxiosError, AxiosRequestConfig } from "axios";
import store  from "../store";
import { setAuth, removeAuth } from "../store/authSlice";
import { refreshTokenIfNeeded } from "./refreshToken";

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
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshTokenIfNeeded(); // Ждем новый токен

        if (newAccessToken) {
          // Обновляем заголовок Authorization для повторного запроса
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          // Повторно выполняем запрос с новым токеном
          return axios(originalRequest);
        }
        else console.log("Не удалось обновить токен");

        // Если не удалось обновить токен, разлогиниваем
        store.dispatch(removeAuth());
        return Promise.reject(new Error("Не удалось обновить токен"));

      } catch (refreshError) {
        store.dispatch(removeAuth()); // Разлогиниваем, если refresh невалидный
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);