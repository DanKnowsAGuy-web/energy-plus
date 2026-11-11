/**
 * Energy Plus intake: the small secure piece behind the walkthrough's "Send your meter data" step.
 * Also runs each client's private savings plan page: a Drive folder per client, a welcome email with their link, and uploads by category.
 * Runs in Dan's Google account. It keeps the Bayou API key private, creates Bayou connection links,
 * checks their status, saves uploaded interval files to Google Drive, and emails Dan when data arrives.
 *
 * Setup (once):
 *   1. script.google.com > New project. Paste this whole file in place of the sample code.
 *   2. Project Settings (gear) > Script Properties > Add property:
 *        BAYOU_API_KEY = your Bayou key (from https://bayou.energy/dashboard/keys)
 *   3. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone. Deploy.
 *      Approve the permissions Google asks for (Drive, email, outside requests).
 *   4. Copy the Web app URL (ends in /exec) and send it to Claude to switch the walkthrough on.
 */

var NOTIFY_EMAIL = 'dan@danknowsaguy.org';
var ROOT_FOLDER_NAME = 'Energy Plus interval data';
var BAYOU_BASE = 'https://bayou.energy/api/v2';
var MAX_STARTS_PER_HOUR = 60;
var MAX_UPLOADS_PER_HOUR = 60;

/* private savings plan pages: one per client, reached by a link with a long random code */
var PROJECT_ROOT_NAME = 'Energy Plus projects';
var PROJECT_PAGE = 'https://slashyourenergycost.com/energy-plus/walkthrough/project/';
var DAN_PHONE = '864-777-0688';
var MAX_PROJECTS_PER_HOUR = 30;
var MAX_PROJECT_FILES_PER_HOUR = 600;
var CATS = { interval: 'Interval data', hvac: 'HVAC equipment', refrig: 'Refrigeration' };

function apiKey_() {
  var k = PropertiesService.getScriptProperties().getProperty('BAYOU_API_KEY');
  if (!k) throw new Error('BAYOU_API_KEY is not set in Script Properties');
  return k;
}

function bayou_(path, method, payload) {
  var opt = {
    method: method || 'get',
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(apiKey_() + ':') },
    contentType: 'application/json',
    muteHttpExceptions: true
  };
  if (payload) opt.payload = JSON.stringify(payload);
  var r = UrlFetchApp.fetch(BAYOU_BASE + path, opt);
  var text = r.getContentText();
  var body = null;
  try { body = text ? JSON.parse(text) : null; } catch (e) { body = { raw: text }; }
  return { code: r.getResponseCode(), body: body };
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* simple per-hour limits so a stranger can't flood Bayou or Drive */
function underLimit_(kind, max) {
  var cache = CacheService.getScriptCache();
  var key = kind + '-' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
  var n = Number(cache.get(key) || 0);
  if (n >= max) return false;
  cache.put(key, String(n + 1), 3700);
  return true;
}

