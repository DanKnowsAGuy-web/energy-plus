// Renders index.html frame by frame with headless Chromium and pipes the frames to ffmpeg.
//   node render.cjs video <startFrame> <endFrame> <out.mp4>
//   node render.cjs stills <outDir> <t1> <t2> ...
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
let chromium;
try { ({ chromium } = require("playwright")); }
catch { ({ chromium } = require(path.join(require("child_process").execSync("npm root -g").toString().trim(), "playwright"))); }

const FPS = 30;
const [, , mode, ...args] = process.argv;

(async () => {
  const browser = await chromium.launch({ args: ["--allow-file-access-from-files", "--font-render-hinting=none", "--force-color-profile=srgb"] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on("pageerror", e => { console.error("PAGE ERROR:", e.message); process.exitCode = 1; });
  page.on("console", m => { if (m.type() === "error") console.error("console:", m.text()); });
  await page.goto("file://" + path.resolve(__dirname, "index.html") + "?render=1");
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });

  if (mode === "stills") {
    const [outDir, ...times] = args;
    fs.mkdirSync(outDir, { recursive: true });
    for (const t of times) {
      await page.evaluate(t => window.renderFrame(t), +t);
      await page.screenshot({ path: path.join(outDir, `t${(+t).toFixed(2).padStart(6, "0")}.png`) });
    }
  } else {
    const [start, end, out] = args;
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
      "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
      "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-tune", "film",
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", out], { stdio: ["pipe", "inherit", "inherit"] });
    const t0 = Date.now();
    for (let f = +start; f < +end; f++) {
      await page.evaluate(t => window.renderFrame(t), f / FPS);
      const buf = await page.screenshot({ type: "png" });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
      if ((f - start) % 90 === 0) console.log(`${out}: frame ${f} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on("close", r));
  }
  await browser.close();
})();
