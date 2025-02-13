import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken
import urllib.parse
from accounts.models import Account
from .models import Conversation, Message, MessageStatus
from channels.layers import get_channel_layer

class WsChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        """Подключение WebSocket"""

        self.channel_layer = get_channel_layer()  # Получение channel layer
        if self.channel_layer is None:
            raise ValueError("Channel layer is not configured properly.")
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f"room_{self.conversation_id}"
        self.channel_layer.group_add(self.room_group_name, self.channel_name)
        # Получаем строку запроса (query string) и декодируем ее
        query_string = self.scope.get('query_string', b'').decode('utf-8')

        # Парсим query string для извлечения токена
        query_params = urllib.parse.parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if not token:
            raise AuthenticationFailed('Token is missing')

        # Проверяем и декодируем токен
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await sync_to_async(User.objects.get)(id=user_id)
        except (AuthenticationFailed, KeyError, User.DoesNotExist):
            raise AuthenticationFailed('Invalid token')

        # Получаем ID беседы из данных
        conversation_id = self.scope['url_route']['kwargs'].get('conversation_id')

        if not conversation_id:
            raise ValueError("Conversation ID is required")

        # Получаем саму беседу
        conversation = await sync_to_async(Conversation.objects.get)(id=conversation_id)

        # Создаем уникальное имя комнаты на основе ID беседы
        self.room_group_name = f"conversation_{conversation.id}"

        # Добавляем пользователя в группу
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        # Принимаем соединение
        await self.accept()

        print(f"✅ WebSocket подключен в комнату: {self.room_group_name} для пользователя {self.user}")

    async def disconnect(self, close_code):
        """Отключение WebSocket"""
        if self.user.is_authenticated:
            # Убираем пользователя из группы при отключении
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        print(f"❌ WebSocket отключен: {self.user}")

    async def receive(self, text_data):
        """Обработка входящих сообщений"""
        data = json.loads(text_data)
        action = data.get("action")

        if action == "send_message":
            await self.handle_send_message(data)
        elif action == "invite_user":
            await self.handle_invite_user(data)

    async def handle_send_message(self, data):
        """Обработка отправки сообщения"""
        conversation_id = data.get("conversation_id")
        text = data.get("text")

        conversation = await sync_to_async(Conversation.objects.get)(id=conversation_id)
        message = await sync_to_async(Message.objects.create)(
            conversation=conversation,
            sender=self.user.account,
            text=text
        )

        # Создаём статусы сообщений для всех участников, кроме отправителя
        participants = await sync_to_async(list)(conversation.participants.exclude(id=self.user.account.id))
        statuses = [MessageStatus(message=message, user=user, is_read=False) for user in participants]
        await sync_to_async(MessageStatus.objects.bulk_create)(statuses)

        response = {
            "action": "new_message",
            "message": {
                "id": message.id,
                "conversation_id": conversation.id,
                "sender": message.sender.id,
                "text": message.text,
                "created_at": str(message.created_at),
            },
        }

        # Отправляем сообщение всем участникам
        for user in participants + [self.user.account]:
            await self.channel_layer.group_send(
                f"user_{user.id}",
                {"type": "chat.message", "message": response}
            )

    async def handle_invite_user(self, data):
        """Обработка приглашения пользователя в комнату"""
        conversation_id = data.get("conversation_id")
        user_ids = data.get("user_ids", [])

        conversation = await sync_to_async(Conversation.objects.get)(id=conversation_id)
        new_users = await sync_to_async(list)(Account.objects.filter(id__in=user_ids))

        for user in new_users:
            await sync_to_async(conversation.participants.add)(user)

            response = {
                "action": "invitation",
                "conversation": {
                    "id": conversation.id,
                    "name": conversation.name,
                },
            }

            # Уведомляем приглашённого пользователя
            await self.channel_layer.group_send(
                f"user_{user.id}",
                {"type": "chat.message", "message": response}
            )

    async def chat_message(self, event):
        """Отправка данных клиенту"""
        await self.send(text_data=json.dumps(event["message"], ensure_ascii=False))