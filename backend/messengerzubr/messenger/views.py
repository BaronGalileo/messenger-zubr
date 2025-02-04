from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from .models import Message, Conversation
from .serializers import MessageSerializer, ConversationSerializer

class IsMessageOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Разрешить изменение только автору сообщения
        return obj.sender == request.user.account

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsMessageOwner]

    def perform_create(self, serializer):
        # Автоматически устанавливаем отправителя
        serializer.save(sender=self.request.user.account)

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
        if conversation.creator != request.user:
            return Response({"error": "Only the creator can invite users."}, status=status.HTTP_403_FORBIDDEN)

        # Добавляем пользователей
        users = User.objects.filter(id__in=user_ids)
        conversation.participants.add(*users)
        return Response({"status": "Users invited successfully."}, status=status.HTTP_200_OK)