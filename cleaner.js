export const DEFAULT_SETTINGS = {
  autoDetectLLM: true,
  enableHoverMenu: false,
  showToast: true,
  
  // Power User Menu Toggles
  enableDevExtract: false,
  enableGhostPaste: false,
  enableFormatters: false,

  removeWatermarks: true,
  normalizeHomoglyphs: true,
  normalizeTypography: true,
  removeMarkdown: false,
  removeCodeBlocks: false,
  removeLatex: true,
  removeTrackingURLs: false,
  removeEmojis: false,
  removeAIPhrases: false,
  aiPhrases: [
    "In summary",
    "To summarize",
    "In conclusion",
    "To conclude",
    "It is important to note",
    "It's important to note",
    "Please note that",
    "As an AI language model",
    "I am an AI",
    "Here is a breakdown",
    "Certainly!",
    "Sure thing!",
    "Of course,"
  ],
  customRegex: [],
  historySize: 15
};

export function cleanText(text, settings, explicitProfile = "", urlContext = "", tempSettingsOverride = null) {
  if (!text) return "";
  let processedText = text;
  
  const activeSettings = { ...settings, ...tempSettingsOverride };

  // 1. Determine Profile
  let profile = "Generic";
  if (explicitProfile) {
    profile = explicitProfile;
  } else if (activeSettings.autoDetectLLM && urlContext) {
    if (urlContext.includes("chatgpt.com")) profile = "ChatGPT";
    else if (urlContext.includes("claude.ai")) profile = "Claude";
    else if (urlContext.includes("gemini.google.com")) profile = "Gemini";
  }

  // 2. Specific LLM Pre-processing
  if (profile === "ChatGPT") {
    if (activeSettings.removeLatex) processedText = processedText.replace(/\\[\[\]()]/g, "");
    processedText = processedText.replace(/^Copy code$/gm, "");
  } else if (profile === "Claude") {
    processedText = processedText.replace(/^[ \t]+/gm, "");
  } else if (profile === "Gemini") {
    processedText = processedText.replace(/Show drafts\s*/gi, "");
    processedText = processedText.replace(/volume_up\s*/gi, "");
  }

  // 3. AI Formulations (Phrases)
  if (activeSettings.removeAIPhrases && activeSettings.aiPhrases && activeSettings.aiPhrases.length > 0) {
    const sortedPhrases = [...activeSettings.aiPhrases].sort((a, b) => b.length - a.length);
    sortedPhrases.forEach(phrase => {
      if (!phrase.trim()) return;
      const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\s)${escapedPhrase}[,.:;]?\\s*`, 'gi');
      processedText = processedText.replace(regex, (match, p1) => p1 === '\n' ? '\n' : (p1 === ' ' ? ' ' : ''));
    });
  }

  // 4. Emojis and URL Tracking
  if (activeSettings.removeTrackingURLs) {
    processedText = processedText.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      try {
        const u = new URL(url);
        const params = new URLSearchParams(u.search);
        const toDelete = [];
        for (const key of params.keys()) {
          if (key.match(/^(utm_|fbclid|gclid|msclkid|mc_eid|igshid|_hsenc|_hsmi)/i)) toDelete.push(key);
        }
        toDelete.forEach(k => params.delete(k));
        u.search = params.toString();
        return u.toString().replace(/\?$/, '');
      } catch(e) { return url; }
    });
  }
  
  if (activeSettings.removeEmojis) {
    try {
      processedText = processedText.replace(/\p{Extended_Pictographic}/gu, "");
    } catch (e) {}
  }

  // 5. Granular Toggles
  if (activeSettings.removeWatermarks) {
    processedText = processedText.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "");
  }

  if (activeSettings.normalizeHomoglyphs) {
    const homoglyphMap = {
      'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'у': 'y', 'і': 'i', 'ј': 'j', 'ѕ': 's',
      'А': 'A', 'С': 'C', 'Е': 'E', 'О': 'O', 'Р': 'P', 'Х': 'X', 'У': 'Y', 'І': 'I', 'Ј': 'J', 'Ѕ': 'S'
    };
    processedText = processedText.replace(/[асеорхуіјѕАСЕОРХУІЈЅ]/g, match => homoglyphMap[match] || match);
  }

  if (activeSettings.normalizeTypography) {
    processedText = processedText.replace(/[“”«»]/g, '"');
    processedText = processedText.replace(/[‘’]/g, "'");
    processedText = processedText.replace(/—|–/g, "-");
  }

  if (activeSettings.removeCodeBlocks) {
    processedText = processedText.replace(/```[\s\S]*?```/g, "");
  }

  if (activeSettings.removeMarkdown) {
    if (!activeSettings.removeCodeBlocks) {
        processedText = processedText.replace(/`([^`]+)`/g, "$1");
    }
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, "$1");
    processedText = processedText.replace(/\*(.*?)\*/g, "$1");
    processedText = processedText.replace(/__(.*?)__/g, "$1");
    processedText = processedText.replace(/_(.*?)_/g, "$1");
    processedText = processedText.replace(/~~(.*?)~~/g, "$1");
    processedText = processedText.replace(/^#{1,6}\s+/gm, "");
  }

  // 6. Custom Regex
  if (activeSettings.customRegex && activeSettings.customRegex.length > 0) {
    activeSettings.customRegex.forEach(rule => {
      if (rule.active) {
        try {
          const regex = new RegExp(rule.pattern, rule.flags);
          processedText = processedText.replace(regex, rule.replaceWith);
        } catch (e) {}
      }
    });
  }

  return processedText.trim();
}

export function applyAdvancedTransform(text, transformType) {
  if (!text) return "";
  let processed = text;
  
  switch (transformType) {
    case 'code-only':
      const codeBlocks = processed.match(/```[\s\S]*?```/g);
      if (codeBlocks) {
        processed = codeBlocks.map(block => block.replace(/```[a-z]*\n?/gi, '').replace(/```$/, '')).join('\n\n');
      } else {
        const inlineCode = processed.match(/`([^`]+)`/g);
        if (inlineCode) {
          processed = inlineCode.map(code => code.replace(/`/g, '')).join('\n');
        } else {
          processed = "No code blocks found.";
        }
      }
      break;
    case 'bullet-to-comma':
      const lines = processed.split('\n');
      const items = lines.map(l => l.replace(/^[\s\*\-\+•\d\.]+\s*/, '').trim()).filter(l => l.length > 0);
      processed = items.join(', ');
      break;
    case 'upper':
      processed = processed.toUpperCase();
      break;
    case 'lower':
      processed = processed.toLowerCase();
      break;
    case 'camel':
      processed = processed.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (word, index) => {
        if (word.match(/^\s+$/)) return '';
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      });
      // Fallback fallback if spaces remain
      processed = processed.replace(/\s+/g, '');
      break;
    case 'title':
      processed = processed.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      break;
  }
  return processed;
}

export function recordStats(rawLength, cleanLength) {
  const diff = Math.max(0, rawLength - cleanLength);
  chrome.storage.local.get({ stats: { uses: 0, charsRemoved: 0 } }, (data) => {
    let stats = data.stats;
    stats.uses += 1;
    stats.charsRemoved += diff;
    chrome.storage.local.set({ stats });
  });
}
