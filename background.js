import { cleanText, applyAdvancedTransform, DEFAULT_SETTINGS, recordStats } from './cleaner.js';

function buildContextMenu() {
  chrome.contextMenus.removeAll(async () => {
    const settings = await getSettings();

    chrome.contextMenus.create({ id: "cleanpaste-root", title: "✨ CleanPaste AI", contexts: ["selection", "editable"] });
    chrome.contextMenus.create({ parentId: "cleanpaste-root", id: "copy-auto", title: "🪄 Copy Clean (Auto-Detect)", contexts: ["selection"] });
    
    // Developer Options
    if (settings.enableDevExtract) {
      chrome.contextMenus.create({ parentId: "cleanpaste-root", id: "copy-code-only", title: "🧑‍💻 Extract Code Blocks Only", contexts: ["selection"] });
    }
    
    // Formatting Options
    if (settings.enableFormatters) {
      chrome.contextMenus.create({ parentId: "cleanpaste-root", id: "copy-bullet-to-comma", title: "📝 Turn into Comma List", contexts: ["selection"] });
      chrome.contextMenus.create({ parentId: "cleanpaste-root", id: "format-case", title: "🔠 Format Text Case...", contexts: ["selection"] });
      chrome.contextMenus.create({ parentId: "format-case", id: "copy-upper", title: "UPPERCASE", contexts: ["selection"] });
      chrome.contextMenus.create({ parentId: "format-case", id: "copy-lower", title: "lowercase", contexts: ["selection"] });
      chrome.contextMenus.create({ parentId: "format-case", id: "copy-camel", title: "camelCase", contexts: ["selection"] });
      chrome.contextMenus.create({ parentId: "format-case", id: "copy-title", title: "Title Case", contexts: ["selection"] });
    }

    chrome.contextMenus.create({ parentId: "cleanpaste-root", id: "sep-1", type: "separator", contexts: ["selection"] });
    chrome.contextMenus.create({ parentId: "cleanpaste-root", id: "copy-chatgpt", title: "🤖 Copy as ChatGPT (Math Focus)", contexts: ["selection"] });
    chrome.contextMenus.create({ parentId: "cleanpaste-root", id: "copy-claude", title: "🧠 Copy as Claude (Format Focus)", contexts: ["selection"] });
    chrome.contextMenus.create({ parentId: "cleanpaste-root", id: "copy-gemini", title: "♊ Copy as Gemini (UI Cleanup)", contexts: ["selection"] });
    chrome.contextMenus.create({ parentId: "cleanpaste-root", id: "sep-2", type: "separator", contexts: ["selection"] });
    chrome.contextMenus.create({ parentId: "cleanpaste-root", id: "copy-markdown", title: "✂️ Quick: Strip Markdown", contexts: ["selection"] });
    
    // Paste Options
    chrome.contextMenus.create({ parentId: "cleanpaste-root", id: "paste-clean", title: "📋 Clean & Paste here", contexts: ["editable"] });
    if (settings.enableGhostPaste) {
      chrome.contextMenus.create({ parentId: "cleanpaste-root", id: "paste-ghost", title: "👻 Ghost Paste (Simulate Typing)", contexts: ["editable"] });
    }
  });
}

chrome.runtime.onInstalled.addListener(buildContextMenu);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') buildContextMenu();
});

async function getSettings() {
  return new Promise((resolve) => chrome.storage.sync.get(DEFAULT_SETTINGS, resolve));
}

