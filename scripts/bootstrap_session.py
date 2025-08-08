from telethon import TelegramClient
from telethon.sessions import StringSession
import os

api_id = int(29844157)
api_hash = "45d04d2848fb13009983bf55ba9589a6"

# This will prompt you for phone + code (and 2FA password if enabled)
with TelegramClient(StringSession(), api_id, api_hash) as client:
    print("SESSION_STRING=" + client.session.save())

# start()