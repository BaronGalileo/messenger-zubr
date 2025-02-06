from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from .models import Message, Conversation, MessageStatus
from .serializers import MessageSerializer, ConversationSerializer
from django.utils.timezone import now

class IsMessageOwner(permissions.BasePermission):

    def has_permission(self, request, view):
        """Разрешаем просматривать сообщения всем аутентифицированным пользователям."""
        if request.method in permissions.SAFE_METHODS:  # GET, HEAD, OPTIONS
            return request.user.is_authenticated
        return True

    def has_object_permission(self, request, view, obj):
        """Разрешаем просматривать сообщения участникам беседы, но изменять/удалять только автору."""
        user = request.user.account

        # Разрешаем чтение (GET) всем участникам беседы
        if request.method in permissions.SAFE_METHODS:
            return user in obj.conversation.participants.all()

        # Разрешаем изменение и удаление только автору сообщения
        return obj.sender == user

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsMessageOwner]

    def perform_create(self, serializer):
        sender = self.request.user.account
        message = serializer.save(sender=sender)  # Создаем сообщение

        # Получаем всех участников беседы, кроме отправителя
        participants = message.conversation.participants.exclude(id=sender.id)

        # Создаем записи MessageStatus для всех участников
        message_statuses = [
            MessageStatus(message=message, user=user, is_read=False, read_at=None)
            for user in participants
        ]
        MessageStatus.objects.bulk_create(message_statuses)  # Массовое создание

        return message

    def list(self, request, *args, **kwargs):
        """ Обрабатывает список сообщений и отмечает их как прочитанные для текущего пользователя """
        response = super().list(request, *args, **kwargs)

        user = request.user.account

        # Обновляем статус сообщений как прочитанные
        MessageStatus.objects.filter(user=user, is_read=False).update(is_read=True, read_at=now())

        return response

    def retrieve(self, request, *args, **kwargs):
        """ Обрабатывает запрос на получение одного сообщения и отмечает его как прочитанное """
        response = super().retrieve(request, *args, **kwargs)

        user = request.user.account
        message_id = kwargs.get('pk')

        # Обновляем статус сообщения как прочитанное
        MessageStatus.objects.filter(user=user, message_id=message_id, is_read=False).update(
            is_read=True, read_at=now()
        )

        return response

class IsConversationCreator(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Разрешить изменение только создателю переписки
        return obj.creator == request.user.account

class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated, IsConversationCreator]

    def perform_create(self, serializer):
        # Автоматически устанавливаем создателя
        serializer.save(creator=self.request.user.account)

    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        conversation = self.get_object()
        user_ids = request.data.get('user_ids', [])

        # Проверка, что запрос от создателя
        if conversation.creator != request.user.account:
            return Response({"error": "Only the creator can invite users."}, status=status.HTTP_403_FORBIDDEN)

        # Добавляем пользователей
        users = User.objects.filter(id__in=user_ids)
        conversation.participants.add(*users)
        return Response({"status": "Users invited successfully."}, status=status.HTTP_200_OK)