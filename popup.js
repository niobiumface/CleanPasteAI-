import { cleanText, DEFAULT_SETTINGS, recordStats } from './cleaner.js';

document.addEventListener('DOMContentLoaded', async () => {
  const manualInput = document.getElementById('manualInput');
  const cleanBtn = document.getElementById('cleanBtn');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const historyList = document.getElementById('historyList');
  const searchInput = document.getElementById('searchInput');

  // Load Settings
  const settings = await new Promise(res => chrome.storage.sync.get(DEFAULT_SETTINGS, res));

  // Tabs Logic
  document.getElementById('tabClean').addEventListener('click', () => switchTab('Clean'));
  document.getElementById('tabStats').addEventListener('click', () => switchTab('Stats'));

  function switchTab(view) {
    document.getElementById('tabClean').classList.toggle('active', view === 'Clean');
    document.getElementById('tabStats').classList.toggle('active', view === 'Stats');
    document.getElementById('viewClean').style.display = view === 'Clean' ? 'block' : 'none';
    document.getElementById('viewStats').style.display = view === 'Stats' ? 'block' : 'none';
    if (view === 'Stats') updateStatsView();
  }

  // Settings Button
  openSettingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

  // Manual Clean & Copy Logic
  cleanBtn.addEventListener('click', async () => {
    const rawText = manualInput.value;
    if (!rawText.trim()) return;

    const cleanedText = cleanText(rawText, settings);
    manualInput.value = cleanedText; 
    recordStats(rawText.length, cleanedText.length);
    saveToHistory(cleanedText, settings.historySize);

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(cleanedText);
        showSuccessState(cleanBtn);
      } else {
        throw new Error('Clipboard API Error');
      }
    } catch (err) {
      manualInput.select();
      if (document.execCommand('copy')) showSuccessState(cleanBtn);
    }
  });

  searchInput.addEventListener('input', () => {
    try {
      const term = searchInput.value.toLowerCase();
      if (!historyList) return;
      
      Array.from(historyList.children).forEach(item => {
        try {
          if (!item || !item.classList || item.classList.contains('empty-history')) return;
          const textElem = item.querySelector('.history-text');
          if (textElem) {
            const text = (textElem.textContent || "").toLowerCase();
            item.style.display = text.includes(term) ? 'flex' : 'none';
          }
        } catch (innerErr) {
          // ignore item error
        }
      });
    } catch (err) {
      console.error(err);
    }
  });

  loadHistory();

  function loadHistory() {
    chrome.storage.local.get({ history: [] }, (data) => {
      historyList.innerHTML = '';
      if (data.history.length === 0) {
        historyList.innerHTML = '<div class="empty-history">No recent history.</div>';
        return;
      }
      
      data.history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'history-content';
        
        const textSpan = document.createElement('div'); 
        textSpan.className = 'history-text'; 
        textSpan.textContent = item.text;
        textSpan.title = "Click to copy";
        contentDiv.appendChild(textSpan);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'history-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn';
        editBtn.title = "Edit";
        editBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>';
        
        const delBtn = document.createElement('button');
        delBtn.className = 'action-btn action-btn-del';
        delBtn.title = "Delete";
        delBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(delBtn);

        div.appendChild(contentDiv);
        div.appendChild(actionsDiv);
        
        // Copy on click
        textSpan.addEventListener('click', () => {
          if (textSpan.isContentEditable) return; 
          navigator.clipboard.writeText(textSpan.textContent).then(() => {
            const origColor = div.style.backgroundColor; div.style.backgroundColor = '#d1fae5';
            setTimeout(() => { div.style.backgroundColor = origColor; }, 500);
          });
        });

        // Delete action
        delBtn.addEventListener('click', () => {
           data.history.splice(index, 1);
           chrome.storage.local.set({ history: data.history }, () => loadHistory());
        });

        // Edit action
        editBtn.addEventListener('click', () => {
          if (textSpan.isContentEditable) {
            // Save mode
            textSpan.contentEditable = "false";
            textSpan.classList.remove('editing');
            editBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>';
            data.history[index].text = textSpan.textContent;
            chrome.storage.local.set({ history: data.history });
          } else {
            // Edit mode
            textSpan.contentEditable = "true";
            textSpan.classList.add('editing');
            textSpan.focus();
            editBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'; 
          }
        });

        historyList.appendChild(div);
      });
    });
  }

  function saveToHistory(text, maxSize) {
    if (maxSize <= 0) return;
    chrome.storage.local.get({ history: [] }, (data) => {
      let history = data.history;
      if (history.length > 0 && history[0].text === text) return; 
      history.unshift({ text, timestamp: Date.now() });
      if (history.length > maxSize) history = history.slice(0, maxSize);
      chrome.storage.local.set({ history }, () => loadHistory());
    });
  }

  function updateStatsView() {
    chrome.storage.local.get({ stats: { uses: 0, charsRemoved: 0 } }, (data) => {
      const uses = data.stats.uses;
      const chars = data.stats.charsRemoved;
      const secondsSaved = Math.floor(chars * 0.05); 
      let timeStr = `${secondsSaved}s`;
      if (secondsSaved >= 60) timeStr = `${Math.floor(secondsSaved / 60)}m ${secondsSaved % 60}s`;

      document.getElementById('statUses').textContent = uses;
      document.getElementById('statChars').textContent = chars;
      document.getElementById('statTime').textContent = timeStr;
    });
  }

  function showSuccessState(btnElement) {
    const originalHTML = btnElement.innerHTML;
    btnElement.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!`;
    btnElement.classList.add('success');
    setTimeout(() => { btnElement.innerHTML = originalHTML; btnElement.classList.remove('success'); }, 2000);
  }
});
