import json, os, html, datetime
D = json.load(open("/home/claude/watt/gallery.json"))
ROOT = "/home/claude/energy-plus/walkthrough/gallery"
ORDER = {"Main path": 0, "Each building type": 1, "Branches": 2}
D.sort(key=lambda r: ORDER[r["group"]])
NAMES = {"intro": "Hello", "why": "Motivation", "facility": "Building type", "locations": "How many", "stateQ": "Where", "singleState": "Which state",
         "pickStates": "Which states", "statusQ": "Status", "monthsQ": "Months open", "planning": "Not built yet (end)", "bill": "Monthly bill",
         "dial": "Dial it in", "sizeQ": "Building size", "season": "Bill season", "pathStep": "Building question", "doneQ": "Already upgraded",
         "role": "Who reads it", "capture": "Teaser and contact", "under": "Under $10K (end)"}
e = html.escape
used = set()

def card(s, i):
    key = s["at"].split(":")[0]
    tag = NAMES.get(key, key) + (f" {int(s['at'].split(':')[1]) + 1}" if key == "pathStep" else "")
    imgs = f'<figure><img loading="lazy" src="{s["q"]}" alt=""><figcaption>{"Question" if s.get("r") else "Screen"}</figcaption></figure>'
    used.add(s["q"])
    if s.get("r"):
        imgs += f'<figure><img loading="lazy" src="{s["r"]}" alt=""><figcaption>After they answer</figcaption></figure>'
        used.add(s["r"])
    pick = f'<p class="pick">Picked: <b>{e(s["pick"])}</b></p>' if s.get("pick") else ""
    opts = f'<p class="opts">Choices: {e(" · ".join(o.split(" · ")[0] for o in s["opts"]))}</p>' if s.get("opts") else ""
    return f'<article class="card"><p class="tag">{i}. {e(tag)}</p><h3>{e(s["h"])}</h3>{opts}{pick}<div class="pair">{imgs}</div></article>'

secs, nav, last = [], [], None
for r in D:
    if r["group"] != last:
        gid = r["group"].lower().replace(" ", "-")
        secs.append(f'<h2 class="group" id="{gid}">{e(r["group"])}</h2>')
        nav.append(f'<a class="g" href="#{gid}">{e(r["group"])}</a>')
        last = r["group"]
    nav.append(f'<a href="#{r["id"]}">{e(r["title"])}</a>')
    show = r.get("show")
    path = " → ".join(e(s.get("pick") or NAMES.get(s["at"].split(":")[0], "")) for s in r["screens"] if s.get("pick"))
    cards = "".join(card(s, i + 1) for i, s in enumerate(r["screens"]) if not show or s["at"].split(":")[0] in show)
    res = ""
    if r.get("results"):
        x = r["results"]; used.add(x["img"])
        finds = "".join(f"<li>{e(f)}</li>" for f in x["finds"])
        res = (f'<div class="res"><p class="tag">Their report</p><p class="range">{e(x["range"])} <span>a year</span></p><ol>{finds}</ol>'
               f'<details><summary>Show the full report page</summary><img loading="lazy" class="full" src="{x["img"]}" alt=""></details></div>')
    secs.append(f'<section class="sc" id="{r["id"]}"><h2>{e(r["title"])}</h2><p class="desc">{e(r["desc"])}</p>'
                f'<p class="path"><b>Their answers:</b> {path}</p><div class="grid">{cards}</div>{res}<p class="top"><a href="#top">Back to top</a></p></section>')

stamp = datetime.datetime.now().strftime("%B %-d, %Y")
page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="color-scheme" content="light"><title>Watt Screen Gallery</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=Geist+Mono:wght@400;500&display=swap">
<style>
:root{{--petrol:#174e58;--petrol2:#1f5c67;--ochre:#e0a21c;--paper:#f3f5f6;--ink:#14212a;--mute:#56656e;--line:#d6dde0;--card:#fff}}
*{{box-sizing:border-box}}html{{scroll-behavior:smooth}}
body{{margin:0;background:var(--paper);color:var(--ink);font:18px/1.5 Archivo,system-ui,sans-serif}}
.wrap{{max-width:1180px;margin:0 auto;padding:0 16px 80px}}
header{{background:var(--petrol);color:#fff;padding:36px 16px 30px}}header .wrap{{padding-bottom:0}}
header h1{{font-size:clamp(30px,5vw,44px);line-height:1.05;margin:0 0 10px;font-stretch:110%;letter-spacing:-.01em}}
header p{{margin:0;color:#cfe0e3;max-width:760px}}
.mono{{font-family:"Geist Mono",monospace;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--ochre);margin:0 0 8px}}
nav{{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 8px}}
nav a{{font-size:15px;color:var(--petrol);text-decoration:none;border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 13px}}
nav a.g{{background:var(--petrol);color:#fff;border-color:var(--petrol);font-weight:600}}
h2.group{{font-size:15px;font-family:"Geist Mono",monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--mute);margin:56px 0 0;padding-top:12px;border-top:2px solid var(--petrol)}}
.sc{{margin-top:28px}}.sc>h2{{font-size:clamp(24px,3.4vw,32px);margin:0 0 4px;line-height:1.15}}
.desc{{margin:0 0 8px;color:var(--mute)}}.path{{margin:0 0 18px;font-size:16px;color:var(--mute)}}.path b{{color:var(--ink)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,520px),1fr));gap:16px}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}}
.tag{{font-family:"Geist Mono",monospace;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--petrol2);margin:0 0 4px}}
.card h3{{font-size:20px;line-height:1.25;margin:0 0 6px}}
.opts,.pick{{font-size:15px;margin:0 0 4px;color:var(--mute)}}.pick b{{color:var(--petrol)}}
.pair{{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;align-items:start}}
figure{{margin:0}}figure img{{width:100%;display:block;border:1px solid var(--line);border-radius:10px;background:var(--paper)}}
figcaption{{font-size:13px;color:var(--mute);margin-top:4px;text-align:center}}
.res{{margin-top:16px;background:#fff;border:1px solid var(--line);border-left:5px solid var(--ochre);border-radius:14px;padding:18px}}
.range{{font-size:30px;font-weight:700;margin:0 0 8px;font-stretch:110%}}.range span{{font-size:17px;font-weight:400;color:var(--mute)}}
.res ol{{margin:0 0 12px;padding-left:22px}}.res li{{margin:2px 0}}
summary{{cursor:pointer;color:var(--petrol);font-weight:600;padding:6px 0}}
img.full{{width:100%;max-width:420px;display:block;margin:10px auto 0;border:1px solid var(--line);border-radius:12px}}
.top{{text-align:right;font-size:15px}}.top a{{color:var(--petrol)}}
@media (max-width:560px){{.pair{{grid-template-columns:1fr}}}}
</style></head><body id="top">
<header><div class="wrap"><p class="mono">Energy Plus walkthrough</p><h1>Watt screen gallery</h1>
<p>Every screen people can see, path by path, captured from the live walkthrough on a phone-size screen. Each card shows the question with all its choices, then what Watt says after they answer. Updated {stamp}.</p></div></header>
<div class="wrap"><nav>{"".join(nav)}</nav>{"".join(secs)}</div></body></html>'''
open(ROOT + "/index.html", "w").write(page)
removed = 0
for f in os.listdir(ROOT + "/img"):
    if "img/" + f not in used:
        os.remove(ROOT + "/img/" + f); removed += 1
print("kept", len(used), "removed", removed)
