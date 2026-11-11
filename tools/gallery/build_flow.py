import json, os, html, datetime, re
F = json.load(open("/home/claude/watt/flow.json"))
G = json.load(open("/home/claude/watt/gallery.json"))
ROOT = "/home/claude/energy-plus/walkthrough/gallery"
e = html.escape
by = {r["tag"]: r for r in F}
used = set()

FACS = [("grocery", "Supermarket / Grocery"), ("cstore", "Convenience / Fuel"), ("qsr", "Restaurant"), ("hotel", "Hotel"),
        ("cold", "Cold storage"), ("health", "Healthcare"), ("ind", "Industrial"), ("fit", "Fitness"), ("dc", "Data center"),
        ("mf", "Multifamily"), ("office", "Office / School"), ("retail", "Retail center")]
FACN = dict(FACS)
NAME = {"intro": "Hello", "why": "Motivation", "facility": "Building type", "locations": "How many", "stateQ": "Where",
        "singleState": "Which state", "pickStates": "Which states", "statusQ": "Status", "monthsQ": "Months open",
        "planning": "Not built yet", "bill": "Monthly bill", "sizeQ": "Building size", "under": "Under $10K",
        "dial": "Dial it in", "season": "Bill season", "doneQ": "Already upgraded", "role": "Who reads it", "capture": "Contact"}
ONLY = {"singleState": "Only if they have one location, or all in one state", "pickStates": "Only if their locations are spread across states",
        "monthsQ": "Only if they are open part of the year", "planning": "Only if it isn't built yet. The walkthrough ends here.",
        "sizeQ": "Only if they don't know their bill", "under": "Only if the bill is under $10K a month in total. The walkthrough ends here.",
        "dial": "The ranges here depend on the bill range they picked"}
NOTE = {"singleState": "Any state works the same way. The reply uses that state's electric rate. Shown here with Texas.",
        "pickStates": "They tap regions, then states. Shown with Southeast.",
        "doneQ": "They can pick several. Each upgrade they pick is taken out of the report. Shown with two examples.",
        "capture": "First name and mobile. After this comes the report."}

def norm(h): return re.sub(r"\s+", " ", h or "").strip().lower()

# where each heading lives, so "Goes to" can link to it
cards = []  # (id, record, extra)
def add(tag, cid=None):
    r = by.get(tag)
    if r: cards.append((cid or "s-" + tag, r))
for t in ["intro", "why", "facility", "locations", "stateQ", "singleState", "pickStates", "statusQ", "monthsQ", "planning", "bill", "sizeQ", "under", "dial", "season"]:
    add(t)
anchor = {}
for cid, r in cards: anchor.setdefault(norm(r["h"]), cid)
AGE = norm("How old is most of your main equipment?"); SUMMER = norm("Is your summer electric bill noticeably higher than winter?")
fac_cards = {}
for f, _ in FACS:
    lst = [by[t] for t in sorted(by) if t.startswith(f + "-p")]
    fac_cards[f] = [r for r in lst if norm(r["h"]) not in (AGE, SUMMER)]
    for r in fac_cards[f]: anchor.setdefault(norm(r["h"]), "s-" + r["tag"])
age = by.get("grocery-p1"); summer = by.get("grocery-p2")
anchor[AGE] = "s-age"; anchor[SUMMER] = "s-summer"
for t in ["doneQ", "role", "capture"]:
    if t in by: anchor.setdefault(norm(by[t]["h"]), "s-" + t)
anchor["the report"] = "reports"

def goto(h):
    a = anchor.get(norm(h))
    lbl = e(h)
    return f'<a href="#{a}">{lbl}</a>' if a else lbl

def img(src, cls=""):
    if not src: return ""
    used.add(src); return f'<img loading="lazy" class="{cls}" src="{src}" alt="">'

