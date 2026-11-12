/* Energy Plus private savings plan page. The link carries a long random code (#p=...) that identifies the client.
   Everything goes through the intake web app (Google Apps Script), which saves files to the client's Drive folder. */
(function () {
  var INTAKE_URL = "https://script.google.com/macros/s/AKfycby0oCtF2DdFc4a8CI9OGv42wnNedcGFvEWuIj0FE-bZjA21tcx_AJ29wdpoSavDZTpm/exec";
  var PHONE_DISPLAY = "864-777-0688", PHONE_E164 = "+18647770688", BOOK = "https://book.slashyourenergycost.com";
  var MAX_MB = 20;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function get(params) { return fetch(INTAKE_URL + "?" + new URLSearchParams(params).toString()).then(function (r) { return r.json(); }); }
  function post(body) { return fetch(INTAKE_URL, { method: "POST", body: JSON.stringify(body) }).then(function (r) { return r.json(); }); }

  var m = (location.hash || "").match(/p=([a-f0-9]{24})/) || (location.search || "").match(/p=([a-f0-9]{24})/);
  var ID = m ? m[1] : null, P = null;
  try { if (window.Watt) Watt.mount($("#av"), 44, { onPetrol: true, state: "listen" }); } catch (e) {}

  var main = $("#main");
  if (!ID) return fail();
  get({ action: "project", id: ID }).then(function (d) {
    if (!d || !d.ok) return fail();
    P = d; render();
  }).catch(function () { fail(true); });

  function fail(network) {
    $("#title").textContent = network ? "We couldn't load your page" : "This link doesn't work";
    $("#lead").textContent = network ? "Check your connection and try again." : "It may be missing part of the address. Open the link from your email again.";
    main.innerHTML = '<div class="err"><p>Need a hand? Dan can send you a fresh link.</p><div class="row"><a class="btn" href="sms:' + PHONE_E164 + '">Text Dan</a><span class="mono">' + PHONE_DISPLAY + "</span></div></div>";
  }

  function intervalDone() { return P.connected || (P.counts.interval || 0) > 0; }
  function hvacDone() { return (P.counts.hvac || 0) > 0; }

  function progress() {
    var n = (intervalDone() ? 1 : 0) + (hvacDone() ? 1 : 0);
    $("#prog").hidden = false;
    $("#progt").textContent = n === 2 ? "Both done" : n + " of 2 done";
    $("#progbar").style.width = (n === 2 ? 100 : n === 1 ? 55 : 8) + "%";
    try { if (window.Watt) Watt.set(n === 2 ? "verify" : "listen"); } catch (e) {}
    ["interval", "hvac"].forEach(function (k) {
      var el = $("#s-" + k), done = k === "interval" ? intervalDone() : hvacDone();
      if (!el) return;
      el.classList.toggle("done", done);
      $(".num", el).textContent = done ? "✓" : (k === "interval" ? "1" : "2");
      $(".have", el).hidden = !done;
      $(".have", el).textContent = k === "interval" && P.connected && !(P.counts.interval) ? "Utility connected" : "Received: " + (P.counts[k] || 0) + ((P.counts[k] || 0) === 1 ? " file" : " files") + (k === "interval" && P.connected ? ", utility connected" : "");
    });
    var r = $("#s-refrig");
    if (r) { var c = P.counts.refrig || 0; $(".have", r).hidden = !c; $(".have", r).textContent = "Received: " + c + (c === 1 ? " file" : " files"); r.classList.toggle("done", !!c); }
    if (n === 2) $("#lead").textContent = "You've sent everything we need. Dan will follow up with your real numbers. You can still add more anytime.";
  }

  function dropzone(cat, title, sub, accept) {
    return '<label class="drop" data-cat="' + cat + '"><input type="file" multiple accept="' + accept + '"><b>' + title + '</b><span>' + sub + '</span></label><ul class="files" id="f-' + cat + '"></ul>';
  }

  function render() {
    var first = P.name ? P.name + ", here" : "Here";
    $("#title").textContent = first + "'s your savings plan";
    $("#lead").textContent = "Two things turn your estimate" + (P.estimate ? " (" + P.estimate + ")" : "") + " into real numbers for your " + (P.facility ? P.facility.split(" /")[0].toLowerCase() : "building") + ". Add them anytime, from your phone or computer. Dan reads every file you send and texts you when your numbers are updated.";
    var html =
      '<section class="step" id="s-interval"><div class="sh"><span class="num">1</span><div><p class="tagline">Required</p><h2>Your meter&rsquo;s 15-minute data</h2></div></div>' +
      '<p class="why">Your meter records your power use every 15 minutes. It shows exactly when your busiest 15 minutes happen, which is how we size your peak demand savings.</p>' +
      '<span class="have" hidden></span>' +
      '<div id="connect"><p><b>Fastest:</b> connect your utility account. About 2 minutes. You log in through Bayou Energy, a secure utility-data service, so your password goes to them, not to us.</p>' +
      '<label class="l" for="util">Who is your electric utility?</label><input class="t" id="util" list="utils" autocomplete="off" placeholder="Start typing your utility"><datalist id="utils"></datalist>' +
      '<div class="row"><button class="btn" id="go" type="button">Connect</button></div><div id="cstate" aria-live="polite"></div></div>' +
      '<p class="or">or upload the file</p>' +
      '<ol class="how"><li>Log in to your electric utility&rsquo;s website, the one that sends your bill.</li><li>Look for <b>Usage</b>, <b>Energy use</b>, or <b>Green Button: Download My Data</b>.</li><li>Download <b>15-minute</b> (or hourly) data for the <b>last 12 months</b>.</li>' + (/Texas/.test(P.state || "") ? '<li>In Texas, most areas get it from <b>Smart Meter Texas</b> at smartmetertexas.com.</li>' : "") + '</ol>' +
      '<p class="msg">Only have monthly bills? Send the last 12 instead. They help too, and Dan will tell you if the 15-minute file would change your numbers.</p>' +
      dropzone("interval", "Upload your usage file", "15-minute data or monthly bills: spreadsheet, CSV, PDF or zip", ".csv,.xlsx,.xls,.xml,.zip,.pdf,.txt,.json") +
      "</section>" +
      '<section class="step" id="s-hvac"><div class="sh"><span class="num">2</span><div><p class="tagline">Required</p><h2>Your HVAC equipment</h2></div></div>' +
      '<p class="why">Make, model, size and age of each unit tell us how much your system can save.</p>' +
      '<span class="have" hidden></span>' +
      "<p>Have an equipment list? Upload it. If not, <b>photos work great</b>.</p>" +
      '<div class="tip"><b>What to photograph:</b> the metal label on each rooftop unit or air handler, the one with the model and serial numbers. One clear photo per unit is plenty.</div>' +
      dropzone("hvac", "Add photos or files", "Photos, Excel, Word or PDF. On a phone you can take photos right here.", "image/*,.heic,.heif,.pdf,.xlsx,.xls,.csv,.doc,.docx,.zip,.txt") +
      "</section>" +
      (P.refrig ? '<section class="step" id="s-refrig"><div class="sh"><span class="num">+</span><div><p class="tagline">Optional</p><h2>Refrigeration</h2></div></div>' +
        '<p class="why">If you have an equipment list, or can easily photograph the labels on your refrigeration racks or condensers, add them here. Skip it if it&rsquo;s a hassle.</p>' +
        '<span class="have" hidden></span>' + dropzone("refrig", "Add photos or files", "Photos, Excel, Word or PDF", "image/*,.heic,.heif,.pdf,.xlsx,.xls,.csv,.doc,.docx,.zip,.txt") + "</section>" : "") +
      '<div class="talk"><p>Rather we help? Dan will walk you through it.</p><div class="row" style="justify-content:center"><a class="btn" href="sms:' + PHONE_E164 + "?body=" + encodeURIComponent("Hi Dan, it's " + (P.name || "") + ". I have a question about my savings plan.") + '">Text Dan</a><a class="btn alt" href="' + BOOK + '" target="_blank" rel="noopener">Book a call</a></div></div>' +
      '<p class="small">This page is private to you. Anyone with this link can add files, so share it only with your team. <a href="../privacy/" target="_blank" rel="noopener">Privacy notice</a></p>';
    main.innerHTML = html;
    progress();
    Array.prototype.forEach.call(document.querySelectorAll(".drop"), wireDrop);
    wireConnect();
  }

  /* ---------- uploads: one file per request; large phone photos are shrunk first ---------- */
  function wireDrop(z) {
    var cat = z.dataset.cat, input = $("input", z), list = $("#f-" + cat), queue = Promise.resolve();
    function add(files) {
      Array.prototype.forEach.call(files, function (f) {
        var li = document.createElement("li");
        li.innerHTML = "<span>" + esc(f.name) + '</span><span class="s wait">Waiting</span>';
        list.appendChild(li);
        var st = li.lastChild;
        queue = queue.then(function () {
          if (f.size > MAX_MB * 1024 * 1024 && !/^image\//.test(f.type)) { st.className = "s bad"; st.textContent = "Over " + MAX_MB + " MB"; return; }
          st.textContent = "Uploading";
          return prep(f).then(function (x) {
            if (x.data.length > MAX_MB * 1.37 * 1024 * 1024) throw new Error("big");
            return post({ action: "project_upload", id: ID, cat: cat, file: x });
          }).then(function (d) {
            if (!d || !d.ok) throw new Error("fail");
            P.counts = d.counts || P.counts;
            st.className = "s ok"; st.textContent = "Sent ✓"; progress();
          }).catch(function () { st.className = "s bad"; st.textContent = "Didn't send. Try again"; });
        });
      });
    }
    input.addEventListener("change", function () { add(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.remove("over"); }); });
    z.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files); });
  }

  function readB64(blob) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(",")[1] || ""); }; r.onerror = rej; r.readAsDataURL(blob); });
  }
  function prep(f) {
    var plain = function () { return readB64(f).then(function (d) { return { name: f.name, type: f.type, data: d }; }); };
    if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size < 1.5 * 1024 * 1024) return plain();
    return new Promise(function (res) {
      var img = new Image(), url = URL.createObjectURL(f);
      img.onload = function () {
        var k = Math.min(1, 2400 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (!b) return res(plain());
          readB64(b).then(function (d) { res({ name: f.name.replace(/\.(png|webp)$/i, ".jpg"), type: "image/jpeg", data: d }); });
        }, "image/jpeg", 0.86);
      };
      img.onerror = function () { URL.revokeObjectURL(url); res(plain()); };
      img.src = url;
    });
  }

  /* ---------- connect the utility through Bayou (free to connect; Dan decides what to unlock) ---------- */
  function wireConnect() {
    var box = $("#connect"), utilIn = $("#util"), list = $("#utils"), st = $("#cstate"), utils = [], poll = null, tries = 0;
    if (P.connected) { box.innerHTML = '<p class="msg ok">Your utility' + (P.utility ? " (" + esc(P.utility) + ")" : "") + " is connected. Nothing more needed here.</p>"; return; }
    get({ action: "utilities" }).then(function (d) {
      utils = (d && d.utilities) || [];
      list.innerHTML = utils.map(function (u) { return '<option value="' + esc(u.name) + '"></option>'; }).join("");
    }).catch(function () {});
    var who = { name: P.name, facility: P.facility, locations: P.locations, state: P.state, estimate: P.estimate, source: "savings plan page", project: ID };
    function body(extra) { var o = {}; Object.keys(who).forEach(function (k) { o[k] = who[k]; }); Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; }
    $("#go").addEventListener("click", function () {
      var v = (utilIn.value || "").trim().toLowerCase(), u = utils.filter(function (x) { return String(x.name).toLowerCase() === v; })[0];
      if (!u && v) u = utils.filter(function (x) { return String(x.name).toLowerCase().indexOf(v) === 0; })[0];
      if (!u) { st.innerHTML = '<p class="msg warn">Pick your utility from the list as you type. Not listed? Upload the file below instead.</p>'; return; }
      utilIn.value = u.name;
      st.innerHTML = '<p class="msg">Setting up your secure login&hellip;</p>';
      post(body({ action: "start", utility: u.id, utilityName: u.name })).then(function (d) {
        if (!d || !d.ok || !d.link) throw new Error("start");
        var cid = d.id;
        st.innerHTML = '<div class="row"><a class="btn" href="' + esc(d.link) + '" target="_blank" rel="noopener">Open my utility login</a></div><p class="msg">Log in there, then come back to this page. I&rsquo;ll know when it worked.</p><button class="link" id="bad" type="button">It&rsquo;s not working</button>';
        $("#bad").addEventListener("click", function () {
          clearInterval(poll); post(body({ action: "stuck", id: cid, reason: "tapped It's not working on the savings plan page" })).catch(function () {});
          st.innerHTML = '<p class="msg warn">No problem. Upload the file below instead, or text Dan and he&rsquo;ll help.</p>';
        });
        clearInterval(poll); tries = 0;
        poll = setInterval(function () {
          if (document.hidden) return;
          if (++tries > 150) { clearInterval(poll); return; }
          get({ action: "status", id: cid }).then(function (s) {
            if (s && s.has_filled_credentials) {
              clearInterval(poll);
              P.connected = true; P.utility = u.name;
              post(body({ action: "connected", id: cid, utilityName: u.name })).catch(function () {});
              box.innerHTML = '<p class="msg ok">Connected. Your meter data is on its way to us.</p>';
              progress();
            }
          }).catch(function () {});
        }, 6000);
      }).catch(function () { st.innerHTML = '<p class="msg warn">That didn&rsquo;t connect. Upload the file below instead, or text Dan.</p>'; });
    });
  }
})();
