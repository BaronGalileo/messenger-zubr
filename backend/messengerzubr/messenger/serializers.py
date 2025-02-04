from rest_framework import serializers
from .models import Conversation, Message, MessageStatus
from accounts.models import Account


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'text', 'created_at', 'updated_at']
        read_only_fields = ['sender', 'created_at']  # Отправитель и время создания нельзя изменить

    def validate(self, data):
        # Проверка, что сообщение изменяет только автор
        if self.instance and self.instance.sender != self.context['request'].user:
            raise serializers.ValidationError("You can only edit your own messages.")
        return data

class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.PrimaryKeyRelatedField(queryset=Account.objects.all(), many=True)
    creator = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'conversation_type', 'participants', 'creator', 'name', 'created_at']
        read_only_fields = ['creator', 'created_at']  # Создатель и время создания нельзя изменить

    def validate(self, data):
        # Проверка, что имя группы изменяет только создатель
        if self.instance and self.instance.creator != self.context['request'].user:
            raise serializers.ValidationError("Only the creator can modify the conversation.")
        return data

class MessageStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageStatus
        fields = ['user', 'is_read', 'read_at']


class InviteSerializer(serializers.Serializer):
    user_ids = serializers.ListField(child=serializers.IntegerField())