# scripts/export_chat.py
import os, json, re, sys
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl import types as t

# Optional local env loader for easy testing
try:
    from dotenv import load_dotenv
    load_dotenv(".env.local")
except Exception:
    pass

API_ID = int(os.environ["TG_API_ID"])
API_HASH = os.environ["TG_API_HASH"]
SESSION = os.environ["TG_SESSION_STRING"]

CHAT = int(os.environ.get("TG_CHAT", "-1002766583366"))  # your channel id
TOPIC_ID = int(os.environ.get("TG_TOPIC_ID", "2"))       # your topic id
LIMIT = int(os.environ.get("LIMIT", "300"))
DEBUG_LINKS = os.environ.get("DEBUG_LINKS", "0") == "1"

def grab(pattern, text):
    m = re.search(pattern, text, re.I)
    return m.group(1).replace(",", "") if m else "0"

def map_label_to_key(label: str):
    """Map visible label to which URL field it should fill."""
    L = label.lower()
    if "tx" in L or "transaction" in L: return "txUrl"
    if "custodian" in L: return "custodianUrl"
    if re.search(r"\basset\b", L): return "assetUrl"
    if "user" in L: return "userUrl"
    return None

def extract_links(msg_text: str, entities, reply_markup) -> dict:
    out = {"txUrl": "#", "custodianUrl": "#", "assetUrl": "#", "userUrl": "#"}
    debug_items = []

    # 1) Inline Markdown links (entities)
    if entities:
        for ent in entities:
            if hasattr(ent, "offset") and hasattr(ent, "length"):
                label = (msg_text[ent.offset : ent.offset + ent.length] or "").strip()
            else:
                label = ""
            url = None
            if isinstance(ent, t.MessageEntityTextUrl):
                url = ent.url
            elif isinstance(ent, t.MessageEntityUrl):
                url = label  # plain URL text
            else:
                continue
            key = map_label_to_key(label)
            if key and url:
                out[key] = url
                debug_items.append(("entity", label, url))

    # 2) Inline keyboard buttons (reply_markup)
    if isinstance(reply_markup, t.ReplyInlineMarkup):
        for row in reply_markup.rows or []:
            for btn in row.buttons or []:
                label = getattr(btn, "text", "") or ""
                url = getattr(btn, "url", None)
                if url:
                    key = map_label_to_key(label)
                    if key:
                        out[key] = url
                        debug_items.append(("button", label, url))

    if DEBUG_LINKS and debug_items:
        print("LINKS FOUND:", debug_items, file=sys.stderr)

    return out

def extract_asset_ticker(msg_text: str, asset_link_label: str | None) -> str:
    # Prefer the link label like "Asset USDC"
    if asset_link_label:
        m = re.search(r"\basset\s+([A-Z0-9]{2,10})\b", asset_link_label, re.I)
        if m:
            return m.group(1).upper()
    # Fallback: ignore Deposited/Redeemed/Value words
    m = re.search(r"Asset\s+(?!Deposited|Redeemed|Value)([A-Z0-9]{2,10})\b", msg_text, re.I)
    return (m.group(1).upper() if m else "USDC")

def parse_event(msg):
    txt = msg.message or ""
    is_in = re.search(r"Custodian inflow", txt, re.I)
    is_out = re.search(r"Custodian Outflow", txt, re.I)
    if not (is_in or is_out):
        return None
    # print(txt)
    # print(msg.entities[0].url)
    try:
        url = msg.entities[0].url
    except:
        url = ""
    # links = extract_links(txt, msg.entities or [], msg.reply_markup)

    # If we have an "Asset ..." hyperlink label, use it for ticker
    asset_label = None
    if msg.entities:
        for ent in msg.entities:
            if hasattr(ent, "offset") and hasattr(ent, "length"):
                label = txt[ent.offset : ent.offset + ent.length]
                if label and re.search(r"\basset\b", label, re.I):
                    asset_label = label
                    break
    if asset_label is None and isinstance(msg.reply_markup, t.ReplyInlineMarkup):
        # Or from button text
        for row in msg.reply_markup.rows or []:
            for btn in row.buttons or []:
                if getattr(btn, "text", "") and re.search(r"\basset\b", btn.text, re.I):
                    asset_label = btn.text
                    break

    frxusd = float(grab(r"frxUSD\s+(?:Minted|Burned):\s*([\d.,]+)", txt))
    asset_amount = float(grab(r"Asset\s+(?:Deposited|Redeemed):\s*([\d.,]+)", txt))
    asset_value = float(grab(r"Asset\s+Value:\s*([\d.,]+)", txt)) or asset_amount
    asset = extract_asset_ticker(txt, asset_label)

    return {
        "ts": msg.date.isoformat(),
        "type": "inflow" if is_in else "outflow",
        "frxusd": frxusd,
        "asset": asset,
        "assetAmount": asset_amount,
        "assetValueUSD": asset_value,
        "txUrl": url
    }

async def main():
    client = TelegramClient(StringSession(SESSION), API_ID, API_HASH)
    await client.connect()
    if not await client.is_user_authorized():
        print("ERROR: Session not authorized. Rebootstrap TG_SESSION_STRING.", file=sys.stderr)
        sys.exit(1)

    entity = await client.get_entity(CHAT)
    rows = []

    # Only this topic/thread
    async for m in client.iter_messages(entity, limit=LIMIT, reply_to=TOPIC_ID):
        r = parse_event(m)
        if r:
            rows.append(r)

    # rows.reverse()
    os.makedirs("public", exist_ok=True)
    out_path = os.path.join("public", "telegram-feed.json")
    with open(out_path, "w") as f:
        json.dump(rows, f, indent=2)
    print(f"Wrote {len(rows)} events to {out_path}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
