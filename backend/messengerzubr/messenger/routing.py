from django.urls import re_path
from .consumers import WsChatConsumer

ws_urlpatterns = [
    re_path(r'ws/messages/(?P<conversation_id>\d+)/$', WsChatConsumer.as_asgi()),
]



