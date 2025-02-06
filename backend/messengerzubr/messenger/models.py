from django.db import models
from accounts.models import Account


class Conversation(models.Model):
    PRIVATE = 'private'
    GROUP = 'group'
    CONVERSATION_TYPES = [
        (PRIVATE, 'Private'),
        (GROUP, 'Group'),
    ]

    conversation_type = models.CharField(max_length=10, choices=CONVERSATION_TYPES, default=PRIVATE)
    name = models.CharField(max_length=255, blank=True, null=True)
    participants = models.ManyToManyField(Account, related_name='conversations')
    creator = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='created_conversations')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.conversation_type})"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(Account, related_name='sent_messages', on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Message {self.id} from {self.sender.name}"

class MessageStatus(models.Model):
    message = models.ForeignKey(Message, related_name='statuses', on_delete=models.CASCADE)
    user = models.ForeignKey(Account, related_name='message_statuses', on_delete=models.CASCADE)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Сообщение {self.id} for {self.user.name} (Прочтено: {self.is_read})"
