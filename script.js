(() => {
  'use strict';
  window.JARVIS_ICONS = {'logo': '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="8 5.3"/></svg>', 'mic': '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z"/><path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5"/></svg>', 'send': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" stroke-width="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>', 'sendStop': '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>', 'stop': '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/></svg>', 'cam': '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" opacity=".2" d="M7.66 4.87a2.5 2.5 0 0 1-2.05 1.07h-.44c-.31 0-.47 0-.6.02a3 3 0 0 0-2.73 2.72v5.55c0 2.83 0 4.24.87 5.12c.88.88 2.3.88 5.12.88h8.34c2.83 0 4.24 0 5.12-.88s.88-2.3.88-5.12V9.45c0-.47 0-.7-.03-.9a3 3 0 0 0-2.57-2.58c-.2-.03-.44-.03-.9-.03h-.31A3 3 0 0 1 16.24 5l-.1-.12l-.11-.12a3 3 0 0 0-2.12-.95H9.7c-.8 0-1.57.4-2.04 1.07m4.34 12a3.97 3.97 0 1 1 0-7.93a3.97 3.97 0 0 1 0 7.94"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M1.83 9.2v-.12a3 3 0 0 1 2.95-2.95h.29c.97 0 1.88-.52 2.37-1.36s1.4-1.35 2.38-1.35h4.33c.98 0 1.9.51 2.4 1.35a2.8 2.8 0 0 0 2.4 1.36h.27a3 3 0 0 1 2.95 3.07v5.03c0 2.83 0 4.24-.88 5.12s-2.3.88-5.12.88H7.83c-2.83 0-4.24 0-5.12-.88s-.88-2.3-.88-5.12z"/><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.15 9.53a.44.44 0 1 1-.9 0a.44.44 0 0 1 .9 0"/><circle cx="12" cy="12.91" r="3.97" transform="rotate(90 12 12.9)" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg>', 'hf': '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><path d="M4 15h3v5H5a1 1 0 0 1-1-1zM20 15h-3v5h2a1 1 0 0 0 1-1z"/></svg>'};
  const $ = (id) => document.getElementById(id);
  const els = {
    chatArea: $('chatArea'), welcome: $('welcomePanel'), messages: $('messages'), form: $('chatForm'), input: $('messageInput'), send: $('sendBtn'),
    settingsOverlay: $('settingsOverlay'), historyOverlay: $('historyOverlay'), provider: $('providerSelect'), apiKey: $('apiKeyInput'), model: $('modelInput'),
    assistantName: $('assistantName'), language: $('languageSelect'), speak: $('speakToggle'), saveHistory: $('historyToggle'), modeLabel: $('modeLabel'),
    statusText: $('statusText'), hint: $('providerHint'), toast: $('toast'), fileInput: $('fileInput'), attachmentPreview: $('attachmentPreview'), historyList: $('historyList'), search: $('historySearch'), sysPrompt: $('systemPromptInput')
  };
  const KEYS = { settings: 'jarvisAcodeSettingsV1', chats: 'jarvisAcodeChatsV1', current: 'jarvisAcodeCurrentChatV1' };
  let settings = { provider: 'demo', apiKey: '', model: '', assistantName: 'JARVIS', language: 'en-IN', speak: false, saveHistory: true, systemPrompt: '', theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' };
  let abortCtl = null;
  let chats = [];
  let currentChatId = null;
  let pendingFile = null;
  let recognition = null;
  let isListening = false;
  let busy = false;
  let toastTimer;

  function id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function safeParse(value, fallback) { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } }
  function load() {
    const savedSettings = safeParse(localStorage.getItem(KEYS.settings), {});
    settings = { ...settings, ...savedSettings };
    chats = safeParse(localStorage.getItem(KEYS.chats), []);
    currentChatId = localStorage.getItem(KEYS.current);
    if (!Array.isArray(chats)) chats = [];
    if (!chats.some(c => c.id === currentChatId)) currentChatId = null;
    if (settings.saveHistory && currentChatId) renderChat();
    syncSettingsUI(); updateMode(); applyTheme();
  }
  function persist() {
    try {
      if (settings.saveHistory) {
        localStorage.setItem(KEYS.chats, JSON.stringify(chats));
        if (currentChatId) localStorage.setItem(KEYS.current, currentChatId); else localStorage.removeItem(KEYS.current);
      } else {
        localStorage.removeItem(KEYS.chats); localStorage.removeItem(KEYS.current);
      }
    } catch (e) { showToast('Storage is full. Some history may not be saved.'); }
  }
  function currentChat() { return chats.find(c => c.id === currentChatId) || null; }
  function ensureChat() {
    let chat = currentChat();
    if (!chat) {
      chat = { id: id(), title: 'New conversation', updatedAt: Date.now(), messages: [] };
      chats.unshift(chat); currentChatId = chat.id;
    }
    return chat;
  }
  function syncSettingsUI() {
    els.provider.value = settings.provider;
    els.apiKey.value = settings.apiKey || '';
    els.model.value = settings.model || '';
    els.assistantName.value = settings.assistantName || 'JARVIS';
    els.language.value = settings.language || 'en-IN';
    els.speak.checked = !!settings.speak; els.sysPrompt.value = settings.systemPrompt || '';
    els.saveHistory.checked = settings.saveHistory !== false;
    updateProviderHint();
  }
  function updateMode() {
    const online = settings.provider !== 'demo' && settings.apiKey;
    els.modeLabel.textContent = online ? `${settings.provider === 'openai' ? 'OpenAI' : 'Gemini'} · ${settings.model || 'default model'}` : 'Demo mode · Configure an API in Settings';
    els.statusText.textContent = online ? 'AI assistant · Connected settings' : 'AI assistant · Demo mode';
  }
  function updateProviderHint() {
    const p = els.provider.value;
    if (p === 'openai') { els.hint.textContent = 'OpenAI uses the chat completions API. Enter a model available to your API account.'; if (!els.model.value) els.model.placeholder = 'e.g. gpt-4.1-mini'; }
    else if (p === 'gemini') { els.hint.textContent = 'Gemini uses the generateContent API. Enter a model available to your API account.'; if (!els.model.value) els.model.placeholder = 'e.g. gemini-2.5-flash'; }
    else { els.hint.textContent = 'Demo mode replies locally. Add a provider and API key to use online AI.'; }
  }
  function showToast(message) {
    els.toast.textContent = message; els.toast.classList.add('show'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
  }
  function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function inline(t) {
    return escapeHTML(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/\bhttps?:\/\/[^\s<]+/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  }
  function formatText(text) {
    // Safe markdown subset: code blocks, lists, headings, bold/italic, inline code, links. HTML is always escaped first.
    return String(text).split('```').map((part, i) => {
      if (i % 2) {
        const nl = part.indexOf('\n'); const lang = nl > -1 ? part.slice(0, nl).trim() : ''; const code = nl > -1 ? part.slice(nl + 1) : part;
        return `<pre><span class="code-lang">${escapeHTML(lang || 'code')}</span><button type="button" class="copy-code">Copy</button><code>${escapeHTML(code.replace(/\n$/, ''))}</code></pre>`;
      }
      const out = []; let list = null; const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
      part.split('\n').forEach(line => {
        let m; if (!line.trim()) return;
        if ((m = line.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); }
        else if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(m[1])}</li>`); }
        else { close(); out.push((m = line.match(/^#{1,3}\s+(.*)/)) ? `<h4>${inline(m[1])}</h4>` : `<p>${inline(line)}</p>`); }
      });
      close(); return out.join('');
    }).join('');
  }
  function renderChat() {
    const chat = currentChat();
    els.messages.innerHTML = '';
    if (!chat || !chat.messages.length) { els.welcome.hidden = false; return; }
    els.welcome.hidden = true;
    chat.messages.forEach((m, index) => addMessageElement(m.role, m.content, index, m.fileName));
    scrollBottom();
  }
  function addMessageElement(role, content, index, fileName) {
    const isUser = role === 'user';
    const article = document.createElement('article'); article.className = `message ${isUser ? 'user' : 'assistant'}`;
    const avatar = document.createElement('div'); avatar.className = 'avatar'; if (isUser) avatar.textContent = 'YOU'; else avatar.innerHTML = window.JARVIS_ICONS.logo;
    const body = document.createElement('div'); body.className = 'message-body';
    const name = document.createElement('div'); name.className = 'message-name'; name.textContent = isUser ? 'You' : (settings.assistantName || 'JARVIS');
    const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.innerHTML = formatText(content || '');
    body.append(name, bubble);
    if (fileName) { const chip = document.createElement('span'); chip.className = 'image-chip'; chip.textContent = '📎 ' + fileName; body.append(chip); }
    if (!isUser) {
      const tools = document.createElement('div'); tools.className = 'message-tools';
      const copy = document.createElement('button'); copy.textContent = 'Copy'; copy.type = 'button'; copy.onclick = async () => { try { await navigator.clipboard.writeText(content); showToast('Copied to clipboard'); } catch { showToast('Copy is not available in this preview'); } };
      const speak = document.createElement('button'); speak.textContent = 'Read aloud'; speak.type = 'button'; speak.onclick = () => speakText(content);
      tools.append(copy, speak);
      const chat = currentChat();
      if (index !== undefined && chat && index === chat.messages.length - 1) { const regen = document.createElement('button'); regen.textContent = 'Regenerate'; regen.type = 'button'; regen.className = 'regen'; regen.onclick = regenerate; tools.append(regen); }
      body.append(tools);
    }
    article.append(avatar, body); els.messages.append(article); return article;
  }
  function scrollBottom() { requestAnimationFrame(() => { els.chatArea.scrollTop = els.chatArea.scrollHeight; }); }
  function appendMessage(role, content, fileName) {
    const chat = ensureChat();
    chat.messages.push({ role, content, fileName: fileName || '', at: Date.now() });
    if (chat.messages.length === 1 && role === 'user') chat.title = content.slice(0, 44) || 'New conversation';
    chat.updatedAt = Date.now();
    els.welcome.hidden = true; els.messages.querySelectorAll('.regen').forEach(b => b.remove());
    addMessageElement(role, content, chat.messages.length - 1, fileName);
    persist(); scrollBottom();
  }
  function addTyping() {
    const article = document.createElement('article'); article.className = 'message assistant'; article.id = 'typingMessage';
    article.innerHTML = '<div class="avatar">' + window.JARVIS_ICONS.logo + '</div><div class="message-body"><div class="message-name">' + escapeHTML(settings.assistantName || 'JARVIS') + '</div><div class="typing"><span></span><span></span><span></span></div></div>';
    els.messages.append(article); scrollBottom();
  }
  function removeTyping() { const el = $('typingMessage'); if (el) el.remove(); }
  function demoReply(text) {
    const t = text.toLowerCase();
    if (/\b(hi|hello|hey)\b/.test(t)) return `Hello! I'm ${settings.assistantName || 'JARVIS'}, your AI assistant. What would you like to do?`;
    if (t.includes('time') || t.includes('date')) return `Your device time is ${new Date().toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}.`;
    if (t.includes('help') || t.includes('what can you do')) return 'In this Acode demo, you can test the chat interface, save settings, keep local conversation history, use browser voice input where supported, and configure an OpenAI or Gemini API. Phone controls and background wake-word detection need the native Android app.';
    if (t.includes('open youtube')) return 'Browser demo: I can’t launch another Android app from this page. In the native APK, this command should be connected to an Android intent.';
    if (t.includes('flashlight') || t.includes('battery') || t.includes('call ')) return 'This browser preview cannot directly control phone hardware or place calls. Those features must be implemented and permission-checked in the Kotlin Android layer.';
    if (t.includes('study plan')) return 'Here is a simple starter plan:\n\n1. 25 minutes — revise the hardest topic.\n2. 5 minutes — take a break.\n3. 25 minutes — solve practice questions.\n4. 10 minutes — check mistakes and write a short summary.\n\nTell me your subjects and available time to personalize it.';
    if (t.includes('javascript') || t.includes('project idea')) return 'Three beginner JavaScript projects:\n\n1. To-do list with local storage.\n2. Quiz app with a score counter.\n3. Weather dashboard using a public weather API.\n\nBuild one feature at a time and test it before adding more.';
    return `I'm running in local demo mode, so I haven't sent your message to an online AI model. Open Settings to configure an API, or ask “What can you do?” to see what this preview supports.\n\nYour message: “${text.slice(0, 180)}”`;
  }
  function readFile(file, asText) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Could not read the file.')); asText ? r.readAsText(file) : r.readAsDataURL(file); });
  }
  async function prepareAttachment(f) {
    if (!f) return null;
    if (f.size > 5 * 1024 * 1024) throw new Error('Attachment is larger than 5 MB.');
    if (f.type.startsWith('image/')) { const url = await readFile(f); return { type: 'image', mime: f.type, url, data: url.split(',')[1], name: f.name }; }
    if (f.type === 'text/plain' || /\.txt$/i.test(f.name)) return { type: 'text', text: (await readFile(f, true)).slice(0, 30000), name: f.name };
    if (f.type === 'application/pdf' && settings.provider === 'gemini') { const url = await readFile(f); return { type: 'pdf', mime: f.type, data: url.split(',')[1], name: f.name }; }
    throw new Error('That file type isn\u2019t supported by the selected provider. Images and .txt work with both; PDFs work with Gemini.');
  }
  async function onlineReply(att, signal) {
    const sys = `You are ${settings.assistantName || 'JARVIS'}, a helpful, friendly assistant. Be clear and honest about limitations.` + (settings.systemPrompt ? `\n\n${settings.systemPrompt}` : '') + (window.JX ? window.JX.memoryPrompt() : '');
    const msgs = (currentChat()?.messages || []).slice(-14); const lastIdx = msgs.length - 1;
    if (settings.provider === 'openai') {
      const model = settings.model.trim() || 'gpt-4.1-mini';
      const history = msgs.map((m, i) => {
        const role = m.role === 'assistant' ? 'assistant' : 'user';
        if (att && i === lastIdx) return att.type === 'image' ? { role, content: [{ type: 'text', text: m.content }, { type: 'image_url', image_url: { url: att.url } }] } : { role, content: `${m.content}\n\n[File: ${att.name}]\n${att.text}` };
        return { role, content: m.content };
      });
      const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` }, body: JSON.stringify({ model, messages: [{ role: 'system', content: sys }, ...history] }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || `OpenAI request failed (${response.status})`);
      return data?.choices?.[0]?.message?.content || 'The model returned an empty response.';
    }
    const model = settings.model.trim() || 'gemini-2.5-flash';
    const history = msgs.map((m, i) => {
      const parts = [{ text: m.content }];
      if (att && i === lastIdx) { if (att.type === 'text') parts[0].text += `\n\n[File: ${att.name}]\n${att.text}`; else parts.push({ inline_data: { mime_type: att.mime, data: att.data } }); }
      return { role: m.role === 'assistant' ? 'model' : 'user', parts };
    });
    while (history.length && history[0].role !== 'user') history.shift(); // Gemini history must start with a user turn
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(settings.apiKey)}`, { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: history }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `Gemini request failed (${response.status})`);
    return (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('') || 'The model returned an empty response.';
  }
  function setBusy(on) { busy = on; els.send.innerHTML = on ? window.JARVIS_ICONS.sendStop : window.JARVIS_ICONS.send; els.send.setAttribute('aria-label', on ? 'Stop generating' : 'Send message'); }
  function showError(msg) {
    const a = addMessageElement('assistant', msg); a.classList.add('error');
    const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Retry'; b.onclick = regenerate; a.querySelector('.message-tools').append(b); scrollBottom();
  }
  async function sendMessage(text) {
    text = String(text || '').trim();
    if ((!text && !pendingFile) || busy) return;
    const attachment = pendingFile; pendingFile = null; els.fileInput.value = ''; els.attachmentPreview.hidden = true; els.attachmentPreview.innerHTML = '';
    const fileName = attachment?.name || '';
    appendMessage('user', text || `Please review this attachment: ${fileName}`, fileName);
    els.input.value = ''; resizeInput();
    const local = !attachment && window.JX ? await window.JX.handle(text) : null;
    if (local) { if (local !== true) { appendMessage('assistant', local); if (settings.speak || window.JX.handsFree) speakText(local); } window.JX.turnDone(); return; }
    respond(attachment);
  }
  async function respond(file) {
    const chat = currentChat(); const last = chat && chat.messages[chat.messages.length - 1];
    if (!last || busy) return;
    setBusy(true); addTyping(); abortCtl = new AbortController();
    try {
      const online = settings.provider !== 'demo' && settings.apiKey;
      const reply = online ? await onlineReply(await prepareAttachment(file), abortCtl.signal) : demoReply(last.content);
      removeTyping(); appendMessage('assistant', reply);
      if (settings.speak || window.JX?.handsFree) speakText(reply);
    } catch (error) {
      removeTyping();
      if (error.name === 'AbortError') showError('Response stopped.');
      else { showError(`I couldn't get a response. ${error.message || 'Check your API key, model name and connection.'}`); showToast('AI request failed'); }
    } finally { setBusy(false); if (!window.JX?.handsFree) els.input.focus(); window.JX?.turnDone(); }
  }
  function regenerate() {
    const chat = currentChat(); if (!chat || busy) return;
    if (chat.messages.length && chat.messages[chat.messages.length - 1].role === 'assistant') { chat.messages.pop(); persist(); }
    renderChat(); respond(null);
  }
  function applyTheme() {
    document.documentElement.dataset.theme = settings.theme;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = settings.theme === 'dark' ? '#12141f' : '#f7f8ff';
    $('themeBtn').textContent = settings.theme === 'dark' ? '☀' : '◐';
  }
  function toggleTheme() {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEYS.settings, JSON.stringify(settings)); } catch {}
    applyTheme();
  }
  function exportChat() {
    const chat = currentChat(); if (!chat || !chat.messages.length) { showToast('Nothing to export yet'); return; }
    const name = settings.assistantName || 'JARVIS';
    const text = `# ${chat.title}\n\n` + chat.messages.map(m => `**${m.role === 'user' ? 'You' : name}:**\n${m.content}`).join('\n\n---\n\n');
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' })); const a = document.createElement('a');
      a.href = url; a.download = (chat.title || 'chat').replace(/[^\w-]+/g, '_').slice(0, 40) + '.md'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      navigator.clipboard?.writeText(text).catch(() => {}); showToast('Chat exported (also copied)');
    } catch { showToast('Export is not available here'); }
  }
  function resizeInput() { els.input.style.height = 'auto'; els.input.style.height = Math.min(els.input.scrollHeight, 130) + 'px'; }
  function openSettings() { syncSettingsUI(); els.settingsOverlay.hidden = false; }
  function closeSettings() { els.settingsOverlay.hidden = true; }
  function saveSettings() {
    settings = { ...settings, provider: els.provider.value, apiKey: els.apiKey.value.trim(), model: els.model.value.trim(), assistantName: els.assistantName.value.trim() || 'JARVIS', language: els.language.value, speak: els.speak.checked, saveHistory: els.saveHistory.checked, systemPrompt: els.sysPrompt.value.trim() };
    try { localStorage.setItem(KEYS.settings, JSON.stringify(settings)); } catch { showToast('Could not save settings on this device'); }
    if (!settings.saveHistory) { chats = []; currentChatId = null; els.messages.innerHTML = ''; els.welcome.hidden = false; }
    persist(); updateMode(); closeSettings(); showToast('Settings saved');
    // Refresh labels after assistant name changes.
    renderChat();
  }
  function startNewChat() {
    currentChatId = null; els.messages.innerHTML = ''; els.welcome.hidden = false; persist();
    els.historyOverlay.hidden = true; els.input.focus(); showToast('New chat ready');
  }
  function openHistory() { els.search.value = ''; renderHistory(); els.historyOverlay.hidden = false; }
  function renderHistory() {
    const q = els.search.value.trim().toLowerCase(); els.historyList.innerHTML = '';
    const saved = settings.saveHistory ? chats.slice().sort((a, b) => b.updatedAt - a.updatedAt).filter(c => !q || (c.title || '').toLowerCase().includes(q) || c.messages.some(m => m.content.toLowerCase().includes(q))) : [];
    if (!saved.length) { const p = document.createElement('p'); p.className = 'hint'; p.textContent = q ? 'No matching conversations.' : 'No saved conversations yet.'; els.historyList.append(p); }
    saved.forEach(chat => {
      const row = document.createElement('div'); row.className = 'history-row';
      const btn = document.createElement('button'); btn.className = 'history-item'; btn.type = 'button';
      const title = document.createElement('span'); title.textContent = chat.title || 'Conversation';
      const small = document.createElement('small'); small.textContent = `${chat.messages.length} messages · ${new Date(chat.updatedAt).toLocaleString()}`;
      btn.append(title, small); btn.onclick = () => { currentChatId = chat.id; localStorage.setItem(KEYS.current, currentChatId); renderChat(); els.historyOverlay.hidden = true; };
      const del = document.createElement('button'); del.className = 'history-delete'; del.type = 'button'; del.textContent = '×'; del.setAttribute('aria-label', 'Delete chat');
      del.onclick = () => { if (!confirm('Delete this conversation?')) return; chats = chats.filter(c => c.id !== chat.id); if (currentChatId === chat.id) { currentChatId = null; renderChat(); } persist(); renderHistory(); };
      row.append(btn, del); els.historyList.append(row);
    });
  }
  function clearHistory() {
    if (!confirm('Clear all saved conversations on this device?')) return;
    chats = []; currentChatId = null; persist(); els.messages.innerHTML = ''; els.welcome.hidden = false; closeSettings();
    showToast('Conversation history cleared');
  }
  function speakText(text) {
    if (!('speechSynthesis' in window)) { showToast('Speech output is not supported in this browser'); return; }
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text.replace(/[*`#]/g, ''));
    utterance.lang = settings.language || 'en-IN'; utterance.rate = 0.96; window.JX?.pause(); utterance.onend = utterance.onerror = () => window.JX?.turnDone(); window.speechSynthesis.speak(utterance);
  }
  function toggleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (isListening && recognition) { recognition.stop(); return; }
    if (!SpeechRecognition) { showToast('Voice input is not supported in this browser. Try Chrome.'); return; }
    recognition = new SpeechRecognition(); recognition.lang = settings.language || 'en-IN'; recognition.interimResults = true; recognition.continuous = false;
    let finalText = '';
    recognition.onstart = () => { isListening = true; $('voiceBtn').classList.add('listening'); $('voiceBtn').innerHTML = window.JARVIS_ICONS.stop; showToast('Listening… speak now'); };
    recognition.onresult = (event) => { let interim = ''; for (let i = event.resultIndex; i < event.results.length; i++) { const transcript = event.results[i][0].transcript; if (event.results[i].isFinal) finalText += transcript; else interim += transcript; } els.input.value = (finalText + ' ' + interim).trim(); resizeInput(); };
    recognition.onerror = (event) => showToast(event.error === 'not-allowed' ? 'Microphone permission was denied' : `Voice input: ${event.error}`);
    recognition.onend = () => { isListening = false; $('voiceBtn').classList.remove('listening'); $('voiceBtn').innerHTML = window.JARVIS_ICONS.mic; if (finalText.trim()) { els.input.value = finalText.trim(); sendMessage(finalText.trim()); } };
    try { recognition.start(); } catch { showToast('Voice recognition could not start'); }
  }
  function selectFile(file) {
    if (!file) return;
    pendingFile = file; els.attachmentPreview.hidden = false;
    els.attachmentPreview.innerHTML = `<span>📎 ${escapeHTML(file.name)} · ${(file.size / 1024).toFixed(0)} KB</span><button type="button" id="removeAttachment">Remove</button>`;
    $('removeAttachment').onclick = () => { pendingFile = null; els.fileInput.value = ''; els.attachmentPreview.hidden = true; };
  }

  els.form.addEventListener('submit', e => { e.preventDefault(); if (busy) { abortCtl && abortCtl.abort(); window.speechSynthesis && speechSynthesis.cancel(); return; } sendMessage(els.input.value); });
  els.input.addEventListener('input', resizeInput);
  els.input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(els.input.value); } });
  document.querySelectorAll('.suggestion').forEach(btn => btn.addEventListener('click', () => sendMessage(btn.dataset.prompt)));
  $('settingsBtn').addEventListener('click', openSettings); $('closeSettings').addEventListener('click', closeSettings); $('saveSettingsBtn').addEventListener('click', saveSettings);
  $('providerSelect').addEventListener('change', updateProviderHint);
  $('showKeyBtn').addEventListener('click', () => { const visible = els.apiKey.type === 'text'; els.apiKey.type = visible ? 'password' : 'text'; $('showKeyBtn').textContent = visible ? 'Show' : 'Hide'; });
  $('historyBtn').addEventListener('click', openHistory); $('closeHistory').addEventListener('click', () => { els.historyOverlay.hidden = true; });
  $('newChatBtn').addEventListener('click', startNewChat); $('clearHistoryBtn').addEventListener('click', clearHistory);
  $('attachBtn').addEventListener('click', () => els.fileInput.click()); els.fileInput.addEventListener('change', () => selectFile(els.fileInput.files[0]));
  $('voiceBtn').addEventListener('click', toggleVoice);
  [els.settingsOverlay, els.historyOverlay].forEach(overlay => overlay.addEventListener('click', e => { if (e.target === overlay) overlay.hidden = true; }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSettings(); els.historyOverlay.hidden = true; } });
  $('themeBtn').addEventListener('click', toggleTheme); $('exportBtn').addEventListener('click', exportChat); els.search.addEventListener('input', renderHistory);
  els.messages.addEventListener('click', async e => {
    const b = e.target.closest('.copy-code'); if (!b) return;
    try { await navigator.clipboard.writeText(b.parentElement.querySelector('code').textContent); b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1500); } catch { showToast('Copy is not available in this preview'); }
  });
  window.JARVIS_API = { get settings() { return settings; }, sendMessage, appendMessage, speakText, showToast, selectFile, escapeHTML, busy: () => busy };
  load();
})();
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
  const mk = (id, txt, title, fn) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'composer-tool'; b.innerHTML = txt; b.title = title; b.setAttribute('aria-label', title); b.onclick = fn; $('voiceBtn').before(b); return b; };
  mk('camBtn', window.JARVIS_ICONS.cam, 'Camera', () => openCamera());
  const hfBtn = mk('hfBtn', window.JARVIS_ICONS.hf, 'Hands-free mode', () => setHF(!want));
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
