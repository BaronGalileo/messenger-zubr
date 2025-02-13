import axios from "axios";
import store  from "../store"; // Импорт из вашего Redux store
import { setAuth, removeAuth } from "../store/authSlice";

const API_URL = "http://127.0.0.1:8000/"

export async function refreshTokenIfNeeded() {
    const state = store.getState();
    const refreshToken = state.auth.refresh; // Достаем refresh токен
  
    if (refreshToken) {
      try {
        const res = await axios.post<{ access: string }>(
          `${API_URL}api/token/refresh/`,
          { refresh: refreshToken }
        );
        console.log("refresh", res.data.access);
  
        const newAccess = res.data.access;
        store.dispatch(
          setAuth({
            username: state.auth.username,
            access: newAccess,
            refresh: refreshToken,
            isAuth: true,
            confermAut: { headers: { Authorization: `Bearer ${newAccess}` } },
          })
        );
  
        return newAccess; // Вернем новый токен
      } catch (error) {
        store.dispatch(removeAuth()); // Если ошибка - разлогиним
        return null;
      }
    }
    return null;
  }