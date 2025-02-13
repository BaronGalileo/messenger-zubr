import { useState, useRef, useEffect } from "react";
import store from "../store";
import { refreshTokenIfNeeded } from "../services/refreshToken";

interface Message {
    id: number;
    conversation_id: number;
    sender: number;
    text: string;
    created_at: string;
}

interface Invitation {
    conversation: {
        id: number;
        name: string;
    };
}

export function useWebSocket(roomId: number) {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
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
            console.log("✅ WebSocket подключен");
            setIsConnected(true);
        };


        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("📩 Сообщение от сервера:", data);
            
            if (data.action === "new_message") {
                console.log("🆕 Новое сообщение:", data.message);
                setMessages((prev) => [...prev, data.message]); // Добавляем в state
            } else if (data.action === "invitation") {
                console.log("📩 Приглашение в беседу:", data.conversation);
                setInvitations((prev) => [...prev, data]); // Добавляем в state
            } else if (data.action === "messages_read") { // ✅ Новый обработчик
                console.log(`👀 Сообщения в беседе ${data.conversation_id} прочитал пользователь ${data.read_by}`);
            }
        };

        socketRef.current.onerror = (error) => {
            console.error("❌ Ошибка WebSocket: ", error);
        };

        socketRef.current.onclose = async (event) => {
            console.log("🔌 WebSocket отключен", event.code);
            setIsConnected(false);
            socketRef.current = null;

            if (event.code === 1006 || event.code === 4001) {
                console.log("🔄 Токен мог истечь, пробуем обновить...");
                const newToken = await refreshTokenIfNeeded();

                if (newToken) {
                    console.log("♻️ Переподключаемся с новым токеном...");
                    setTimeout(connectWebSocket, 1000);
                } else {
                    console.log("⛔ Не удалось обновить токен, переподключение невозможно");
                }
            }
        };
    };

    const sendMessage = (text: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const messageData = {
                action: "send_message",
                conversation_id: roomId,
                text: text,
            };
            socketRef.current.send(JSON.stringify(messageData));
            console.log("📤 Отправлено сообщение:", messageData);
        } else {
            console.error("⛔ WebSocket не подключен.");
        }
    };

    const inviteUser = (userIds: number[]) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const inviteData = {
                action: "invite_user",
                conversation_id: roomId,
                user_ids: userIds,
            };
            socketRef.current.send(JSON.stringify(inviteData));
            console.log("📩 Отправлен запрос на приглашение пользователей:", inviteData);
        } else {
            console.error("⛔ WebSocket не подключен.");
        }
    };

    const disconnectWebSocket = () => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
            setIsConnected(false);
            console.log("❌ WebSocket вручную отключен");
        }
    };

    const markMessagesAsRead = () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const readData = {
                action: "mark_as_read",
                conversation_id: roomId,
            };
            socketRef.current.send(JSON.stringify(readData));
            console.log("✅ Отправлен запрос на отметку сообщений как прочитанных:", readData);
        } else {
            console.error("⛔ WebSocket не подключен.");
        }
    };

    useEffect(() => {
        return () => {
            disconnectWebSocket();
        };
    }, []);

    return { 
        isConnected, 
        connectWebSocket, 
        sendMessage, 
        inviteUser, 
        disconnectWebSocket, 
        messages, 
        invitations,
        markMessagesAsRead 
    };
}