def card(cid, r, tag, only=None, note=None):
    ch = r.get("choices") or []
    groups = []
    for c in ch:
        k = (c["text"], c["next"])
        for g in groups:
            if g["k"] == k: g["labels"].append(c["label"]); break
        else: groups.append({"k": k, "labels": [c["label"]], "img": c["img"], "next": c["next"], "text": c["text"]})
    nexts = set(g["next"] for g in groups)
    same_next = len(nexts) == 1
    body = ""
    if not ch:
        body = ""
    elif len(groups) == 1 and len(ch) > 1:
        g = groups[0]
        body = f'<div class="choices one"><div class="ch"><p class="lab">Any answer gets the same reply</p>{img(g["img"], "rep")}</div></div>'
    else:
        tiles = []
        for g in groups:
            labs = " or ".join(f"<b>{e(x.split(' · ')[0])}</b>" for x in g["labels"])
            nx = "" if same_next else f'<p class="nx">Then: {goto(g["next"])}</p>'
            rep = img(g["img"], "rep") if g["img"] else '<p class="jump">No reply here. It jumps straight to the next screen.</p>'
            tiles.append(f'<div class="ch"><p class="lab">{labs}</p>{rep}{nx}</div>')
        body = f'<div class="choices">{"".join(tiles)}</div>'
    nxt = f'<p class="nx all">Next for everyone: {goto(list(nexts)[0])}</p>' if ch and same_next else ""
    meta = (f'<p class="only">{e(only)}</p>' if only else "") + (f'<p class="note">{e(note)}</p>' if note else "")
    return (f'<article class="card" id="{cid}"><div class="qcol"><p class="tag">{e(tag)}</p><h3>{e(r["h"])}</h3>{meta}{img(r["q"], "qimg")}</div>'
            f'<div class="acol">{body}{nxt}</div></article>')

secs, nav = [], []
def section(gid, title, desc, inner):
    nav.append(f'<a class="g" href="#{gid}">{e(title)}</a>')
    secs.append(f'<h2 class="group" id="{gid}">{e(title)}</h2><p class="gdesc">{desc}</p>{inner}')

n = 0
inner = ""
for cid, r in cards:
    n += 1; k = r["key"]
    inner += card(cid, r, f"Screen {n} · {NAME.get(k, k)}", ONLY.get(k), NOTE.get(k))
section("start", "Start to bill", "Everyone sees these, in this order. Screens marked <i>only if</i> appear on one branch. Replies are shown for a grocery chain with 2 to 5 stores in Texas, so the wording uses &ldquo;stores.&rdquo;", inner)

inner = '<nav class="sub">' + "".join(f'<a href="#b-{f}">{e(lbl)}</a>' for f, lbl in FACS) + "</nav>"
for f, lbl in FACS:
    inner += f'<h3 class="fac" id="b-{f}">{e(lbl)}</h3>'
    for i, r in enumerate(fac_cards[f]):
        inner += card("s-" + r["tag"], r, f"{lbl} · question {i + 1}")
section("building", "Building questions", "Each building type gets its own one or two questions after the bill. Everyone also gets the two shared questions in the next section.", inner)

inner = ""
if age: inner += card("s-age", age, "Every building type · equipment age", note="Same reply for every building type.")
if summer: inner += card("s-summer", summer, "Every building type · summer bill", note="Same replies for every building type, with the building word swapped in (stores, properties, clubs).")
for t in ["doneQ", "role", "capture"]:
    if t in by: inner += card("s-" + t, by[t], NAME[t], None, NOTE.get(t))
section("finish", "Finish", "Everyone sees these last, then the report.", inner)

reps = ""
for f, lbl in FACS:
    r = next((x for x in G if x["id"] == "fac-" + f), None)
    if not r or not r.get("results"): continue
    x = r["results"]
    finds = "".join(f"<li>{e(t)}</li>" for t in x["finds"])
    reps += (f'<div class="res"><p class="tag">{e(lbl)}</p><p class="range">{e(x["range"])} <span>a year</span></p><ol>{finds}</ol>'
             f'<details><summary>Show the full report page</summary>{img(x["img"], "full")}</details></div>')
section("reports", "Reports", "A sample report for each building type, using the same middle-of-the-road answers.", f'<div class="reps">{reps}</div>')

