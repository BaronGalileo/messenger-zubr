import { useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";


export const TestChat = () => {
    const { isConnected, connectWebSocket, sendMessage, disconnectWebSocket } = useWebSocket(3);
    const [message, setMessage] = useState("");

    return (
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
    );
}

