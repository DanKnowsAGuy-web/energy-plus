import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

BASE = "http://localhost:8766/walkthrough/"
OUT = "/home/claude/energy-plus/walkthrough/gallery/img"
os.makedirs(OUT, exist_ok=True)

HIDE_DOCK = "#dock,.dock{visibility:hidden!important}"

async def settle(pg):
    for _ in range(40):
        busy = await pg.evaluate("() => !!document.querySelector('.turn:not(.past) .typing, .typing')")
        if not busy: break
        await pg.wait_for_timeout(150)
    await pg.wait_for_timeout(250)

async def at_name(pg):
    return await pg.evaluate("""() => { try { const s = JSON.parse(localStorage.getItem('ep-watt-v1')||'{}'); return s.at ? (s.at[0] + (s.at[1]!=null ? ':' + s.at[1] : '')) : ''; } catch(e) { return '' } }""")

async def heading(pg):
    loc = pg.locator(".turn:not(.past) .bubble.ask h1").last
    try: return (await loc.inner_text(timeout=3000)).strip()
    except Exception: return ""

async def options(pg):
    return [t.strip().replace("\n", " · ") for t in await pg.locator(".turn:not(.past) .opt").all_inner_texts()]

async def click_next(pg):
    b = pg.locator("#act .btn:not([disabled])")
    if await b.count() and await b.first.is_visible():
        await b.first.click(); return True
    return False

async def shot(el, name, pg=None):
    path = f"{OUT}/{name}.jpg"
    pg = pg or el.page
    await pg.mouse.move(1, 1)
    await pg.evaluate("() => document.activeElement && document.activeElement.blur && document.activeElement.blur()")
    await pg.evaluate("() => { document.querySelectorAll('#dock,.hdr,header').forEach(e => e.style.visibility='hidden') }")
    try:
        await el.screenshot(path=path, type="jpeg", quality=62, animations="disabled")
    finally:
        await pg.evaluate("() => { document.querySelectorAll('#dock,.hdr,header').forEach(e => e.style.visibility='') }")
    return f"img/{name}.jpg"

FD = "/home/claude/fonts/node_modules/@fontsource"
FONT_CSS = """
@font-face{font-family:'Archivo';font-style:normal;font-display:block;font-weight:400 800;font-stretch:62% 125%;src:url(https://localfonts/archivo.woff2) format('woff2')}
@font-face{font-family:'Geist Mono';font-style:normal;font-weight:400;src:url(https://localfonts/gm400.woff2) format('woff2')}
@font-face{font-family:'Geist Mono';font-style:normal;font-weight:500;src:url(https://localfonts/gm500.woff2) format('woff2')}
@font-face{font-family:'Geist Mono';font-style:normal;font-weight:600;src:url(https://localfonts/gm600.woff2) format('woff2')}
"""
FONT_FILES = {"archivo.woff2": FD + "-variable/archivo/files/archivo-latin-standard-normal.woff2",
              "gm400.woff2": FD + "/geist-mono/files/geist-mono-latin-400-normal.woff2",
              "gm500.woff2": FD + "/geist-mono/files/geist-mono-latin-500-normal.woff2",
              "gm600.woff2": FD + "/geist-mono/files/geist-mono-latin-600-normal.woff2"}
async def fonts(pg):
    await pg.route("**/fonts.googleapis.com/**", lambda r: r.fulfill(status=200, content_type="text/css", body=FONT_CSS))
    await pg.route("https://localfonts/**", lambda r: r.fulfill(status=200, content_type="font/woff2", path=FONT_FILES[r.request.url.rsplit("/",1)[1]]))

