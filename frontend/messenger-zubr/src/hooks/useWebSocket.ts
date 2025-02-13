import { useState, useRef, useEffect } from "react";
import store from "../store";
import { refreshTokenIfNeeded } from "../services/refreshToken";


export function useWebSocket(roomId: number) {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);

    const connectWebSocket = async () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            console.log("WebSocket уже подключен.");
            return;
        }

        let token = store.getState().auth.access;

        if (!token) {
            console.log("Токен отсутствует, пробуем обновить...");
            token = await refreshTokenIfNeeded();
            if (!token) {
                console.error("Не удалось обновить токен, прерываем подключение");
                return;
            }
        }

        console.log("Используем токен для WebSocket:", token);
        socketRef.current = new WebSocket(`ws://localhost:8000/ws/messages/${roomId}/?token=${token}`);

        socketRef.current.onopen = () => {
            console.log("WebSocket подключен");
            setIsConnected(true);
        };

        socketRef.current.onmessage = (event) => {
            console.log("Сообщение от сервера: ", event.data);
        };

        socketRef.current.onerror = (error) => {
            console.error("Ошибка WebSocket: ", error);
        };

        socketRef.current.onclose = async (event) => {
            console.log("WebSocket отключен", event.code);
            setIsConnected(false);
            socketRef.current = null; // Очистка ссылки

            if (event.code === 1006 || event.code === 4001) {
                console.log("Токен мог стать недействительным, пробуем обновить...");
                const newToken = await refreshTokenIfNeeded();

                if (newToken) {
                    console.log("Переподключаемся с новым токеном...");
                    setTimeout(connectWebSocket, 1000);
                } else {
                    console.log("Не удалось обновить токен, переподключение невозможно");
                }
            }
        };
    };

    const sendMessage = (message: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ message }));
            console.log("Отправлено:", message);
        } else {
            console.error("WebSocket не подключен.");
        }
    };

    const disconnectWebSocket = () => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
            setIsConnected(false);
            console.log("WebSocket вручную отключен");
        }
    };

    useEffect(() => {
        return () => {
            disconnectWebSocket(); // Закрываем соединение при размонтировании компонента
        };
    }, []);

    return { isConnected, connectWebSocket, sendMessage, disconnectWebSocket };
}