function doGet(e) {
  var a = (e.parameter && e.parameter.action) || '';
  try {
    if (a === 'utilities') {
      var cache = CacheService.getScriptCache();
      var v = cache.get('utilities');
      if (!v) {
        var r = bayou_('/utilities');
        if (r.code !== 200) return out_({ ok: false, error: 'bayou ' + r.code, detail: (r.body && (r.body.detail || r.body.error || r.body.message)) || '' });
        var raw = Array.isArray(r.body) ? r.body : (r.body && (r.body.utilities || r.body.data || r.body.results)) || [];
        if (!Array.isArray(raw)) return out_({ ok: false, error: 'unexpected utilities shape', keys: Object.keys(r.body || {}) });
        var list = raw.filter(function (u) { return u && u.is_active !== false; })
          .map(function (u) { return { id: u.id, name: u.name, intervals: u.interval_availability || '' }; })
          .sort(function (x, y) { return String(x.name).localeCompare(String(y.name)); });
        v = JSON.stringify(list);
        cache.put('utilities', v, 21600);
      }
      return out_({ ok: true, utilities: JSON.parse(v) });
    }
    if (a === 'status') {
      var id = e.parameter.id;
      if (!id) return out_({ ok: false, error: 'missing id' });
      var s = bayou_('/customers/' + encodeURIComponent(id));
      var b = s.body || {};
      var flags = {};
      Object.keys(b).forEach(function (k) {
        if (/error|status|auth|mfa|verif|invalid|attention|credential|ready/i.test(k) && (typeof b[k] === 'boolean' || typeof b[k] === 'string')) flags[k] = b[k];
      });
      return out_({ ok: s.code === 200, has_filled_credentials: !!b.has_filled_credentials, bills_are_ready: !!b.bills_are_ready, intervals_are_ready: !!b.intervals_are_ready, flags: flags });
    }
    if (a === 'project') return out_(projectView_(e.parameter.id));
    return out_({ ok: true, service: 'energy-plus-intake' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (_) { return out_({ ok: false, error: 'bad request' }); }
  try {
    if (d.action === 'project_create') return out_(projectCreate_(d));
    if (d.action === 'project_upload') return out_(projectUpload_(d));
    if (d.action === 'start') {
      if (!underLimit_('start', MAX_STARTS_PER_HOUR)) return out_({ ok: false, error: 'busy' });
      var p = { utility: d.utility };
      if (d.email) p.email = d.email;
      var r = bayou_('/customers', 'post', p);
      if (r.code >= 300 || !r.body || !r.body.onboarding_link) return out_({ ok: false, error: 'bayou ' + r.code });
      notify_('Meter data: ' + (d.name || 'Someone') + ' started connecting ' + (d.utilityName || d.utility),
        lines_(d, ['Bayou customer id: ' + r.body.id, 'Utility: ' + (d.utilityName || d.utility)]));
      if (d.project) projectUpdate_(d.project, function (p) { p.bayou = r.body.id; p.utility = d.utilityName || ''; });
      return out_({ ok: true, id: r.body.id, link: r.body.onboarding_link });
    }
    if (d.action === 'connected') {
      if (d.project) projectUpdate_(d.project, function (p) { p.connected = true; });
      notify_('Meter data: ' + (d.name || 'Someone') + ' connected ' + (d.utilityName || 'their utility'),
        lines_(d, ['Bayou customer id: ' + d.id, 'Their utility login went through. Bills and interval data will appear in your Bayou dashboard as Bayou finishes pulling them.']));
      return out_({ ok: true });
    }
    if (d.action === 'stuck') {
      notify_('Meter data: ' + (d.name || 'Someone') + ' had trouble connecting', lines_(d, ['Bayou customer id: ' + (d.id || 'none'), 'Reason: ' + (d.reason || 'tapped "It\'s not working"')]));
      return out_({ ok: true });
    }
    if (d.action === 'upload') {
      if (!underLimit_('upload', MAX_UPLOADS_PER_HOUR)) return out_({ ok: false, error: 'busy' });
      var files = d.files || [];
      if (!files.length) return out_({ ok: false, error: 'no files' });
      var folder = clientFolder_(d.name, d.facility);
      files.forEach(function (f) {
        var blob = Utilities.newBlob(Utilities.base64Decode(f.data), f.type || 'application/octet-stream', String(f.name || 'interval-data').slice(0, 120));
        folder.createFile(blob);
      });
      notify_('Meter data: ' + (d.name || 'Someone') + ' uploaded ' + files.length + ' file' + (files.length > 1 ? 's' : ''),
        lines_(d, ['Folder: ' + folder.getUrl()]));
      return out_({ ok: true, count: files.length });
    }
    return out_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function clientFolder_(name, facility) {
  var roots = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  var root = roots.hasNext() ? roots.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
  var label = Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd HHmm') + ' ' + (name || 'Unknown') + (facility ? ' (' + facility + ')' : '');
  return root.createFolder(label.replace(/[\\\/]/g, '-'));
}

function lines_(d, extra) {
  return extra.concat([
    '',
    'Name: ' + (d.name || ''),
    'Phone: ' + (d.phone || ''),
    'Email: ' + (d.email || ''),
    'Facility: ' + (d.facility || ''),
    'Locations: ' + (d.locations || ''),
    'State(s): ' + (d.state || ''),
    'Estimate: ' + (d.estimate || ''),
    'From: ' + (d.source || '')
  ]).join('\n');
}

function notify_(subject, body) {
  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

/* ---------- private savings plan pages ---------- */

function getP_(id) {
  if (!/^[a-f0-9]{24}$/.test(String(id || ''))) return null;
  var v = PropertiesService.getScriptProperties().getProperty('p_' + id);
  return v ? JSON.parse(v) : null;
}
function putP_(id, p) { PropertiesService.getScriptProperties().setProperty('p_' + id, JSON.stringify(p)); }
function projectUpdate_(id, fn) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { var p = getP_(id); if (!p) return null; fn(p); putP_(id, p); return p; } finally { lock.releaseLock(); }
}
function link_(id) { return PROJECT_PAGE + '#p=' + id; }

function projectView_(id) {
  var p = getP_(id);
  if (!p) return { ok: false, error: 'not found' };
  return { ok: true, name: p.name, facility: p.facility, locations: p.locations, state: p.state, estimate: p.estimate,
    refrig: !!p.refrig, counts: p.counts || {}, utility: p.utility || '', connected: !!p.connected, bayou: !!p.bayou };
}

function projectCreate_(d) {
  var email = String(d.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'email' };
  if (!underLimit_('project', MAX_PROJECTS_PER_HOUR)) return { ok: false, error: 'busy' };
  var id = Utilities.getUuid().replace(/-/g, '').slice(0, 24);
  var roots = DriveApp.getFoldersByName(PROJECT_ROOT_NAME);
  var root = roots.hasNext() ? roots.next() : DriveApp.createFolder(PROJECT_ROOT_NAME);
  var label = Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd') + ' ' + (d.name || 'Unknown') + (d.facility ? ' (' + d.facility + ')' : '');
  var folder = root.createFolder(label.replace(/[\\\/]/g, '-'));
  var sub = {};
  Object.keys(CATS).forEach(function (k) { if (k !== 'refrig' || d.refrig) sub[k] = folder.createFolder(CATS[k]).getId(); });
  var p = { name: String(d.name || '').slice(0, 60), email: email, phone: String(d.phone || '').slice(0, 20), facility: d.facility || '',
    locations: d.locations || '', state: d.state || '', estimate: d.estimate || '', refrig: !!d.refrig, folder: folder.getId(), sub: sub,
    counts: {}, created: new Date().toISOString(), source: d.source || '' };
  putP_(id, p);
  folder.createFile('About this client.txt', lines_(d, ['Private page: ' + link_(id), 'Email: ' + email]), MimeType.PLAIN_TEXT);
  welcome_(p, id);
  notify_('New savings plan page: ' + (p.name || 'Someone') + (p.facility ? ' (' + p.facility + ')' : ''),
    lines_(d, ['Their private page: ' + link_(id), 'Drive folder: ' + folder.getUrl(), 'Email: ' + email]));
  return { ok: true, id: id, link: link_(id) };
}

function welcome_(p, id) {
  var link = link_(id), hi = p.name ? 'Hi ' + p.name + ',' : 'Hi,';
  var items = [
    ['Your meter\'s 15-minute data', 'On your page, connect your utility account (about 2 minutes) or upload the file from your utility\'s website.'],
    ['Your HVAC equipment', 'A list if you have one. If not, just take a photo of the label on each unit, the metal plate with the model and serial numbers.']
  ];
  if (p.refrig) items.push(['Refrigeration (optional)', 'If you have an equipment list or photos of the rack labels, add those too.']);
  var text = hi + '\n\nHere is your private Energy Plus page: ' + link + '\n\nTwo things turn your estimate into real numbers:\n\n' +
    items.map(function (x, i) { return (i + 1) + '. ' + x[0] + ': ' + x[1]; }).join('\n') +
    '\n\nAdd them anytime, from your phone or computer. Questions? Text me at ' + DAN_PHONE + '.\n\nKeep this link to yourself or your team. Anyone with it can add files to your page.\n\nDan Gutierrez\nEnergy Plus';
  var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var html = '<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#14212a;max-width:560px">' +
    '<p>' + esc(hi) + '</p><p>Here is your private Energy Plus page:</p>' +
    '<p><a href="' + link + '" style="display:inline-block;background:#174e58;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold">Open my savings plan</a></p>' +
    '<p>Two things turn your estimate into real numbers:</p><ol>' + items.map(function (x) { return '<li style="margin-bottom:8px"><b>' + esc(x[0]) + '.</b> ' + esc(x[1]) + '</li>'; }).join('') + '</ol>' +
    '<p>Add them anytime, from your phone or computer. Questions? Text me at <a href="sms:+18647770688">' + DAN_PHONE + '</a>.</p>' +
    '<p style="color:#56656e;font-size:14px">Keep this link to yourself or your team. Anyone with it can add files to your page.<br>' + esc(link) + '</p>' +
    '<p>Dan Gutierrez<br>Energy Plus</p></div>';
  MailApp.sendEmail({ to: p.email, subject: 'Your Energy Plus savings plan', body: text, htmlBody: html, name: 'Dan Gutierrez, Energy Plus', replyTo: NOTIFY_EMAIL });
}

function projectUpload_(d) {
  var p = getP_(d.id);
  if (!p) return { ok: false, error: 'not found' };
  if (!CATS[d.cat] || !p.sub[d.cat]) return { ok: false, error: 'bad category' };
  if (!underLimit_('pfile', MAX_PROJECT_FILES_PER_HOUR)) return { ok: false, error: 'busy' };
  var f = d.file || {};
  if (!f.data) return { ok: false, error: 'no file' };
  var blob = Utilities.newBlob(Utilities.base64Decode(f.data), f.type || 'application/octet-stream', String(f.name || 'file').slice(0, 120));
  DriveApp.getFolderById(p.sub[d.cat]).createFile(blob);
  var now = Date.now(), notifyNow = false;
  p = projectUpdate_(d.id, function (q) {
    q.counts = q.counts || {}; q.counts[d.cat] = (q.counts[d.cat] || 0) + 1;
    q.pending = (q.pending || 0) + 1;
    if (!q.notified || now - q.notified > 20 * 60 * 1000) { notifyNow = true; q.notified = now; }
  });
  if (notifyNow) {
    notify_('Files from ' + (p.name || 'a client') + ': ' + CATS[d.cat],
      ['They are adding files to their savings plan page. You will get one email per 20 minutes while they keep uploading.', '',
       'Drive folder: https://drive.google.com/drive/folders/' + p.folder, 'Their page: ' + link_(d.id), '',
       'Received so far: ' + Object.keys(CATS).filter(function (k) { return p.sub[k]; }).map(function (k) { return CATS[k] + ' ' + (p.counts[k] || 0); }).join(', '),
       '', 'Name: ' + p.name, 'Phone: ' + p.phone, 'Email: ' + p.email, 'Facility: ' + p.facility, 'Estimate: ' + p.estimate].join('\n'));
  }
  return { ok: true, counts: p.counts };
}
