import React, { useEffect, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";


export const ChatComponent = ({ roomId }: { roomId: number }) => {
    const { isConnected, connectWebSocket, sendMessage, messages,loadMoreMessages, hasMoreMessages, disconnectWebSocket, invitations, markMessagesAsRead } = useWebSocket(roomId);

    const [message, setMessage] = useState("");

    useEffect(() => {
        markMessagesAsRead(); 
    }, [connectWebSocket]);

    return (
        <div>
            <h2>Чат-комната {roomId}</h2>
            <div>
                {isConnected ? "🟢 Онлайн" : "🔴 Оффлайн"}
            </div>
            <div>
            <button onClick={connectWebSocket} disabled={isConnected}>
                {isConnected ? "Подключено" : "Подключиться"}
            </button>
            <button onClick={disconnectWebSocket} disabled={!isConnected}>
                Отключиться
            </button>
            {isConnected&&
            <div>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Введите сообщение"
                />
                <button
                    onClick={() => {
                        sendMessage(message);
                        setMessage(""); // Очищаем поле ввода после отправки
                    }}
                    disabled={!isConnected || !message}
                >Отправить
                </button>
            </div>}
        </div>

            <div>
                <h3>Сообщения:</h3>
                {messages.map((msg) => (
                    <div key={msg.id}>
                        <strong>{msg.sender}:</strong> {msg.text}
                    </div>
                ))}
            </div>
            <button onClick={loadMoreMessages} disabled={!hasMoreMessages}>
                Предыдущие сообщения
            </button>

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
