import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from jwt import ExpiredSignatureError
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
        self.room_group_name = f"conversation_{self.conversation_id}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

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

        except ExpiredSignatureError:
            await self.send(text_data=json.dumps({"error": "Token expired. Please log in again."}))
            await asyncio.sleep(0.1)  # Даем время на отправку перед закрытием
            await self.close()
            return


        except (AuthenticationFailed, KeyError, User.DoesNotExist):
            raise AuthenticationFailed('Invalid token')

        # Подключение к группе
        await self.accept()
        await self.load_initial_messages()
        print(f"✅ WebSocket подключен в комнату: {self.room_group_name} для пользователя {self.user}")

    async def disconnect(self, close_code):
        """Отключение WebSocket"""
        if self.user.is_authenticated:
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
        elif action == "mark_as_read":
            await self.handle_mark_as_read(data)
        elif action == "load_more_messages":
            await self.handle_load_more_messages(data)

    async def handle_mark_as_read(self, data):
        """Пометка сообщений как прочитанных"""
        conversation_id = data.get("conversation_id")
        user = await sync_to_async(lambda: self.user.account)()

        if not conversation_id:
            return

        # Получаем сообщения, которые не были прочитаны
        unread_messages = await (sync_to_async(list)
                                 (MessageStatus.objects.filter(message__conversation_id=conversation_id, user=user, is_read=False)))

        if unread_messages:
            for msg_status in unread_messages:
                msg_status.is_read = True

            await sync_to_async(MessageStatus.objects.bulk_update)(
                unread_messages, ["is_read"]
            )
            print(f"✅ Помечены как прочитанные: {len(unread_messages)} сообщений")

            # Отправляем обновление всем в беседе
            response = {
                "action": "messages_read",
                "conversation_id": conversation_id,
                "read_by": user.id
            }

            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "chat_message", "message": response}
            )

    async def handle_send_message(self, data):
        """Обработка отправки сообщения"""

        user = await sync_to_async(lambda: self.user.account)()

        # Получаем ID беседы и текст сообщения
        conversation_id = data.get("conversation_id")
        text = data.get("text")

        if not conversation_id or not text:
            return

        conversation = await sync_to_async(Conversation.objects.get)(id=conversation_id)

        # Создаем сообщение в базе данных
        message = await sync_to_async(Message.objects.create)(
            conversation=conversation,
            sender=user,
            text=text
        )

        # Получаем участников беседы
        participants = await sync_to_async(list)(conversation.participants.exclude(id=user.id))

        # Создаем статусы сообщений
        statuses = [MessageStatus(message=message, user=participant, is_read=False) for participant in participants]
        await sync_to_async(MessageStatus.objects.bulk_create)(statuses)

        # Формируем ответное сообщение
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
        print("📤 Отправляем сообщение клиентам:", response)

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat_message", "message": response}
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

            await self.channel_layer.group_send(
                self.room_group_name,
                {"action": "chat_message", "message": response}
            )

    async def load_initial_messages(self):
        """Загрузка последних сообщений при подключении"""
        conversation_id = self.conversation_id

        # Загружаем последние 20 сообщений
        last_messages = await sync_to_async(
            lambda: list(
                Message.objects.filter(conversation_id=conversation_id)
                .order_by("-created_at")
                .values("id", "conversation_id", "sender_id", "text", "created_at")[:20]
            )
        )()


        # Переворачиваем в хронологический порядок
        last_messages.reverse()

        for msg in last_messages:
            msg["created_at"] = msg["created_at"].isoformat()

        # Отправляем данные клиенту
        await self.send(text_data=json.dumps({
            "action": "initial_messages",
            "messages": last_messages
        }, ensure_ascii=False))

    async def handle_load_more_messages(self, data):
        """Загрузка старых сообщений при скролле вверх"""
        conversation_id = self.conversation_id
        last_message_id = data.get("last_message_id")

        if not conversation_id or not last_message_id:
            return
        # Получаем 20 более старых сообщений
        print("WWWWW", last_message_id )
        older_messages = await sync_to_async(
            lambda: list(
                Message.objects.filter(conversation_id=conversation_id, id__lt=last_message_id)
                .order_by("-created_at")
                .values("id", "conversation_id", "sender_id", "text", "created_at")[:20]
            )
        )()
        print(f"Найдено старых сообщений: {len(older_messages)}")

        if not older_messages:
            # Когда нет старых сообщений
            await self.send(text_data=json.dumps({
                "action": "load_more_messages",
                "messages": []  # Пустой массив
            }))
            return

        # Подготовка данных для отправки
        messages_data = [
            {
                "id": msg["id"],
                "conversation_id": msg["conversation_id"],
                "sender": msg["sender_id"],
                "text": msg["text"],
                "created_at": msg["created_at"].isoformat(),
            }
            for msg in older_messages
        ]

        # Отправка сообщений клиенту
        await self.send(text_data=json.dumps({
            "action": "load_more_messages",
            "messages": messages_data
        }))

    async def chat_message(self, event):
        """Отправка данных клиенту"""

        print("SEND", event)
        await self.send(text_data=json.dumps(event["message"], ensure_ascii=False))