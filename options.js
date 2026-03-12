import { DEFAULT_SETTINGS } from './cleaner.js';

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);
document.getElementById('addRuleBtn').addEventListener('click', () => addRegexRow(true, '', ''));

document.getElementById('changeShortcutBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

let customRegexRules = [];

function getElement(id) { return document.getElementById(id); }

chrome.commands.getAll((commands) => {
  const customCommand = commands.find(c => c.name === "clean-copy");
  if (customCommand && customCommand.shortcut) {
    document.getElementById('currentShortcut').textContent = customCommand.shortcut;
  }
});

function restoreOptions() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    getElement('autoDetectLLM').checked = settings.autoDetectLLM;
    getElement('enableHoverMenu').checked = settings.enableHoverMenu || false;
    getElement('showToast').checked = settings.showToast;
    
    getElement('enableDevExtract').checked = settings.enableDevExtract || false;
    getElement('enableGhostPaste').checked = settings.enableGhostPaste || false;
    getElement('enableFormatters').checked = settings.enableFormatters || false;
    
    getElement('historySize').value = settings.historySize || 15;

    getElement('removeWatermarks').checked = settings.removeWatermarks;
    getElement('normalizeHomoglyphs').checked = settings.normalizeHomoglyphs;
    getElement('normalizeTypography').checked = settings.normalizeTypography;
    getElement('removeTrackingURLs').checked = settings.removeTrackingURLs || false;
    getElement('removeEmojis').checked = settings.removeEmojis || false;
    getElement('removeMarkdown').checked = settings.removeMarkdown;
    getElement('removeLatex').checked = settings.removeLatex;
    getElement('removeCodeBlocks').checked = settings.removeCodeBlocks;
    
    getElement('removeAIPhrases').checked = settings.removeAIPhrases;
    getElement('aiPhrasesList').value = (settings.aiPhrases || []).join('\n');

    customRegexRules = settings.customRegex || [];
    renderRegexTable();
  });
}

function saveOptions() {
  const phrasesText = getElement('aiPhrasesList').value;
  const aiPhrases = phrasesText.split('\n').map(p => p.trim()).filter(p => p.length > 0);

  let historyLimit = parseInt(getElement('historySize').value, 10);
  if (historyLimit > 50) historyLimit = 50;
  if (historyLimit < 0) historyLimit = 0;
  getElement('historySize').value = historyLimit;

  const settings = {
    autoDetectLLM: getElement('autoDetectLLM').checked,
    enableHoverMenu: getElement('enableHoverMenu').checked,
    showToast: getElement('showToast').checked,
    
    enableDevExtract: getElement('enableDevExtract').checked,
    enableGhostPaste: getElement('enableGhostPaste').checked,
    enableFormatters: getElement('enableFormatters').checked,
    historySize: historyLimit,

    removeWatermarks: getElement('removeWatermarks').checked,
    normalizeHomoglyphs: getElement('normalizeHomoglyphs').checked,
    normalizeTypography: getElement('normalizeTypography').checked,
    removeTrackingURLs: getElement('removeTrackingURLs').checked,
    removeEmojis: getElement('removeEmojis').checked,
    removeMarkdown: getElement('removeMarkdown').checked,
    removeLatex: getElement('removeLatex').checked,
    removeCodeBlocks: getElement('removeCodeBlocks').checked,
    removeAIPhrases: getElement('removeAIPhrases').checked,
    aiPhrases: aiPhrases,
    customRegex: harvestRegexTable()
  };

  chrome.storage.sync.set(settings, () => {
    showStatus("Settings Saved!");
  });
}

function showStatus(msg) {
  const status = getElement('status');
  status.textContent = msg;
  status.style.opacity = '1';
  setTimeout(() => { status.style.opacity = '0'; }, 2000);
}

function harvestRegexTable() {
  const rules = [];
  document.querySelectorAll('#regexBody tr').forEach((row, index) => {
    const active = row.querySelector('.rule-active').checked;
    const rawPattern = row.querySelector('.rule-pattern').value;
    const replaceWith = row.querySelector('.rule-replace').value;
    if (rawPattern.trim() === '') return;
    let pattern = rawPattern, flags = 'g';
    const match = rawPattern.match(/^\/(.*?)\/([a-z]*)$/);
    if (match) { pattern = match[1]; flags = match[2]; }
    rules.push({ id: index, pattern, flags, replaceWith, active });
  });
  return rules;
}

function renderRegexTable() {
  const tbody = getElement('regexBody');
  tbody.innerHTML = '';
  customRegexRules.forEach((rule) => {
    addRegexRow(rule.active, `/${rule.pattern}/${rule.flags}`, rule.replaceWith);
  });
}

function addRegexRow(active = true, pattern = '', replaceWith = '') {
  const tbody = getElement('regexBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="checkbox" class="rule-active" ${active ? 'checked' : ''}></td>
    <td><input type="text" class="regex-input rule-pattern" placeholder="/pattern/gi" value="${pattern}"></td>
    <td><input type="text" class="regex-input rule-replace" placeholder="replacement" value="${replaceWith}"></td>
    <td><button class="btn-danger delete-row-btn">Delete</button></td>
  `;
  tr.querySelector('.delete-row-btn').addEventListener('click', () => tr.remove());
  tbody.appendChild(tr);
}

document.getElementById('exportBtn').addEventListener('click', () => {
  chrome.storage.sync.get(null, (allSettings) => {
    const blob = new Blob([JSON.stringify(allSettings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleanpaste-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());

document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (typeof data === 'object') {
        chrome.storage.sync.set(data, () => {
          restoreOptions();
          showStatus("Settings Imported!");
        });
      }
    } catch(err) {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
});
