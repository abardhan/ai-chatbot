
// Chat window open/close toggle
let isChatOpen = false;

function toggleChat() {
  isChatOpen = !isChatOpen;
  const chatWindow = document.getElementById('chatWindow');
  const toggleBtn  = document.getElementById('chatToggleBtn');

  if (isChatOpen) {
    chatWindow.classList.add('open');
    toggleBtn.textContent = '✕';      // Button icon বদলাও
    toggleBtn.style.background = '#e05';
    document.getElementById('input').focus();
  } else {
    chatWindow.classList.remove('open');
    toggleBtn.textContent = '🤖';
    toggleBtn.style.background = '#534AB7';
  }
}



// =============================
// 1. সব elements নাও
// =============================
const messagesEl = document.getElementById('messages');
const inputEl    = document.getElementById('input');
const sendBtn    = document.getElementById('sendBtn');

// =============================
// 2. localStorage থেকে history লোড করো
//    (আগের chat থাকলে দেখাবে)
// =============================
let conversationHistory = loadHistory();

// Page load হলে পুরনো messages দেখাও
conversationHistory.forEach(msg => {
  if (msg.role !== 'system') {
    addMessage(msg.content, msg.role === 'user' ? 'user' : 'ai');
  }
});

// =============================
// 3. Message পাঠানো
// =============================
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  inputEl.value = '';
  inputEl.style.height = 'auto';
  sendBtn.disabled = true;

  // History-তে যোগ করো
  conversationHistory.push({
    role: "user",
    content: text
  });

  showTyping();

  try {

const API_URL = window.location.hostname === 'localhost'
  ? 'http://127.0.0.1:5000/chat'   // local development
  : '/api/chat';                     // Vercel production


    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory })
    });

    const data = await response.json();
    const reply = data.reply;

    removeTyping();
    addMessage(reply, 'ai');
    speakText(reply);

    // AI reply-ও history-তে রাখো
    conversationHistory.push({
      role: "assistant",
      content: reply
    });

    // localStorage-এ সেভ করো
    saveHistory(conversationHistory);

  } catch (error) {
    removeTyping();
    addMessage('❌ Server-এর সাথে connect হচ্ছে না। Python চালু আছে?', 'ai');
  }

  sendBtn.disabled = false;
  inputEl.focus();
}

// =============================
// 4. localStorage functions
// =============================
function saveHistory(history) {
  localStorage.setItem('chatHistory', JSON.stringify(history));
}

function loadHistory() {
  const saved = localStorage.getItem('chatHistory');
  return saved ? JSON.parse(saved) : [];
}

function clearHistory() {
  conversationHistory = [];
  localStorage.removeItem('chatHistory');
  messagesEl.innerHTML = `
    <div class="empty" id="empty">
      <div class="empty-icon"></div>
      <div class="empty-text">💬 Ask or Write something here !</div>
    </div>`;
}

// =============================
// 5. UI helper functions
// =============================
function addMessage(text, role) {
  document.getElementById('empty')?.remove();

  const row = document.createElement('div');
  row.className = 'bubble-row ' + (role === 'user' ? 'user' : '');

  const av = document.createElement('div');
  av.className = 'bubble-avatar';
  av.textContent = role === 'user' ? '👤' : '🤖';

  const wrap = document.createElement('div');

  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + role;
  // AI message হলে markdown render করো
if (role === 'ai') {
  bubble.innerHTML = marked.parse(text);
} else {
  bubble.textContent = text;
}

  const time = document.createElement('div');
  time.className = 'time' + (role === 'ai' ? ' ai-time' : '');
  time.textContent = getTime();

  wrap.appendChild(bubble);
  // AI message হলে speaker button যোগ করো
if (role === 'ai') {
  const speakBtn = document.createElement('button');
  speakBtn.textContent = '🔊';
  speakBtn.title = 'শোনো';
  speakBtn.style.cssText = `
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 13px;
    padding: 2px 4px;
    margin-top: 2px;
    opacity: 0.6;
  `;
  speakBtn.onclick = () => speakText(bubble.textContent);
  wrap.appendChild(bubble);
  wrap.appendChild(speakBtn);
  wrap.appendChild(time);
} else {
  wrap.appendChild(bubble);
  wrap.appendChild(time);
}

// Copy button
const copyBtn = document.createElement('button');
copyBtn.textContent = '📋';
copyBtn.title = 'Copy';
copyBtn.style.cssText = `
  background: transparent; border: none;
  cursor: pointer; font-size: 13px;
  padding: 2px 4px; opacity: 0.6;
`;
copyBtn.onclick = () => {
  navigator.clipboard.writeText(bubble.textContent);
  copyBtn.textContent = '✅';
  setTimeout(() => copyBtn.textContent = '📋', 1500);
};
wrap.appendChild(copyBtn);
  wrap.appendChild(time);
  row.appendChild(av);
  row.appendChild(wrap);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'bubble-row';
  row.id = 'typing-row';
  const av = document.createElement('div');
  av.className = 'bubble-avatar';
  av.textContent = '🤖';
  const typing = document.createElement('div');
  typing.className = 'typing';
  typing.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  row.appendChild(av);
  row.appendChild(typing);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  document.getElementById('typing-row')?.remove();
}

