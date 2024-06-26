import os
import sys
import asyncio
from datetime import datetime, timedelta, timezone
from telethon import TelegramClient
import urllib.request

# Optionally load environment variables from a .env file
if not os.getenv('DYNO'):
    from dotenv import load_dotenv
    load_dotenv()

api_id = int(os.getenv('TELEGRAM_API_ID'))
api_hash = os.getenv('TELEGRAM_API_HASH')

client = TelegramClient('telegram_key', api_id, api_hash)

async def main(chat_id, send_message, mp3_url):
    # if send_message is equal to 'dialogs'
    if send_message == 'dialogs':
            # You can print all the dialogs/conversations that you are part of:
        async for dialog in client.iter_dialogs():
            print(dialog.name, 'has ID', dialog.id)

    # Determine if chat_id is a phone number or group ID
    if chat_id.startswith('-'):
        chat_id = int(chat_id)
    else:
        chat_id = chat_id

    # Fetch and print recent messages from the chat
    current_time = datetime.now(timezone.utc)
    cutoff_time = current_time - timedelta(days=1, seconds=int(0.1 * 24 * 3600))  # 1.1% days
    messages = []

    async for message in client.iter_messages(chat_id):
        if message.date < cutoff_time:
            break
        messages.append(message)

    # Reverse the order of messages
    messages.reverse()
    
    for message in messages:
        sender = await message.get_sender()
        if sender:
            sender_name = sender.username if sender.username else sender.first_name
        else:
            sender_name = "Unknown"
        formatted_date = message.date.strftime('%Y-%m-%d %H:%M:%S')
        print(f"{formatted_date} | {sender_name}: {message.text}")

    # Download and send the MP3 file
    if mp3_url:
        caption = send_message if send_message else "It's me!"
        await client.send_file(chat_id, mp3_url, caption=caption)

    # Send the provided message
    elif send_message:
        await client.send_message(chat_id, send_message)

async def main_wrapper(chat_id, message, mp3_url):
    async with client:
        await main(chat_id, message, mp3_url)

if __name__ == "__main__":
    chat_id = sys.argv[1]
    message = sys.argv[2] if len(sys.argv) > 2 else ""
    mp3_url = sys.argv[3] if len(sys.argv) > 3 else None

    new_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(new_loop)
    new_loop.run_until_complete(main_wrapper(chat_id, message, mp3_url))
    new_loop.close()
