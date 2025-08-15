// Tabs
const tabs = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.tab');

tabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-tab');
    sections.forEach((s) => s.classList.remove('active'));
    document.getElementById(target).classList.add('active');
  });
});

// --- Snippets ---
const snippetForm = document.getElementById('snippet-form');
const snippetTitle = document.getElementById('snippet-title');
const snippetLanguage = document.getElementById('snippet-language');
const snippetTags = document.getElementById('snippet-tags');
const snippetCode = document.getElementById('snippet-code');
const snippetsList = document.getElementById('snippets-list');

async function refreshSnippets() {
  const res = await fetch('/api/snippets');
  const items = await res.json();
  snippetsList.innerHTML = '';
  for (const s of items) {
    const el = document.createElement('div');
    el.className = 'snippet-card';
    el.innerHTML = `
      <div class="snippet-header">
        <div class="snippet-title">${escapeHtml(s.title)}</div>
        <div class="snippet-meta">${escapeHtml(s.language)} • ${new Date(s.createdAt).toLocaleString()}</div>
      </div>
      <pre class="snippet-code">${escapeHtml(s.code)}</pre>
      <div class="snippet-tags">${(s.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ')}</div>
    `;
    snippetsList.appendChild(el);
  }
}

snippetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const tags = snippetTags.value.split(',').map(s => s.trim()).filter(Boolean);
  const payload = {
    title: snippetTitle.value,
    language: snippetLanguage.value,
    code: snippetCode.value,
    tags,
  };
  await fetch('/api/snippets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  snippetTitle.value = '';
  snippetLanguage.value = 'python';
  snippetTags.value = '';
  snippetCode.value = '';
  await refreshSnippets();
});

// --- Run Code ---
const runForm = document.getElementById('run-code-form');
const runCodeInput = document.getElementById('run-code-input');
const stdoutEl = document.getElementById('stdout');
const stderrEl = document.getElementById('stderr');
const exitCodeEl = document.getElementById('exit-code');

runForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData();
  form.append('code', runCodeInput.value);
  const res = await fetch('/api/run/code', { method: 'POST', body: form });
  const data = await res.json();
  stdoutEl.textContent = data.stdout || '';
  stderrEl.textContent = data.stderr || '';
  exitCodeEl.textContent = String(data.returncode);
});

// --- CV ---
const cvForm = document.getElementById('cv-form');
const cvFile = document.getElementById('cv-file');
const cvLow = document.getElementById('cv-low');
const cvHigh = document.getElementById('cv-high');
const cvResult = document.getElementById('cv-result');

cvForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData();
  if (!cvFile.files[0]) return;
  form.append('file', cvFile.files[0]);
  form.append('low', cvLow.value || '100');
  form.append('high', cvHigh.value || '200');
  const res = await fetch('/api/run/cv/canny', { method: 'POST', body: form });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  cvResult.src = url;
});

// --- Chat ---
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

function appendChat(text) {
  const div = document.createElement('div');
  div.className = 'chat-line';
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

const wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws';
const chatSocket = new WebSocket(`${wsProtocol}://${location.host}/ws/chat`);
chatSocket.addEventListener('message', (evt) => appendChat(evt.data));

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;
  chatSocket.send(msg);
  chatInput.value = '';
});

// Helpers
function escapeHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Initial data
refreshSnippets();