async def run(b, sc):
    pg = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1.5)
    await fonts(pg)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(BASE + "?nolead=1" + (sc.get("q") or ""))
    await pg.evaluate("() => { try { localStorage.clear() } catch(e) {} }")
    await pg.reload(); await pg.wait_for_timeout(700)
    screens = []; sid = sc["id"]; n = 0
    plan = sc["plan"]
    seen = set()
    for step in range(40):
        await settle(pg)
        if await pg.query_selector(".range"):
            break
        turn = await pg.locator(".turn:not(.past)").last.element_handle()
        h = await heading(pg); at = await at_name(pg) or ("intro" if step == 0 else "?")
        if (at, h) in seen and not await pg.query_selector("#c-name"):
            await click_next(pg); await pg.wait_for_timeout(700); continue
        seen.add((at, h))
        n += 1; base = f"{sid}-{n:02d}"
        rec = {"at": at, "h": h, "opts": await options(pg)}
        rec["q"] = await shot(turn, base + "a", pg)
        if await pg.query_selector("#u-name"):
            rec["kind"] = "end"; screens.append(rec); break
        if await pg.query_selector(".turn:not(.past) #c-name"):
            await pg.fill("#c-name", "Pat"); await pg.fill("#c-phone", "8645550100")
            rec["pick"] = "Pat, 864-555-0100"; screens.append(rec)
            await click_next(pg); await pg.wait_for_timeout(5500); break
        key = at.split(":")[0]
        act = plan.get(at, plan.get(key, DEFAULTS.get(key)))
        if callable(act): act = act(h, rec["opts"])
        pick = await do(pg, act, rec["opts"])
        rec["pick"] = pick
        before = await pg.evaluate("() => document.querySelectorAll('.turn').length")
        for _ in range(30):
            await pg.wait_for_timeout(200)
            await pg.evaluate("() => { const a=document.getElementById('app'); if(a) a.click(); }")
            ready = await pg.evaluate("() => { const b=document.querySelector('#act .btn'); return !!(b && !b.disabled && b.offsetParent) }")
            moved = await pg.evaluate("() => document.querySelectorAll('.turn').length") != before
            if ready or moved: break
        await settle(pg)
        if rec["opts"] or key in ("pickStates", "singleState", "doneQ"):
            try: rec["r"] = await shot(turn, base + "b", pg)
            except Exception: pass
        screens.append(rec)
        moved = await pg.evaluate("() => document.querySelectorAll('.turn').length") != before
        if not moved:
            await click_next(pg)
        await pg.wait_for_timeout(600)
    res = None
    if await pg.query_selector(".range"):
        await pg.wait_for_timeout(1500)
        await pg.evaluate("() => { document.querySelectorAll('details').forEach(d => d.open = false); window.scrollTo(0,0) }")
        node = pg.locator(".range").first.locator("xpath=ancestor::section[1]")
        res = await shot(node, f"{sid}-results", pg)
        rng = (await pg.inner_text(".range")).strip()
        finds = [x.split("\n")[0] for x in await pg.locator(".finds li").all_inner_texts()]
        res = {"img": res, "range": rng, "finds": finds}
    await pg.close()
    return {"id": sid, "title": sc["title"], "desc": sc.get("desc", ""), "group": sc["group"], "screens": screens, "results": res, "errors": errs}

async def do(pg, act, opts):
    t = pg.locator(".turn:not(.past)")
    if act is None:
        act = ("idx", 1 if len(opts) > 1 else 0) if opts else ("next", None)
    kind, val = act
    if kind == "idx":
        o = t.locator(".opt").nth(val); label = (await o.inner_text()).strip().replace("\n", " · "); await o.click(); return label
    if kind == "opt":
        o = t.locator(".opt").filter(has_text=re.compile("^\\s*" + re.escape(val))).first
        label = (await o.inner_text()).strip().replace("\n", " · "); await o.click(); return label
    if kind == "multi":
        for v in val:
            await t.locator(".opt").filter(has_text=re.compile("^\\s*" + re.escape(v))).first.click(); await pg.wait_for_timeout(150)
        await pg.wait_for_timeout(200); await click_next(pg); return ", ".join(val)
    if kind == "state":
        await pg.select_option(".turn:not(.past) #stsel", label=val); return val
    if kind == "regions":
        for v in val:
            await t.locator(".reg-h", has_text=v).first.click(); await pg.wait_for_timeout(150)
        await pg.wait_for_timeout(200); await click_next(pg); return ", ".join(val)
    if kind == "next":
        await click_next(pg); return ""
    raise ValueError(kind)

DEFAULTS = {"intro": ("next", None), "pickStates": ("regions", ["Southeast"]), "singleState": ("state", "Texas"),
            "doneQ": ("multi", ["None of these"])}

async def main(scs, outjson):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        out = []
        sem = asyncio.Semaphore(4)
        async def one(sc):
            async with sem:
                try:
                    r = await run(b, sc)
                except Exception as e:
                    print(sc["id"], "FAILED", str(e)[:200], flush=True); return None
                print(sc["id"], len(r["screens"]), "results" if r["results"] else "no results", r["errors"][:2], flush=True)
                r["show"] = sc.get("show"); return r
        out = [r for r in await asyncio.gather(*[one(sc) for sc in scs]) if r]
        await b.close()
    json.dump(out, open(outjson, "w"), indent=1)
