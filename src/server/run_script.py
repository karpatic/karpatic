import os
import sys
import asyncio
from datetime import datetime, timedelta, timezone
from telethon import TelegramClient

# Optionally load environment variables from a .env file
if not os.getenv('DYNO'):
    from dotenv import load_dotenv
    load_dotenv()

api_id = int(os.getenv('TELEGRAM_API_ID'))
api_hash = os.getenv('TELEGRAM_API_HASH')

client = TelegramClient('telegram_key', api_id, api_hash)

async def main(chat_id):
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
        sender_name = sender.username if sender.username else sender.first_name
        print(f"{message.date} | {sender_name}: {message.text}")

async def main_wrapper(chat_id):
    async with client:
        await main(chat_id)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 run_script.py <chat_id>")
        sys.exit(1)

    chat_id = int(sys.argv[1])

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        asyncio.ensure_future(main_wrapper(chat_id))
    else:
        asyncio.run(main_wrapper(chat_id))