function getTime() {
  const d = new Date();
  return d.getHours().toString().padStart(2,'0') + ':' +
         d.getMinutes().toString().padStart(2,'0');
}

// Enter চাপলে send
inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Textarea auto-resize
inputEl.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 100) + 'px';
});






// =============================
// PHASE 4 — Voice Input/Output
// =============================

const micBtn = document.getElementById('micBtn');
let isListening = false;
let recognition = null;

// ---- Voice INPUT (Mic → Text) ----
function toggleVoice() {
  // Browser support check
  if (!('webkitSpeechRecognition' in window) && 
      !('SpeechRecognition' in window)) {
    alert('তোমার browser voice support করে না। Chrome use করো।');
    return;
  }

  if (isListening) {
    // চলছে → বন্ধ করো
    recognition.stop();
    return;
  }

  // নতুন recognition শুরু করো
  const SpeechRecognition = window.SpeechRecognition || 
                             window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  recognition.lang = 'bn-BD';     // বাংলা — ইংরেজির জন্য 'en-US'
  recognition.continuous = false;  // একবার বলে থামবে
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    micBtn.textContent = '🔴';     // Recording চলছে
    micBtn.style.background = '#ffe0e0';
    inputEl.placeholder = 'বলো...';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputEl.value = transcript;    // Text box-এ বসাও
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.textContent = '🎤';
    micBtn.style.background = '#f0f0f0';
    inputEl.placeholder = 'এখানে লেখো অথবা mic চাপো...';

    // কিছু বললে auto send করো
    if (inputEl.value.trim()) {
      setTimeout(() => sendMessage(), 300);
    }
  };

  recognition.onerror = (event) => {
    isListening = false;
    micBtn.textContent = '🎤';
    micBtn.style.background = '#f0f0f0';
    if (event.error === 'not-allowed') {
      alert('Microphone permission দাও! Browser-এর address bar-এ 🔒 icon-এ click করো।');
    }
  };

  recognition.start();
}

// ---- Voice OUTPUT (Text → AI কথা বলবে) ----
let isSpeaking = false;

function speakText(text) {
  window.speechSynthesis.cancel();

  if (isSpeaking) {
    isSpeaking = false;
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Voices load হওয়ার জন্য অপেক্ষা করো
  function doSpeak() {
    const voices = window.speechSynthesis.getVoices();

    // বাংলা voice খোঁজো
    const bengaliVoice = voices.find(v =>
      v.lang.includes('bn') || v.name.toLowerCase().includes('bengali')
    );

    if (bengaliVoice) {
      utterance.voice = bengaliVoice;
      utterance.lang = 'bn-BD';
    } else {
      // বাংলা না থাকলে English-এ বলবে
      utterance.lang = 'en-US';
    }

    utterance.onstart = () => { isSpeaking = true; };
    utterance.onend   = () => { isSpeaking = false; };
    utterance.onerror = (e) => {
      isSpeaking = false;
      console.log('Speech error:', e);
    };

    window.speechSynthesis.speak(utterance);
  }

  // Voices already loaded কিনা check করো
  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    // না থাকলে load হওয়ার পর call করো
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      doSpeak();
    };
  }
}



// Dark mode toggle
function toggleDark() {
  document.body.classList.toggle('dark');
  const btn = document.getElementById('darkBtn');
  const isDark = document.body.classList.contains('dark');
  btn.textContent = isDark ? '☀️' : '🌙';
  // Preference সেভ করো
  localStorage.setItem('darkMode', isDark);
}

// Page load-এ dark mode check করো
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  document.getElementById('darkBtn').textContent = '☀️';
}