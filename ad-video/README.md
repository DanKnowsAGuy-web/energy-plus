# Energy Plus vertical ads

Two motion-graphics cuts, built as code instead of AI video so the type stays crisp and every word, number and cut is exact.
Both are 1080x1920, 30fps, H.264 + AAC at -14 LUFS, with music and sound design only. Record the voiceover separately and lay it on top.

| Cut | File | Page | Story |
|---|---|---|---|
| 30s | `energy-plus-ad-30s.mp4` | `cut30.html` | Stop overpaying, the outcome first, then the explainer |
| 60s | `energy-plus-ad.mp4` | `index.html` | The original brief in `turnkey-ad-video-prompt.md` |

- `ad-audio-30.m4a` / `ad-audio.m4a`: the music + SFX bed for each cut, for mixing the voiceover in an editor.
- Open either page in a browser and click to play (it plays its audio in sync). Add `?t=12` to start at a timestamp.
- `common.js` / `common.css`: the shared engine (iso building, checklist cards, meter, type fitting, grain, camera, boot).
- `render.cjs`: frame-exact renderer (headless Chromium piped to ffmpeg). `audio.py`: synthesizes the 120 BPM bed and every SFX from scratch (numpy/scipy), so there is nothing to license.

## 30s cut: "Stop overpaying for energy"

### Voiceover cue sheet

| Start | On screen | Line |
|---|---|---|
| 0:00.2 | STOP / OVERPAYING / FOR ENERGY. | "Stop overpaying for energy." |
| 0:02.1 | LOWER BILL. / CASH FLOW / DAY ONE. | "Get a lower bill, and a path to cash flow from day one." |
| 0:05.3 | ~30% / PAID FOR, / NOT NEEDED. (EPA source) | "Most commercial buildings pay for about thirty percent more energy than they need." |
| 0:09.4 | PROVEN ON / YOUR METER. | "We find yours and prove it on your own meter." |
| 0:11.6 | ONE TEAM. / ONE CONTRACT. then NO CAPITAL / FOR THE FIX. | "Then one team handles all of it, and the fix takes no upfront capital." |
| 0:19.3 | NOTHING ON / YOUR PLATE. | "Nothing lands on your plate." |
| 0:23.6 | START THE EXAM | "Start The Exam at slash your energy cost dot com." |

Sit the music about 6 dB under the voice.

### Claims guardrails

- The ~30% is the EPA's estimate for the average commercial building, labeled on screen. It is not a client-result promise.
- "No capital" is scoped to the fix, because the diagnosis may carry a fee. The end card says so.
- Cash flow is "a path to cash flow from day one" in the VO, and the end card notes it depends on financing, utility rates and incentives.
- No client names, no dealership, no client percentages.

## 60s cut: "We handle all of it"

### Voiceover cue sheet

| Start | Scene | Line |
|---|---|---|
| 0:00.5 | Problem | "Your energy bill keeps going up." |
| 0:05.5 | Problem | "Fixing it sounds like a capital project, eight vendors, and a lot of risk." |
| 0:15.6 | Guide | "We take care of all of it." |
| 0:19.0 | Guide | "At an Arizona Ford dealership, the bill came down forty-nine percent." |
| 0:30.2 | Plan | "We diagnose your building and prove the savings on your own meter." |
| 0:35.3 | Plan | "We handle the equipment, the install, and every rebate and tax credit you qualify for." |
| 0:40.5 | Plan | "And we find a path to cash flow from day one." |
| 0:47.5 | CTA | "One signature. A lower bill. Nothing else on your plate." |
| 0:55.0 | CTA | "Start The Exam at slash your energy cost dot com." |

The music cuts out from 13.5s to 15.4s, so the second line should finish by 13.5s and leave the silence clear.

This cut follows the original brief's rules: "Arizona Ford dealership" only, the 49% labeled client-reported, "a path to cash flow from day one", no "partner", and no figures beyond 49%, 7 days and 8 vendors.

## Rebuild

```sh
# 30s cut (use PAGE=index.html, 60, 450-frame segments and the 60s file names for the long cut)
python3 audio.py 30 ad-audio-30-raw.wav
for i in 0 1 2 3; do PAGE=cut30.html node render.cjs video $((i*225)) $(((i+1)*225)) seg$i.mp4 & done; wait
printf "file 'seg%d.mp4'\n" 0 1 2 3 > segs.txt
ffmpeg -f concat -safe 0 -i segs.txt -c copy video.mp4
ffmpeg -i video.mp4 -i ad-audio-30-raw.wav -c:v libx264 -preset slow -b:v 8M -maxrate 12M -bufsize 16M \
  -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -ar 48000 -movflags +faststart energy-plus-ad-30s.mp4
```

`PAGE=cut30.html node render.cjs stills out/ 0 6 18.5` renders single frames for quick checks.