stamp = datetime.datetime.now().strftime("%B %-d, %Y")
page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="color-scheme" content="light"><title>Watt Screen Flow</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=Geist+Mono:wght@400;500&display=swap">
<style>
:root{{--petrol:#174e58;--petrol2:#1f5c67;--ochre:#e0a21c;--paper:#f3f5f6;--ink:#14212a;--mute:#56656e;--line:#d6dde0;--card:#fff}}
*{{box-sizing:border-box}}html{{scroll-behavior:smooth;scroll-padding-top:12px}}
body{{margin:0;background:var(--paper);color:var(--ink);font:18px/1.5 Archivo,system-ui,sans-serif}}
.wrap{{max-width:1240px;margin:0 auto;padding:0 16px 80px}}
header{{background:var(--petrol);color:#fff;padding:36px 16px 30px}}header .wrap{{padding-bottom:0}}
header h1{{font-size:clamp(30px,5vw,44px);line-height:1.05;margin:0 0 10px;font-stretch:110%}}
header p{{margin:0;color:#cfe0e3;max-width:780px}}
.mono{{font-family:"Geist Mono",monospace;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--ochre)!important;margin:0 0 8px!important}}
nav{{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 8px}}
nav a{{font-size:15px;color:var(--petrol);text-decoration:none;border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 13px}}
nav a.g{{background:var(--petrol);color:#fff;border-color:var(--petrol);font-weight:600}}
nav.sub{{margin:8px 0 0}}
h2.group{{font-size:clamp(24px,3.4vw,32px);margin:56px 0 2px;padding-top:14px;border-top:3px solid var(--petrol)}}
.gdesc{{margin:0 0 18px;color:var(--mute)}}
h3.fac{{font-size:22px;margin:36px 0 10px;color:var(--petrol)}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin:0 0 16px;display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start}}
.tag{{font-family:"Geist Mono",monospace;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--petrol2);margin:0 0 4px}}
.card h3{{font-size:20px;line-height:1.25;margin:0 0 6px}}
.only{{font-size:15px;margin:0 0 6px;color:#7a5a06;background:#fbf1d8;border-radius:8px;padding:5px 9px;display:inline-block}}
.note{{font-size:15px;margin:0 0 6px;color:var(--mute)}}
img{{width:100%;display:block;border:1px solid var(--line);border-radius:10px;background:var(--paper)}}
.qimg{{margin-top:8px}}
.choices{{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}}
.choices.one{{grid-template-columns:minmax(240px,340px)}}
.ch{{border-left:4px solid var(--ochre);padding-left:10px}}
.lab{{font-size:16px;margin:0 0 6px;line-height:1.3}}.lab b{{color:var(--petrol)}}
.nx{{font-size:15px;margin:6px 0 0;color:var(--mute)}}.nx a{{color:var(--petrol)}}
.nx.all{{margin-top:12px;font-size:16px}}
.jump{{font-size:15px;color:var(--mute);margin:0}}
.reps{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr));gap:14px}}
.res{{background:#fff;border:1px solid var(--line);border-left:5px solid var(--ochre);border-radius:14px;padding:16px}}
.range{{font-size:26px;font-weight:700;margin:0 0 6px;font-stretch:110%}}.range span{{font-size:16px;font-weight:400;color:var(--mute)}}
.res ol{{margin:0 0 10px;padding-left:22px;font-size:16px}}
summary{{cursor:pointer;color:var(--petrol);font-weight:600;padding:6px 0}}
img.full{{max-width:390px;margin:10px auto 0}}
@media (max-width:760px){{.card{{grid-template-columns:1fr}}.qcol img{{max-width:340px}}}}
</style></head><body id="top">
<header><div class="wrap"><p class="mono">Energy Plus walkthrough</p><h1>Watt screen flow</h1>
<p>Each screen appears once, in order. Next to it is every choice and Watt&rsquo;s reply to that choice. When every choice gets the same reply, it shows once. &ldquo;Then&rdquo; links jump to the screen that comes next. Captured from the live walkthrough on a phone-size screen, {stamp}.</p></div></header>
<div class="wrap"><nav>{"".join(nav)}</nav>{"".join(secs)}</div></body></html>'''
open(ROOT + "/index.html", "w").write(page)
removed = 0
for f in os.listdir(ROOT + "/img"):
    if "img/" + f not in used: os.remove(ROOT + "/img/" + f); removed += 1
print("kept", len(used), "removed", removed)
