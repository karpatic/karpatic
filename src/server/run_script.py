import os
import asyncio
from telethon import TelegramClient

# Optionally load environment variables from a .env file
if not os.getenv('DYNO'):
    from dotenv import load_dotenv
    # if os.path.exists('.env'):
    load_dotenv()

api_id = int(os.getenv('TELEGRAM_API_ID'))
api_hash = os.getenv('TELEGRAM_API_HASH')

client = TelegramClient('telegram_key', api_id, api_hash)

async def main():
    me = await client.get_me() 
    # async for dialog in client.iter_dialogs():
    #     print(dialog.name, 'has ID', dialog.id)
    i = 0
    async for message in client.iter_messages(-1001488894133):
        i += 1
        if i >= 100:
            break
        print(message.id, message.text)

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
