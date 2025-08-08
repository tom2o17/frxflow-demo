# scripts/export_chat.py
import os, json, re
from telethon import TelegramClient
from telethon.sessions import StringSession

API_ID = int(os.environ["TG_API_ID"])
API_HASH = os.environ["TG_API_HASH"]
SESSION = os.environ["TG_SESSION_STRING"]
CHAT = os.environ.get("TG_CHAT", "@LockBoxSentinal")  # 🔧 CHANGE or set via secret
LIMIT = int(os.environ.get("LIMIT", "300"))

def grab(pattern, text):
    m = re.search(pattern, text, re.I)
    return m.group(1).replace(",", "") if m else "0"

def parse_event(msg):
    txt = msg.message or ""
    is_in = re.search(r"Custodian inflow", txt, re.I)
    is_out = re.search(r"Custodian Outflow", txt, re.I)
    if not (is_in or is_out): return None

    frxusd = float(grab(r"frxUSD (?:Minted|Burned):\s*([\d.,]+)", txt))
    asset_amount = float(grab(r"Asset (?:Deposited|Redeemed):\s*([\d.,]+)", txt))
    asset_value = float(grab(r"Asset Value:\s*([\d.,]+)", txt)) or asset_amount
    asset_m = re.search(r"Asset\s+([A-Z0-9]+)", txt, re.I)
    asset = (asset_m.group(1) if asset_m else "USDC").upper()

    return {
        "ts": msg.date.isoformat(),
        "type": "inflow" if is_in else "outflow",
        "frxusd": frxusd,
        "asset": asset,
        "assetAmount": asset_amount,
        "assetValueUSD": asset_value,
        "txUrl": "#",
        "custodianUrl": "#",
        "assetUrl": "#",
        "userUrl": "#",
    }

async def main():
    client = TelegramClient(StringSession(SESSION), API_ID, API_HASH)
    await client.connect()
    entity = await client.get_entity(CHAT)

    rows = []
    async for m in client.iter_messages(entity, limit=LIMIT):
        r = parse_event(m)
        if r: rows.append(r)

    rows.reverse()  # oldest → newest
    os.makedirs("public", exist_ok=True)
    with open("public/telegram-feed.json", "w") as f:
        json.dump(rows, f)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
