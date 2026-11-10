/**
 * Energy Plus intake: the small secure piece behind the walkthrough's "Send your meter data" step.
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
        var list = (r.body || []).filter(function (u) { return u && u.is_active !== false; })
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
    return out_({ ok: true, service: 'energy-plus-intake' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (_) { return out_({ ok: false, error: 'bad request' }); }
  try {
    if (d.action === 'start') {
      if (!underLimit_('start', MAX_STARTS_PER_HOUR)) return out_({ ok: false, error: 'busy' });
      var p = { utility: d.utility };
      if (d.email) p.email = d.email;
      var r = bayou_('/customers', 'post', p);
      if (r.code >= 300 || !r.body || !r.body.onboarding_link) return out_({ ok: false, error: 'bayou ' + r.code });
      notify_('Meter data: ' + (d.name || 'Someone') + ' started connecting ' + (d.utilityName || d.utility),
        lines_(d, ['Bayou customer id: ' + r.body.id, 'Utility: ' + (d.utilityName || d.utility)]));
      return out_({ ok: true, id: r.body.id, link: r.body.onboarding_link });
    }
    if (d.action === 'connected') {
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
