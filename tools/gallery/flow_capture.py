"""Phase B: for every screen, try each choice from the same starting point and record Watt's reply and where it goes next."""
import asyncio, json, sys, re
sys.path.insert(0, "/home/claude/watt")
import gallery
from gallery import settle, heading, at_name, click_next, fonts, BASE

OUT = gallery.OUT
SN = json.load(open("/home/claude/watt/snaps.json"))

def parsed(s):
    try: return json.loads(s["raw"]) if s["raw"] else {}
    except Exception: return {}

def pick_snap(at, fac=None):
    c = [s for s in SN if s["at"] == at and s["raw"]]
    if fac: c = [s for s in c if parsed(s).get("fac") == fac]
    def score(s):
        o = parsed(s)
        return (o.get("fac") == "grocery", o.get("locs") == 3, o.get("status") in (None, "open"), o.get("spread") in (None, "one"))
    c.sort(key=score, reverse=True)
    return c[0] if c else None

COMMON = ["intro", "why", "facility", "locations", "stateQ", "singleState", "pickStates", "statusQ", "monthsQ", "planning",
          "bill", "sizeQ", "under", "dial", "season"]
TAIL = ["doneQ", "role", "capture"]
FACS = ["grocery", "cstore", "qsr", "hotel", "cold", "health", "ind", "fit", "dc", "mf", "office", "retail"]

async def open_at(b, snap):
    pg = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1.5)
    await fonts(pg)
    await pg.goto(BASE + "?nolead=1")
    at = snap["at"] if snap else ""
    if at in ("", "intro", "why", "facility"):
        await pg.evaluate("() => { try { localStorage.clear() } catch(e) {} }")
        await pg.reload(); await pg.wait_for_timeout(600); await settle(pg)
        if at in ("why", "facility"):
            await click_next(pg); await pg.wait_for_timeout(700); await settle(pg)
        if at == "facility":
            await pg.locator(".turn:not(.past) .opt").first.click(); await pg.wait_for_timeout(500)
            for _ in range(20):
                if await click_next(pg): break
                await pg.wait_for_timeout(200)
            await pg.wait_for_timeout(700); await settle(pg)
    else:
        await pg.evaluate("r => localStorage.setItem('ep-watt-v1', r)", snap["raw"])
        await pg.reload(); await pg.wait_for_timeout(600); await settle(pg)
        await pg.locator('.opt[data-k="go"]').first.click()
        for _ in range(60):
            await pg.wait_for_timeout(200)
            if (await heading(pg)) == snap["h"] and await pg.locator(".turn").last.locator(".bubble.ask h1").count(): break
        await settle(pg)
    return pg

async def last_turn(pg):
    return await pg.locator(".turn").last.element_handle()

async def reply_after(pg, turn, before):
    """wait for Watt's reply in this turn's slot, or for the walkthrough to jump to another screen"""
    for _ in range(40):
        await pg.wait_for_timeout(150)
        n = await pg.evaluate("() => document.querySelectorAll('.turn').length")
        filled = await turn.evaluate("t => { const s = t.querySelector('.slot'); return !!(s && s.innerText.trim()) }")
        if filled or n != before: break
    await settle(pg)
    slot = await turn.query_selector(".slot")
    txt = (await slot.inner_text()).strip() if slot else ""
    return slot if txt else None, txt

async def where_next(pg, before):
    n = await pg.evaluate("() => document.querySelectorAll('.turn').length")
    if n == before:
        await click_next(pg)
        for _ in range(30):
            await pg.wait_for_timeout(200)
            if await pg.evaluate("() => document.querySelectorAll('.turn').length") != before: break
    await settle(pg)
    if await pg.query_selector(".range"): return "The report"
    return await heading(pg)

def norm(t):
    return re.sub(r"\s+", " ", t).strip()

async def screen(b, key, snap, tag, sem):
    async with sem:
        pg = await open_at(b, snap)
        h = await heading(pg)
        turn = await last_turn(pg)
        opts = [t.strip().replace("\n", " · ") for t in await pg.locator(".turn").last.locator(".opt").all_inner_texts()]
        q = await gallery.shot(turn, f"f-{tag}-q", pg)
        rec = {"key": key, "tag": tag, "h": h, "q": q, "opts": opts, "choices": []}
        kind = "opts" if opts else "none"
        if await pg.query_selector(".turn:last-of-type #stsel") or key == "singleState": kind = "state"
        if key == "pickStates": kind = "regions"
        if key == "doneQ": kind = "multi"
        rec["kind"] = kind
        await pg.close()
    if kind == "opts":
        async def one(i):
            async with sem:
                pg = await open_at(b, snap)
                turn = await last_turn(pg)
                before = await pg.evaluate("() => document.querySelectorAll('.turn').length")
                await pg.locator(".turn").last.locator(".opt").nth(i).click()
                slot, txt = await reply_after(pg, turn, before)
                img = await gallery.shot(slot, f"f-{tag}-o{i}", pg) if slot else None
                nxt = await where_next(pg, before)
                await pg.close()
                return {"label": opts[i], "text": norm(txt), "img": img, "next": nxt}
        rec["choices"] = list(await asyncio.gather(*[one(i) for i in range(len(opts))]))
    elif kind in ("state", "regions", "multi"):
        examples = {"state": [("state", "Texas")], "regions": [("regions", ["Southeast"])],
                    "multi": [("multi", ["None of these"]), ("multi", ["LED lighting", "Solar panels"])]}[kind]
        out = []
        for j, act in enumerate(examples):
            async with sem:
                pg = await open_at(b, snap)
                turn = await last_turn(pg)
                before = await pg.evaluate("() => document.querySelectorAll('.turn').length")
                label = await gallery.do(pg, act, [])
                slot, txt = await reply_after(pg, turn, before)
                img = await gallery.shot(slot, f"f-{tag}-o{j}", pg) if slot else None
                nxt = await where_next(pg, before)
                await pg.close()
                out.append({"label": label, "text": norm(txt), "img": img, "next": nxt})
        rec["choices"] = out
    print(tag, h[:50], len(rec["choices"]), flush=True)
    return rec

async def main():
    from playwright.async_api import async_playwright
    jobs = []
    for k in COMMON + TAIL:
        s = {"at": "intro", "raw": None} if k == "intro" else ({"at": k, "raw": None} if k in ("why", "facility") else pick_snap(k))
        if s: jobs.append((k, s, k))
        else: print("no snapshot for", k)
    for f in FACS:
        for i in range(5):
            s = pick_snap(f"pathStep:{i}", f)
            if s: jobs.append((f"pathStep:{i}", s, f"{f}-p{i}"))
    import os
    only = os.environ.get("ONLY")
    if only:
        jobs = [j for j in jobs if j[2] in only.split(",")]
    async with async_playwright() as p:
        b = await p.chromium.launch()
        sem = asyncio.Semaphore(6)
        res = await asyncio.gather(*[screen(b, k, s, t, sem) for k, s, t in jobs], return_exceptions=True)
        await b.close()
    good = []
    for (k, s, t), r in zip(jobs, res):
        if isinstance(r, Exception): print("FAILED", t, str(r)[:200])
        else:
            r["fac"] = parsed(s).get("fac"); good.append(r)
    if only:
        old = [r for r in json.load(open("/home/claude/watt/flow.json")) if r["tag"] not in only.split(",")]
        good = old + good
    json.dump(good, open("/home/claude/watt/flow.json", "w"), indent=1)
    print("done", len(good))

if __name__ == "__main__": asyncio.run(main())
