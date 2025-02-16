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
    const [hasMoreMessages, setHasMoreMessages] = useState(true); // Флаг наличия старых сообщений
    const isLoadingMore = useRef(false); // Флаг загрузки
    const socketRef = useRef<WebSocket | null>(null);


    useEffect(() => {

    }, [])

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
        socketRef.current = new WebSocket(`ws://localhost:8000/ws/messages/${roomId}/?token=${token}`);

        socketRef.current.onopen = () => {
            console.log("✅ WebSocket подключен");
            setIsConnected(true);
        };


        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("📩 Сообщение от сервера:", data);

            if (data.action === "initial_messages") {
                console.log("📜 Загружены последние сообщения:", data.messages);
                setMessages((prev) => [...data.messages, ...prev]);          
            } else if (data.action === "new_message") {
                console.log("🆕 Новое сообщение:", data.message);
                setMessages((prev) => [...prev, data.message]); // Добавляем в state
            } else if (data.action === "invitation") {
                console.log("📩 Приглашение в беседу:", data.conversation);
                setInvitations((prev) => [...prev, data]); // Добавляем в state
            } else if (data.action === "messages_read") { 
                console.log(`👀 Сообщения в беседе ${data.conversation_id} прочитал пользователь ${data.read_by}`);
            } else if (data.action === "load_more_messages") {
                if (data.messages.length === 0) {
                    setHasMoreMessages(false);
                } else {
                    console.log("⬆️ Загружены старые сообщения:", data.messages);
                    setMessages((prev) => [...data.messages.reverse(), ...prev]);  // Добавляем в начало
                }
            isLoadingMore.current = false;
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

    const loadMoreMessages = () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && hasMoreMessages && !isLoadingMore.current) {
            isLoadingMore.current = true;
            const lastMessageId = messages[0]?.id;
            console.log(messages)
            if (!lastMessageId) return;

            const requestData = {
                action: "load_more_messages",
                last_message_id: lastMessageId,
            };
            socketRef.current.send(JSON.stringify(requestData));
            console.log("⬆️ Запрос на загрузку старых сообщений:", requestData);
        } else {
            console.warn("⛔ WebSocket не подключен или все сообщения загружены.");
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
        markMessagesAsRead,
        loadMoreMessages,
        hasMoreMessages
    };
}