"""Phase A: walk every scenario and save the app's saved-state snapshot at each screen."""
import asyncio, json, sys
sys.path.insert(0, "/home/claude/watt")
import gallery
from scen_list import S

SNAPS = []
orig_at = gallery.at_name

async def at_name(pg):
    a = await orig_at(pg)
    raw = await pg.evaluate("() => localStorage.getItem('ep-watt-v1')")
    h = await gallery.heading(pg)
    SNAPS.append({"at": a, "raw": raw, "h": h})
    return a

async def noshot(el, name, pg=None):
    return ""

gallery.at_name = at_name
gallery.shot = noshot

async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        sem = asyncio.Semaphore(5)
        async def one(sc):
            async with sem:
                try: await gallery.run(b, sc)
                except Exception as e: print(sc["id"], "FAILED", str(e)[:150], flush=True)
        await asyncio.gather(*[one(sc) for sc in S])
        await b.close()
    json.dump(SNAPS, open("/home/claude/watt/snaps.json", "w"))
    print("snaps", len(SNAPS))

asyncio.run(main())
