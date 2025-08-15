// Tabs
const tabs = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.tab');

tabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-tab');
    
    // Remove active class from all tabs and buttons
    tabs.forEach(t => t.classList.remove('active'));
    sections.forEach((s) => s.classList.remove('active'));
    
    // Add active class to clicked button and corresponding section
    btn.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});

// Initialize first tab as active
document.querySelector('.tab-btn').classList.add('active');

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
  
  if (items.length === 0) {
    snippetsList.innerHTML = '<div class="text-center" style="padding: 2rem; color: var(--gray-500);">No snippets yet. Create your first one above! 🚀</div>';
    return;
  }
  
  for (const s of items) {
    const el = document.createElement('div');
    el.className = 'snippet-card';
    el.innerHTML = `
      <div class="snippet-header">
        <div>
          <div class="snippet-title">${escapeHtml(s.title)}</div>
          <div class="snippet-meta">${escapeHtml(s.language)} • ${new Date(s.createdAt).toLocaleString()}</div>
        </div>
      </div>
      <pre class="snippet-code">${escapeHtml(s.code)}</pre>
      ${(s.tags || []).length > 0 ? `<div class="snippet-tags">${s.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
    `;
    snippetsList.appendChild(el);
  }
}

snippetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  submitBtn.textContent = '💾 Saving...';
  submitBtn.disabled = true;
  
  const tags = snippetTags.value.split(',').map(s => s.trim()).filter(Boolean);
  const payload = {
    title: snippetTitle.value,
    language: snippetLanguage.value,
    code: snippetCode.value,
    tags,
  };
  
  try {
    await fetch('/api/snippets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // Clear form
    snippetTitle.value = '';
    snippetLanguage.value = 'python';
    snippetTags.value = '';
    snippetCode.value = '';
    
    await refreshSnippets();
    
    // Show success feedback
    submitBtn.textContent = '✅ Saved!';
    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 2000);
  } catch (error) {
    submitBtn.textContent = '❌ Error';
    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 2000);
  }
});

// --- Run Code ---
const runForm = document.getElementById('run-code-form');
const runCodeInput = document.getElementById('run-code-input');
const stdoutEl = document.getElementById('stdout');
const stderrEl = document.getElementById('stderr');
const exitCodeEl = document.getElementById('exit-code');

runForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  submitBtn.textContent = '⚡ Executing...';
  submitBtn.disabled = true;
  
  // Clear previous results
  stdoutEl.textContent = '';
  stderrEl.textContent = '';
  exitCodeEl.textContent = '';
  
  const form = new FormData();
  form.append('code', runCodeInput.value);
  
  try {
    const res = await fetch('/api/run/code', { method: 'POST', body: form });
    const data = await res.json();
    stdoutEl.textContent = data.stdout || 'No output';
    stderrEl.textContent = data.stderr || 'No errors';
    exitCodeEl.textContent = String(data.returncode);
    
    // Color code the exit code
    if (data.returncode === 0) {
      exitCodeEl.style.color = 'var(--success-500)';
    } else {
      exitCodeEl.style.color = 'var(--error-500)';
    }
  } catch (error) {
    stderrEl.textContent = 'Network error: ' + error.message;
    exitCodeEl.textContent = 'N/A';
    exitCodeEl.style.color = 'var(--error-500)';
  }
  
  submitBtn.textContent = originalText;
  submitBtn.disabled = false;
});

// --- CV ---
const cvMethods = document.querySelectorAll('.cv-method');
const cvForm = document.getElementById('cv-form');
const cvFile = document.getElementById('cv-file');
const cvLow = document.getElementById('cv-low');
const cvHigh = document.getElementById('cv-high');
const cvResult = document.getElementById('cv-result');
const cvSubmitBtn = document.getElementById('cv-submit-btn');

let selectedMethod = 'canny';

// CV Method Selection
cvMethods.forEach(method => {
  method.addEventListener('click', () => {
    cvMethods.forEach(m => m.classList.remove('active'));
    method.classList.add('active');
    selectedMethod = method.getAttribute('data-method');
    
    // Show/hide relevant controls
    document.querySelectorAll('.cv-method-controls').forEach(control => {
      control.classList.add('hidden');
    });
    document.getElementById(`${selectedMethod}-controls`).classList.remove('hidden');
    
    // Update button text
    const methodNames = {
      'canny': '🎯 Detect Edges',
      'hands': '✋ Detect Hands', 
      'faces': '😊 Detect Faces'
    };
    cvSubmitBtn.textContent = methodNames[selectedMethod];
  });
});

cvForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const originalText = cvSubmitBtn.textContent;
  
  cvSubmitBtn.textContent = '🔄 Processing...';
  cvSubmitBtn.disabled = true;
  
  const form = new FormData();
  if (!cvFile.files[0]) return;
  
  form.append('file', cvFile.files[0]);
  
  let endpoint = '/api/run/cv/canny';
  if (selectedMethod === 'canny') {
    form.append('low', cvLow.value || '100');
    form.append('high', cvHigh.value || '200');
    endpoint = '/api/run/cv/canny';
  } else if (selectedMethod === 'hands') {
    endpoint = '/api/run/cv/hands';
  } else if (selectedMethod === 'faces') {
    endpoint = '/api/run/cv/faces';
  }
  
  try {
    const res = await fetch(endpoint, { method: 'POST', body: form });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    cvResult.src = url;
    cvResult.style.display = 'block';
  } catch (error) {
    alert('Error processing image: ' + error.message);
  }
  
  cvSubmitBtn.textContent = originalText;
  cvSubmitBtn.disabled = false;
});

// --- Chat ---
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

function appendChat(text) {
  const div = document.createElement('div');
  div.className = 'chat-line';
  
  // Add timestamp
  const timestamp = new Date().toLocaleTimeString();
  div.innerHTML = `<strong>[${timestamp}]</strong> ${escapeHtml(text)}`;
  
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  
  // Limit chat history to last 100 messages
  const messages = chatBox.querySelectorAll('.chat-line');
  if (messages.length > 100) {
    messages[0].remove();
  }
}

const wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws';
const chatSocket = new WebSocket(`${wsProtocol}://${location.host}/ws/chat`);

chatSocket.addEventListener('open', () => {
  appendChat('🟢 Connected to chat');
});

chatSocket.addEventListener('message', (evt) => {
  if (evt.data.trim()) {
    appendChat(evt.data);
  }
});

chatSocket.addEventListener('close', () => {
  appendChat('🔴 Disconnected from chat');
});

chatSocket.addEventListener('error', () => {
  appendChat('❌ Chat connection error');
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;
  
  if (chatSocket.readyState === WebSocket.OPEN) {
    chatSocket.send(msg);
  } else {
    appendChat('❌ Cannot send message - not connected');
  }
  
  chatInput.value = '';
});

// Helpers
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initial data