import os
import sys
from telethon import TelegramClient 

# Optionally load environment variables from a .env file
if not os.getenv('DYNO'):
    from dotenv import load_dotenv
    # if os.path.exists('.env'):
    load_dotenv()

api_id = int(os.getenv('TELEGRAM_API_ID'))
api_hash = os.getenv('TELEGRAM_API_HASH')
phone_number = '+' + sys.argv[1]

client = TelegramClient('telegram_key', api_id, api_hash)

async def send_code():
    await client.connect()
    if not await client.is_user_authorized():
        result = await client.send_code_request(phone_number)
        print(f'{{"message": "Code sent to your phone.", "phone_code_hash": "{result.phone_code_hash}"}}')
    else:
        print('{"message": "Already authorized."}')

if __name__ == "__main__":
    import asyncio
    asyncio.run(send_code())
