(() => {
  'use strict';
  const A = window.JARVIS_API, $ = id => document.getElementById(id), S = () => A.settings, esc = A.escapeHTML;
  const N = window.JarvisNative || null; // optional Android bridge (addJavascriptInterface) — see notes
  const KEY = 'jarvisXV1';
  const safe = v => { try { return JSON.parse(v) || {}; } catch { return {}; } };
  const X = Object.assign({ wake: false, imgModel: '', contacts: '', memory: [], autos: [], reminders: [] }, safe(localStorage.getItem(KEY)));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(X)); } catch {} };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const pad = n => String(n).padStart(2, '0');
  const digits = s => String(s).replace(/\D/g, '');
  const open = url => { try { window.open(url, '_blank'); } catch {} };
  const waLink = (num, text) => `https://wa.me/${num}` + (text ? `?text=${encodeURIComponent(text)}` : '');
  const JX = window.JX = { handsFree: false, handle, turnDone, pause: () => stopRec(), memoryPrompt };

  /* ---------- memory ---------- */
  function memoryPrompt() { return X.memory.length ? '\n\nFacts the user asked you to remember:\n- ' + X.memory.join('\n- ') : ''; }

  /* ---------- notifications, reminders, WhatsApp automations ---------- */
  function askNotify() { try { if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch {} }
  navigator.serviceWorker?.register('sw.js').catch(() => {});
  async function notify(title, body) {
    A.showToast(title + ': ' + body);
    try {
      if (Notification.permission !== 'granted') return;
      const reg = await navigator.serviceWorker?.ready;
      reg ? reg.showNotification(title, { body }) : new Notification(title, { body });
    } catch {}
  }
  const timers = {};
  function arm(r) {
    clearTimeout(timers[r.id]);
    timers[r.id] = setTimeout(() => {
      notify('Reminder', r.text); A.appendMessage('assistant', `⏰ Reminder: ${r.text}`);
      if (S().speak || JX.handsFree) A.speakText('Reminder: ' + r.text);
      X.reminders = X.reminders.filter(x => x.id !== r.id); save();
    }, Math.max(0, r.at - Date.now()));
  }
  function parseWhen(s) {
    let m = s.match(/in (\d+|an?|half an?)\s*(second|sec|minute|min|hour|hr)s?/i);
    if (m) { const n = /^an?$/i.test(m[1]) ? 1 : /half/i.test(m[1]) ? .5 : +m[1]; return { at: Date.now() + n * (/^h/i.test(m[2]) ? 36e5 : /^s/i.test(m[2]) ? 1e3 : 6e4), rest: s.replace(m[0], '') }; }
    m = s.match(/at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (m) { let h = +m[1]; if (m[3]) h = h % 12 + (/pm/i.test(m[3]) ? 12 : 0); const d = new Date(); d.setHours(h, +(m[2] || 0), 0, 0); if (d <= Date.now()) d.setDate(d.getDate() + 1); return { at: +d, rest: s.replace(m[0], '') }; }
    return null;
  }
  setInterval(() => {
    const d = new Date(), day = d.toDateString();
    X.autos.forEach(a => {
      if (a.last === day || d.getHours() !== a.h || d.getMinutes() !== a.mi) return;
      a.last = day; save(); const url = waLink(a.num, a.msg);
      notify('WhatsApp for ' + a.name, 'Tap to send: ' + a.msg);
      A.appendMessage('assistant', `📨 Scheduled WhatsApp for ${a.name} — tap to send:\n${url}`); open(url);
    });
  }, 20000);
  setTimeout(() => X.reminders.forEach(arm), 800);

  /* ---------- contacts, WhatsApp, calls ---------- */
  function findContact(q) {
    q = q.trim().toLowerCase().replace(/^my /, '');
    if (digits(q).length >= 8) return { name: q, num: digits(q), raw: q.replace(/[^\d+]/g, '') };
    for (const line of X.contacts.split('\n')) {
      const i = line.indexOf(':'); if (i < 1) continue;
      const n = line.slice(0, i).trim().toLowerCase();
      if (n === q || n.includes(q)) return { name: line.slice(0, i).trim(), num: digits(line.slice(i + 1)), raw: line.slice(i + 1).replace(/[^\d+]/g, '') };
    }
    return null;
  }
  const miss = n => n.split(/\s+/).length > 3 ? null : `I don't have a number for “${n}”. Add them in ✦ Tools → Contacts, with the country code.`;
  const sendWA = (c, body) => { const url = waLink(c.num, body); open(url); return `Opening WhatsApp with your message to ${c.name} ready — tap Send.\n${url}`; };

  /* ---------- phone settings ---------- */
  const SET = { 'wi-fi': 'WIFI_SETTINGS', bluetooth: 'BLUETOOTH_SETTINGS', display: 'DISPLAY_SETTINGS', brightness: 'DISPLAY_SETTINGS', sound: 'SOUND_SETTINGS', volume: 'SOUND_SETTINGS', battery: 'BATTERY_SAVER_SETTINGS', location: 'LOCATION_SOURCE_SETTINGS', airplane: 'AIRPLANE_MODE_SETTINGS', 'mobile data': 'DATA_ROAMING_SETTINGS', data: 'DATA_ROAMING_SETTINGS', settings: 'SETTINGS', setting: 'SETTINGS' };

  /* ---------- camera / vision ---------- */
  async function openCamera(auto) {
    const ov = document.createElement('div'); ov.className = 'overlay cam';
    ov.innerHTML = '<div class="cam-box"><video playsinline autoplay muted></video><div class="cam-bar"><button class="secondary-button" data-a="flip">Flip</button><button class="primary-button" data-a="snap">Capture</button><button class="secondary-button" data-a="close">Close</button></div></div>';
    document.body.append(ov);
    const v = ov.querySelector('video'); let stream, facing = 'environment';
    const close = () => { stream?.getTracks().forEach(t => t.stop()); ov.remove(); };
    const start = async () => {
      stream?.getTracks().forEach(t => t.stop());
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false }); v.srcObject = stream; }
      catch { A.showToast('Camera unavailable or permission denied'); close(); }
    };
    const snap = () => {
      if (!v.videoWidth) return;
      const k = Math.min(1, 1024 / v.videoWidth), c = document.createElement('canvas'); c.width = v.videoWidth * k; c.height = v.videoHeight * k;
      c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
      c.toBlob(b => { close(); A.selectFile(new File([b], 'camera.jpg', { type: 'image/jpeg' })); auto ? A.sendMessage(auto) : $('messageInput').focus(); }, 'image/jpeg', .85);
    };
    ov.onclick = e => { const a = e.target.dataset.a; if (a === 'close') close(); if (a === 'snap') snap(); if (a === 'flip') { facing = facing === 'environment' ? 'user' : 'environment'; start(); } };
    await start(); if (auto) setTimeout(snap, 1800);
  }

  /* ---------- AI image → share to WhatsApp ---------- */
  const b64Blob = (b, type) => { const a = atob(b), u = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) u[i] = a.charCodeAt(i); return new Blob([u], { type }); };
  async function genImage(prompt) {
    const s = S();
    if (s.provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.apiKey }, body: JSON.stringify({ model: X.imgModel || 'gpt-image-1', prompt, size: '1024x1024' }) });
      const d = await r.json(); if (!r.ok) throw new Error(d?.error?.message || 'Image request failed');
      const it = d.data?.[0]; return it?.b64_json ? b64Blob(it.b64_json, 'image/png') : (await fetch(it.url)).blob();
    }
    const m = X.imgModel || 'gemini-2.5-flash-image';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(s.apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }) });
    const d = await r.json(); if (!r.ok) throw new Error(d?.error?.message || 'Image request failed');
    const p = (d.candidates?.[0]?.content?.parts || []).find(p => p.inlineData || p.inline_data), i = p && (p.inlineData || p.inline_data);
    if (!i) throw new Error('No image came back. Check the image model name in ✦ Tools.');
    return b64Blob(i.data, i.mimeType || i.mime_type || 'image/png');
  }
  async function makeImage(prompt, who) {
    const s = S(); if (s.provider === 'demo' || !s.apiKey) return 'Image creation needs an OpenAI or Gemini API key — add one in Settings.';
    A.showToast('Creating your image…');
    try {
      const blob = await genImage(prompt), url = URL.createObjectURL(blob), file = new File([blob], 'jarvis-image.png', { type: blob.type || 'image/png' });
      A.appendMessage('assistant', `Here is your image: “${prompt}”` + (who ? `\n\nTap “Send to WhatsApp” and choose ${who}.` : ''));
      const body = document.querySelector('#messages .message.assistant:last-child .message-body');
      const img = new Image(); img.src = url; img.className = 'gen-img'; body.querySelector('.bubble').after(img);
      const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Send to WhatsApp';
      btn.onclick = async () => {
        if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text: prompt }); } catch {} }
        else { const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); A.showToast('Sharing isn’t supported here — image saved instead'); }
      };
      body.querySelector('.message-tools').append(btn);
      if (s.speak || JX.handsFree) A.speakText('Your image is ready.');
      return true;
    } catch (e) { return `I couldn't create the image. ${e.message}`; }
  }

  /* ---------- voice command router ---------- */
  let pending = null;
  const AUTO = /every\s*day at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?\D*?(?:send|message|text)\s+(.+?)\s+to\s+(.+?)(?:\s+on whatsapp)?$/i;
  async function handle(raw) {
    const t = raw.trim().replace(/[.!?]+$/, ''); let m;
    if (pending) { const p = pending; pending = null; return /^(cancel|never mind|no)$/i.test(t) ? 'Okay, cancelled.' : sendWA(p, t); }
    if (/^(stop|exit|turn off) (listening|hands.?free)/i.test(t)) { setHF(false); return 'Okay, hands-free is off.'; }
    if ((m = t.match(/^remember (?:that )?(.+)/i))) { X.memory.push(m[1]); save(); return `Got it. I'll remember: ${m[1]}`; }
    if (/^(what do you remember|what do you know about me|show (my )?memor)/i.test(t)) return X.memory.length ? 'Here is what I remember:\n\n' + X.memory.map(x => '- ' + x).join('\n') : 'Nothing saved yet. Say “remember that …”.';
    if ((m = t.match(/^forget (.+)/i))) {
      const k = m[1].toLowerCase().replace(/^that /, ''), n = X.memory.length;
      X.memory = /^(everything|all)/.test(k) ? [] : X.memory.filter(x => !x.toLowerCase().includes(k)); save();
      return n === X.memory.length ? "I couldn't find that in memory." : 'Done — forgotten.';
    }
    if ((m = t.match(/^(?:set (?:a )?reminder|remind me)\s+(.*)/i))) {
      const w = parseWhen(m[1]); if (!w) return 'Tell me when, e.g. “remind me in 10 minutes to drink water” or “remind me at 6:30 pm to call Mom”.';
      const r = { id: uid(), at: w.at, text: w.rest.trim().replace(/^(to|that|about)\s+/i, '') || 'Reminder' };
      X.reminders.push(r); save(); arm(r); askNotify();
      return `Okay — I'll remind you at ${new Date(r.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}: ${r.text}. The app needs to stay running to alert you.`;
    }
    if ((m = t.match(AUTO))) {
      const c = findContact(m[5]); if (!c) return miss(m[5]) || `I don't have a number for “${m[5]}”.`;
      let h = +m[1]; if (m[3]) h = h % 12 + (/pm/i.test(m[3]) ? 12 : 0); const mi = +(m[2] || 0);
      X.autos.push({ id: uid(), name: c.name, num: c.num, msg: m[4], h, mi, last: '' }); save(); askNotify();
      return `Scheduled: every day at ${pad(h)}:${pad(mi)} I'll prepare “${m[4]}” for ${c.name} on WhatsApp. WhatsApp can't be sent silently from a web app, so you'll get an alert and tap Send once.`;
    }
    if ((m = t.match(/\b(?:create|generate|make|draw)\s+(?:me\s+)?(?:an?\s+)?(?:ai\s+)?(?:image|photo|picture)\s+(?:of\s+)?(.+?)(?:\s+and\s+(?:send|share)\s+(?:it\s+)?to\s+(.+?))?(?:\s+on whatsapp)?$/i))) return makeImage(m[1], m[2]);
    if (/^(?:open (?:the )?camera|what do you see|what is this|look at this|scan this|describe (?:this|what you see))/i.test(t)) { openCamera(/^open/i.test(t) ? '' : /see/i.test(t) ? 'What do you see? Describe it clearly.' : t); return 'Opening the camera…'; }
    if ((m = t.match(/^(open|turn on|turn off|switch on|switch off|toggle|enable|disable|change|adjust|set)\s+(?:the\s+)?(wi-?fi|bluetooth|display|brightness|sound|volume|battery|location|airplane(?: mode)?|mobile data|data|settings?)(?:\s+settings?)?$/i))) {
      const verb = m[1].toLowerCase(), word = m[2].toLowerCase().replace('wifi', 'wi-fi').replace(/ mode$/, '');
      if (N?.setSetting && /\b(on|off|enable|disable)\b/.test(verb)) { N.setSetting(word, /\b(on|enable)\b/.test(verb)); return `Done — ${word} ${/\b(on|enable)\b/.test(verb) ? 'on' : 'off'}.`; }
      const act = SET[word] || 'SETTINGS';
      N?.openSetting ? N.openSetting(act) : (location.href = 'intent:#Intent;action=android.settings.' + act + ';end');
      return `Opening ${word} settings. Android doesn't let apps flip these silently, so toggle it on that screen.`;
    }
    if (/\b(unread|new)\s+(messages|notifications)|read (my )?(messages|notifications)/i.test(t)) {
      if (N?.getUnread) { try { const l = JSON.parse(N.getUnread()); return l.length ? `You have ${l.length} unread:\n\n` + l.map(x => `- ${x.app || ''} ${x.from || ''}: ${x.text}`).join('\n') : 'No unread messages.'; } catch {} }
      return "Reading your unread WhatsApp/SMS messages needs Android notification access, which a web page can't get. It works once the native app provides JarvisNative.getUnread().";
    }
    if ((m = t.match(/^(?:(whatsapp)\s+)?(?:call|phone|dial|ring)\s+(.+?)(?:\s+on whatsapp)?$/i))) {
      const c = findContact(m[2]); if (!c) return miss(m[2]);
      if (m[1] || /on whatsapp$/i.test(t)) { open(waLink(c.num)); return `WhatsApp can't start calls from outside the app. I opened the chat with ${c.name} — tap the call icon.`; }
      open('tel:' + c.raw); return `Opening the dialer for ${c.name} — tap call.`;
    }
    if ((m = t.match(/\b(?:whatsapp|message|msg|text)\s+(?:to\s+)?(.+?)\s+(?:on whatsapp\s+)?(?:saying|say|that says)\s+(.+)/i))) {
      const n = m[1].replace(/^(?:a\s+)?(?:whatsapp\s+)?(?:message|msg|text)?\s*(?:to\s+)?/i, ''), c = findContact(n);
      return c ? sendWA(c, m[2]) : miss(n);
    }
    if ((m = t.match(/^(?:send\s+(?:a\s+)?)?(?:whatsapp\s+)?(?:message|msg|text)\s+(?:to\s+)?(.+?)(?:\s+on whatsapp)?$/i))) {
      const c = findContact(m[1]); if (!c) return miss(m[1]);
      pending = c; return `What should I say to ${c.name}?`;
    }
    if (/^open whatsapp$/i.test(t)) { open('whatsapp://send'); return 'Opening WhatsApp…'; }
    return null;
  }

  /* ---------- hands-free + in-app wake word ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, want = false, awake = 0, tw = null, lock = null;
  function startRec() {
    if (!want || rec || !SR || speechSynthesis.speaking) return;
    rec = new SR(); rec.lang = S().language || 'en-IN'; rec.continuous = true; rec.interimResults = false;
    rec.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) onHeard(e.results[i][0].transcript); };
    rec.onerror = e => { if (/not-allowed|service-not-allowed/.test(e.error)) { setHF(false); A.showToast('Microphone permission denied'); } };
    rec.onend = () => { rec = null; if (want) setTimeout(startRec, 400); };
    try { rec.start(); } catch { rec = null; }
  }
  function stopRec() { const r = rec; rec = null; try { if (r) { r.onend = null; r.abort(); } } catch {} }
  function onHeard(raw) {
    let t = raw.trim(); if (!t) return;
    if (X.wake) {
      const nm = (S().assistantName || 'JARVIS').toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const m = t.match(new RegExp('(?:hey|ok|okay|hi)?\\s*' + nm + '[,.!]?\\s*(.*)$', 'i'));
      if (m) { t = m[1].trim(); if (!t) { awake = Date.now(); A.showToast('Yes? I’m listening…'); return; } }
      else if (Date.now() - awake > 10000) return;
      awake = 0;
    }
    stopRec(); A.sendMessage(t); turnDone();
  }
  function turnDone() {
    if (!want) return; clearInterval(tw);
    tw = setInterval(() => { if (!speechSynthesis.speaking && !A.busy()) { clearInterval(tw); startRec(); } }, 500);
  }
  async function setHF(on) {
    if (on && !SR) return A.showToast('Voice recognition isn’t supported here. Try Chrome.');
    want = JX.handsFree = on; hfBtn.classList.toggle('listening', on);
    A.showToast(on ? (X.wake ? `Hands-free on — say “Hey ${S().assistantName}”` : 'Hands-free on — just talk') : 'Hands-free off');
    if (on) { startRec(); try { lock = await navigator.wakeLock?.request('screen'); } catch {} }
    else { stopRec(); speechSynthesis.cancel(); try { lock?.release(); } catch {} }
  }

  /* ---------- UI: buttons + Tools panel ---------- */
  const mk = (id, txt, title, fn) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'composer-tool'; b.textContent = txt; b.title = title; b.setAttribute('aria-label', title); b.onclick = fn; $('voiceBtn').before(b); return b; };
  mk('camBtn', '📷', 'Camera', () => openCamera());
  const hfBtn = mk('hfBtn', '🎧', 'Hands-free mode', () => setHF(!want));
  const tb = document.createElement('button'); tb.className = 'icon-button'; tb.id = 'toolsBtn'; tb.title = 'Tools'; tb.textContent = '✦';
  document.querySelector('.top-actions').prepend(tb);
  const panel = document.createElement('div'); panel.className = 'overlay'; panel.hidden = true;
  panel.innerHTML = `<section class="settings-panel" role="dialog" aria-modal="true">
    <div class="panel-heading"><div><p class="eyebrow">ASSISTANT</p><h2>Tools</h2></div><button class="icon-button close-button" data-a="close">×</button></div>
    <div class="toggle-row"><div><b>Wake word</b><small>Hands-free reacts only after “Hey” + the assistant name (app must be open)</small></div><label class="switch"><input id="xWake" type="checkbox"><span></span></label></div>
    <label class="field-label">Image model (optional)</label><input id="xImg" class="field" placeholder="gpt-image-1 or gemini-2.5-flash-image">
    <label class="field-label">Contacts — one per line: Name: +countrycode number</label><textarea id="xContacts" class="field" rows="4" placeholder="Mom: +919876543210"></textarea>
    <button class="small-button" data-a="pick" style="margin-top:8px;min-height:36px">Pick from phone contacts</button>
    <label class="field-label">Memory — one fact per line</label><textarea id="xMemory" class="field" rows="4"></textarea>
    <label class="field-label">Daily WhatsApp automations</label><div id="xAutos" class="history-list"></div>
    <p class="hint">Say: “every day at 8 am send good morning to Mom on WhatsApp”.</p>
    <div class="panel-actions"><button class="primary-button" data-a="save">Save</button></div></section>`;
  document.body.append(panel);
  const renderAutos = () => { $('xAutos').innerHTML = X.autos.length ? X.autos.map(a => `<div class="history-row"><div class="history-item" style="flex:1">${esc(a.msg)} → ${esc(a.name)} · ${pad(a.h)}:${pad(a.mi)}</div><button class="history-delete" data-a="del" data-id="${a.id}">×</button></div>`).join('') : '<p class="hint">None yet.</p>'; };
  tb.onclick = () => { $('xWake').checked = X.wake; $('xImg').value = X.imgModel; $('xContacts').value = X.contacts; $('xMemory').value = X.memory.join('\n'); renderAutos(); panel.hidden = false; askNotify(); };
  panel.onclick = async e => {
    const a = e.target.dataset?.a;
    if (e.target === panel || a === 'close') panel.hidden = true;
    if (a === 'del') { X.autos = X.autos.filter(x => x.id !== e.target.dataset.id); save(); renderAutos(); }
    if (a === 'save') { X.wake = $('xWake').checked; X.imgModel = $('xImg').value.trim(); X.contacts = $('xContacts').value; X.memory = $('xMemory').value.split('\n').map(s => s.trim()).filter(Boolean); save(); panel.hidden = true; A.showToast('Tools saved'); }
    if (a === 'pick') {
      if (!navigator.contacts?.select) return A.showToast('Contact picker isn’t supported in this browser');
      try { const r = await navigator.contacts.select(['name', 'tel'], { multiple: true }); const add = r.filter(c => c.name?.[0] && c.tel?.[0]).map(c => `${c.name[0]}: ${c.tel[0].replace(/[^\d+]/g, '')}`); $('xContacts').value = ($('xContacts').value.trim() + '\n' + add.join('\n')).trim(); } catch {}
    }
  };
})();
