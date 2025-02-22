# Generated by Django 5.1.5 on 2025-02-06 13:38

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_remove_message_conversation_remove_message_sender_and_more'),
        ('messenger', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversation',
            name='creator',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='created_conversations', to='accounts.account'),
            preserve_default=False,
        ),
    ]
