# ✨ CleanPaste AI

**CleanPaste AI** is a powerful, privacy-first Chrome Extension (Manifest V3) designed for developers, copywriters, and power users. It automatically cleans text copied from LLMs (like ChatGPT, Claude, and Gemini) by removing watermarks, unwanted Markdown, invisible zero-width characters, and repetitive "AI phrases."

Built entirely with **Vanilla JavaScript, HTML, and CSS**, CleanPaste AI requires no external API calls, contains zero tracking, and uses no build pipelines. Your clipboard data never leaves your local browser sandbox.

## 🚀 Features

* **🪄 Intelligent Context Detection:** Automatically detects the source LLM (ChatGPT, Claude, Gemini) based on the active tab and applies tailored processing profiles (e.g., stripping LaTeX brackets for ChatGPT, removing UI artifacts for Gemini).
* **🕵️‍♂️ Ghost Paste (Simulate Typing):** Bypasses strict paste-blockers on legacy systems or secure forms by simulating hundreds of rapid `KeyboardEvents` instead of using the clipboard.
* **🧑‍💻 Code Extractor:** A specialized context menu option that ignores all conversational text and only extracts the raw code blocks.
* **📝 Advanced Formatters:** Instantly convert bulleted lists into comma-separated strings or format text casing to `UPPERCASE`, `lowercase`, `camelCase`, or `Title Case`.
* **🧹 Link Purifier & Emoji Destroyer:** Automatically strip tracking parameters (`utm_source`, `fbclid`, etc.) from URLs embedded in the text, and an optional toggle to remove all emojis for professional communication.
* **🖱️ Hover Toolbar:** An optional, non-intrusive floating `✨` toolbar that appears on text selection for instant one-click cleaning and copying.
* **📋 Clipboard History:** Maintains a local history of your recent clean actions (up to 50 items). Features real-time search and inline editing for quick snippet corrections.
* **🌍 Settings Sync & Backup:** Export and import your custom configurations, phrase lists, and Regex rules safely via JSON.
* **📊 Usage Statistics:** A local gamification dashboard tracks the exact number of invisible characters destroyed and estimates the time you've saved using the extension.

## ⚙️ Installation

To install CleanPaste AI locally in developer mode:

1. Clone or download this repository:
   ```bash
   git clone https://github.com/niobiumface/CleanPasteAI-.git
   ```
2. Open Google Chrome and navigate to **`chrome://extensions/`**.
3. Enable **Developer mode** via the toggle in the top-right corner.
4. Click the **Load unpacked** button.
5. Select the `CleanPasteAI` root folder containing the `manifest.json`.

## ⌨️ Usage & Shortcuts

* **Context Menu:** Highlight any text, right-click, and navigate to "✨ CleanPaste AI" to select a specific cleaning profile.
* **Direct Paste:** Right-click inside any editable text field and select **"📋 Clean & Paste here"** (or **"👻 Ghost Paste"**).
* **Quick Shortcut:** Press `Alt + C` to instantly clean the highlighted text using the generic profile and copy it to your clipboard. *(This shortcut can be changed in `chrome://extensions/shortcuts`)*.

## 🛠️ Configuration & Power Tools

Clicking the extension icon and opening the Settings gear (`options.html`) unlocks advanced controls:

* **Remove Typical AI Formulations:** Define an editable list of repetitive phrases (e.g., *"In conclusion"*, *"As an AI language model"*). The extension will silently slice these out of the text.
* **Homoglyph Normalization:** Converts common Cyrillic "fakes" back to their Latin equivalents and eradicates invisible zero-width characters (e.g., `\u200B`).
* **Custom Regex Engine:** Define your own RegEx patterns and replacements to run over the text sequentially during the cleaning process.

## 🔒 Privacy & Architecture

**100% Local & Offline.** 
This extension never connects to an external server. It contains no analytics and makes zero API calls. All processing, RegEx validations, and DOM manipulations are performed client-side within the Manifest V3 sandbox. Your clipboard history is stored exclusively on your device using the `chrome.storage.local` API.
