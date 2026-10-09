# "We handle all of it" 60s vertical ad

The motion-graphics ad from `turnkey-ad-video-prompt.md`, built as code instead of AI video so the
type stays crisp and every number, word and cut is exact.

- `energy-plus-ad.mp4`: final 1080x1920, 30fps, 60s, H.264 + AAC. Music and sound design only, no voiceover yet.
- `ad-audio.m4a`: the music + SFX bed on its own, for mixing the voiceover in an editor.
- `index.html`: the animation. Open it in a browser and click to play (it plays `ad-audio.m4a` in sync). Add `?t=45` to start at a timestamp.
- `render.cjs`: frame-exact renderer (headless Chromium, piped to ffmpeg).
- `audio.py`: synthesizes the 120 BPM bed and every SFX from scratch (numpy/scipy), so there is nothing to license.

## Rebuild

```sh
python3 audio.py ad-audio-raw.wav
for i in 0 1 2 3; do node render.cjs video $((i*450)) $(((i+1)*450)) seg$i.mp4 & done; wait
printf "file 'seg%d.mp4'\n" 0 1 2 3 > segs.txt
ffmpeg -f concat -safe 0 -i segs.txt -c copy video.mp4
ffmpeg -i video.mp4 -i ad-audio-raw.wav -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -ar 48000 -movflags +faststart energy-plus-ad.mp4
```

`node render.cjs stills out/ 3 12.5 46` renders single frames for quick checks.

## Voiceover cue sheet

Record Dan reading these lines and drop each one at its start time. Sit the music about 6 dB under the voice.

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

Beat drop: the music cuts out from 13.5s to 15.4s. Keep the second line finished by 13.5s so it lands in the silence.

## Accuracy rules this build follows

- Only "Arizona Ford dealership", never the dealership's name, and the 49% is labeled "Client-reported. Results vary."
- "A path to cash flow day one", never "guaranteed".
- No "partner".
- The only figures on screen are 49%, 7 days and 8 vendors. The bill uses $ / $$ / $$$ instead of dollar amounts, and the cash-flow chart's baseline reads "BREAK-EVEN" instead of a number.
