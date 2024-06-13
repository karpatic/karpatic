import os
import sys
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError

# Optionally load environment variables from a .env file
if not os.getenv('DYNO'):
    from dotenv import load_dotenv
    # if os.path.exists('.env'):
    load_dotenv()

api_id = int(os.getenv('TELEGRAM_API_ID'))
api_hash = os.getenv('TELEGRAM_API_HASH')
phone_number = sys.argv[1]
code = sys.argv[2]
phone_code_hash = sys.argv[3]

client = TelegramClient('telegram_key', api_id, api_hash)

async def complete_auth():
    await client.connect()
    if not await client.is_user_authorized():
        try:
            await client.sign_in(phone_number, code, phone_code_hash=phone_code_hash)
            print('Authentication successful!')
        except SessionPasswordNeededError:
            print('Two-step verification is enabled, but no password provided.')
        except Exception as e:
            print(f'Failed to authenticate: {e}')
    else:
        print('Already authorized.')

if __name__ == "__main__":
    import asyncio
    asyncio.run(complete_auth())
