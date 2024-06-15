import os
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

async def main():
    chat_id = -1001488894133
    current_time = datetime.now(timezone.utc)
    cutoff_time = current_time - timedelta(days=1)

    async for message in client.iter_messages(chat_id):
        if message.date < cutoff_time:
            break
        sender = await message.get_sender()
        sender_name = sender.username if sender.username else sender.first_name
        print(f"{message.id} | {message.date} | {sender_name}: {message.text}")

async def main_wrapper():
    async with client:
        await main()

if __name__ == "__main__":
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        asyncio.ensure_future(main_wrapper())
    else:
        asyncio.run(main_wrapper())
