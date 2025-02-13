import React, { useEffect } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";


export const ChatComponent = ({ roomId }: { roomId: number }) => {
    const { isConnected, connectWebSocket, sendMessage, messages, invitations, markMessagesAsRead } = useWebSocket(roomId);

    useEffect(() => {
        connectWebSocket();
        markMessagesAsRead(); // Отметить сообщения как прочитанные при подключении
    }, [connectWebSocket, markMessagesAsRead]);

    return (
        <div>
            <h2>Чат-комната {roomId}</h2>
            <div>
                {isConnected ? "🟢 Онлайн" : "🔴 Оффлайн"}
            </div>

            <div>
                <h3>Сообщения:</h3>
                {messages.map((msg) => (
                    <div key={msg.id}>
                        <strong>{msg.sender}:</strong> {msg.text}
                    </div>
                ))}
            </div>

            <div>
                <h3>Приглашения:</h3>
                {invitations.map((inv, index) => (
                    <div key={index}>
                        📩 Вас пригласили в: {inv.conversation.name}
                    </div>
                ))}
            </div>

            <input 
                type="text" 
                placeholder="Введите сообщение..."
                onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage(e.currentTarget.value);
                }}
            />
        </div>
    );
};