async function saveToHistory(text, settings) {
  if (settings.historySize <= 0) return;
  chrome.storage.local.get({ history: [] }, (data) => {
    let history = data.history;
    if (history.length > 0 && history[0].text === text) return;
    history.unshift({ id: Date.now(), text: text, timestamp: Date.now() });
    if (history.length > settings.historySize) history = history.slice(0, settings.historySize);
    chrome.storage.local.set({ history });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "clean_text") {
    getSettings().then(settings => {
      const cleanedText = cleanText(request.text, settings, "", sender.tab ? sender.tab.url : "");
      recordStats(request.text.length, cleanedText.length);
      saveToHistory(cleanedText, settings);
      sendResponse({ cleanedText, showToast: settings.showToast });
    });
    return true; 
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const settings = await getSettings();

  // --- PASTE ACTIONS ---
  if (info.menuItemId === "paste-clean" || info.menuItemId === "paste-ghost") {
    try {
      const readResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => { try { return await navigator.clipboard.readText(); } catch(e) { return null; } }
      });
      let clipboardText = readResults && readResults[0] ? readResults[0].result : null;
      if (!clipboardText) {
        const fallbackResults = await chrome.scripting.executeScript({
           target: { tabId: tab.id },
           func: () => {
               const textArea = document.createElement("textarea"); document.body.appendChild(textArea); textArea.focus();
               document.execCommand('paste'); const t = textArea.value; document.body.removeChild(textArea); return t;
           }
        });
        clipboardText = fallbackResults && fallbackResults[0] ? fallbackResults[0].result : null;
      }
      
      if (clipboardText) {
         const cleanedText = cleanText(clipboardText, settings, "", tab.url);
         recordStats(clipboardText.length, cleanedText.length);
         
         if (info.menuItemId === "paste-ghost") {
           await chrome.scripting.executeScript({
             target: { tabId: tab.id },
             func: ghostPasteToElement,
             args: [cleanedText, settings.showToast]
           });
         } else {
           await chrome.scripting.executeScript({
             target: { tabId: tab.id },
             func: pasteToElement,
             args: [cleanedText, settings.showToast]
           });
         }
      }
    } catch (e) { console.error("Paste Error", e); }
    return;
  }

  // --- COPY ACTIONS ---
  if (!info.selectionText) return;
  let rawText = info.selectionText;
  let cleanedText = "";

  // Advanced Transforms Check
  if (["copy-code-only", "copy-bullet-to-comma", "copy-upper", "copy-lower", "copy-camel", "copy-title"].includes(info.menuItemId)) {
    const transformType = info.menuItemId.replace("copy-", "");
    cleanedText = applyAdvancedTransform(rawText, transformType);
  } else {
    let explicitProfile = "";
    let overrides = null;
    switch(info.menuItemId) {
      case "copy-chatgpt": explicitProfile = "ChatGPT"; break;
      case "copy-claude": explicitProfile = "Claude"; break;
      case "copy-gemini": explicitProfile = "Gemini"; break;
      case "copy-markdown": overrides = { removeMarkdown: true }; break;
    }
    cleanedText = cleanText(rawText, settings, explicitProfile, tab.url, overrides);
  }
  
  recordStats(rawText.length, cleanedText.length);
  await saveToHistory(cleanedText, settings);

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyToClipboardAndToast,
      args: [cleanedText, settings.showToast],
    });
  } catch (err) {}
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === "clean-copy") {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString()
      });
      if (results && results[0] && results[0].result) {
        const settings = await getSettings();
        const rawText = results[0].result;
        const cleanedText = cleanText(rawText, settings, "", tab.url);
        recordStats(rawText.length, cleanedText.length);
        await saveToHistory(cleanedText, settings);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: copyToClipboardAndToast,
          args: [cleanedText, settings.showToast],
        });
      }
    } catch (e) {}
  }
});

// --- INJECTED FUNCTIONS ---

function pasteToElement(textToInsert, showToast) {
  let activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const val = activeElement.value;
      activeElement.value = val.substring(0, start) + textToInsert + val.substring(end);
      activeElement.selectionStart = activeElement.selectionEnd = start + textToInsert.length;
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      activeElement.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (activeElement && activeElement.isContentEditable) {
      document.execCommand("insertText", false, textToInsert);
  }
  showToastNotification(showToast, 'Pasted!');
}

async function ghostPasteToElement(textToInsert, showToast) {
  let activeElement = document.activeElement;
  if (!activeElement || (!activeElement.isContentEditable && activeElement.tagName !== 'TEXTAREA' && activeElement.tagName !== 'INPUT')) {
      return;
  }
  const wait = (ms) => new Promise(res => setTimeout(res, ms));
  
  if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
      for (let i = 0; i < textToInsert.length; i++) {
        const char = textToInsert[i];
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const val = activeElement.value;
        activeElement.value = val.substring(0, start) + char + val.substring(end);
        activeElement.selectionStart = activeElement.selectionEnd = start + 1;
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(5); 
      }
      activeElement.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (activeElement.isContentEditable) {
      for(let i = 0; i < textToInsert.length; i++) {
        document.execCommand("insertText", false, textToInsert[i]);
        await wait(5);
      }
  }
  showToastNotification(showToast, '👻 Ghost Pasted!');
}

function copyToClipboardAndToast(text, showToast) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => showToastNotification(showToast, 'Copied!')).catch(fallbackCopyTextToClipboard);
  } else {
    fallbackCopyTextToClipboard();
  }
  function fallbackCopyTextToClipboard() {
    const textArea = document.createElement("textarea"); textArea.value = text;
    textArea.style.position = "fixed"; textArea.style.opacity = "0"; document.body.appendChild(textArea);
    textArea.focus(); textArea.select();
    try { if (document.execCommand('copy')) showToastNotification(showToast, 'Copied!'); } catch (err) {} document.body.removeChild(textArea);
  }
}

function showToastNotification(showToast, msg) {
  if (!showToast) return;
  const existing = document.getElementById('cleanpaste-toast'); if (existing) existing.remove();
  const toast = document.createElement('div'); toast.id = 'cleanpaste-toast'; toast.innerHTML = `<span>✨</span> CleanPaste: ${msg}`;
  Object.assign(toast.style, { position: 'fixed', bottom: '30px', right: '30px', backgroundColor: '#1f2937', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', zIndex: '2147483647', opacity: '0', transform: 'translateY(10px)', transition: 'opacity 0.3s, transform 0.3s', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' });
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)'; setTimeout(() => toast.remove(), 300); }, 2000);
}
