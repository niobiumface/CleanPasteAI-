# ✨ CleanPaste AI

**CleanPaste AI** ist eine mächtige, 100% lokale Chrome Extension (Manifest V3), die Entwicklern, Copywritern und Power-Usern das Leben rettet. Sie befreit kopierten Text von KI-Sprachmodellen (ChatGPT, Claude, Gemini) vollautomatisch von Wasserzeichen, störendem Markdown, unsichtbaren Zeichen und lästigen "KI-Floskeln".

Das Projekt ist komplett in **Vanilla JavaScript, HTML und CSS** geschrieben. Es gibt keine externen API-Aufrufe, kein Tracking und keine Build-Pipelines. Deine Daten verlassen niemals deinen Browser.

---

## 🚀 Hauptfunktionen

* **🪄 Intelligente KI-Bereinigung:** Erkennt automatisch die Quelle (ChatGPT, Claude, Gemini) anhand der URL und wendet spezialisierte Säuberungsprofile an (z.B. LaTeX-Korrektur für ChatGPT, UI-Element-Entfernung für Gemini).
* **🕵️‍♂️ Ghost Paste (Simulate Typing):** Umgeht strenge Paste-Blocker (z.B. bei Banken oder alten Formularen), indem die Extension hunderte echte Tastaturanschläge simuliert, anstatt die Zwischenablage zu nutzen.
* **🧑‍💻 Code Extractor:** Ein spezieller Modus im Kontextmenü, der den gesamten Erklärtext eines LLMs ignoriert und *nur* den geschriebenen Code in die Zwischenablage kopiert.
* **📝 Advanced Formatters:** Konvertiert Bullet-Point-Listen mit einem Klick in kommaseparierte Werte oder ändert Text blitzschnell zu `UPPERCASE`, `lowercase`, `camelCase` oder `Title Case`.
* **🧹 Link-Purifier & Emoji-Destroyer:** Entfernt auf Wunsch alle Tracking-Parameter (`utm_source`, `fbclid` etc.) aus Links und säubert formelle Geschäftstexte von Emojis.
* **🖱️ Hover Toolbar:** Ein optionales, schwebendes `✨`-Icon direkt am Mauszeiger, das markierten Text mit einem Klick bereinigt und kopiert.
* **📋 Clipboard History:** Behält (auf Wunsch bis zu 50) der letzten Operationen lokal im Speicher. Inklusive Echtzeit-Suche und Möglichkeit, alte Snipets inline im Popup zu editieren.
* **🌍 Backup & Restore:** Exportiere und importiere deine Settings, AI-Phrasen und Custom-Regex-Regeln als JSON-Datei.
* **📊 Gamification:** Das Popup zeigt dir genau an, wie viele unsichtbare Zeichen/Wasserzeichen du bereits "zerstört" hast und rechnet dir die dadurch gerettete Lebenszeit aus.

---

## ⚙️ Installation (Entwicklermodus)

Da dies eine private/lokale Extension ist, muss sie manuell in Chrome geladen werden:

1. Lade dir dieses Repository herunter oder klone es auf deinen Rechner:
   ```bash
   git clone https://github.com/niobiumface/CleanPasteAI-.git
   ```
2. Öffne den Google Chrome Browser und gehe zur URL: **`chrome://extensions/`**
3. Aktiviere oben rechts den Schalter für den **Entwicklermodus** ("Developer mode").
4. Klicke oben links auf den Button **Entpackte Erweiterung laden** ("Load unpacked").
5. Wähle den Ordner aus, der die `manifest.json` dieses Projekts enthält (der Root-Ordner `CleanPasteAI`).

Die Extension ist nun aktiv und installiert!

---

## ⌨️ Bedienung & Shortcuts

* **Rechtsklick-Menü:** Markiere einen beliebigen Text auf einer Webseite, mache einen Rechtsklick und wähle unter "✨ CleanPaste AI" dein gewünschtes Reinigungsprofil aus.
* **Direktes Einfügen:** Klicke mit der rechten Maustaste in ein leeres Textfeld und wähle **"📋 Clean & Paste here"** (oder **"👻 Ghost Paste"**).
* **Tastenkürzel:** Drücke standardmäßig `Alt + C`, um markierten Text sofort als generisches Profil zu reinigen und in die Zwischenablage zu befördern. *(Das Kürzel lässt sich in den Chrome-Einstellungen unter `chrome://extensions/shortcuts` anpassen).*

---

## 🛠️ Einstellungen & Power-Features

Ein Klick auf das Zahnrad-Icon im Extension-Popup öffnet das ausführliche Dashboard (`options.html`). Dort können Power-User die Extension exakt auf ihren Workflow abstimmen:

* **Typische KI-Formulierungen löschen:** Aktiviere den Toggle und pflege eine Wortliste (z.B. *"Zusammenfassend lässt sich sagen"*, *"Als KI-Sprachmodell"*). Die Extension schneidet diese Sätze nahtlos aus dem kopierten Text heraus.
* **Homoglyphen & Zero-Width-Characters:** Normalisiert kyrillische "Fakes" von lateinischen Buchstaben und vernichtet unsichtbare Wasserzeichen-Tags (z.B. `\u200B`).
* **Custom Regex Engine:** Du kannst eigene Regex-Pattern definieren, die während des Kopiervorgangs live über den Text laufen. Mit einem Flag (z.B. `/pattern/gi`) und dynamischen Replacements.

---

## 🔒 Privatsphäre & Sicherheit

**100% Local & Offline.** 
Diese Extension baut zu keinem Zeitpunkt eine Verbindung zu einem externen Server auf. Weder Analytics noch API-Calls. Alle Berechnungen, Regex-Prüfungen und DOM-Manipulationen erfolgen clientseitig innerhalb der Sandbox von Manifest V3. Deine History wird ausschließlich über die lokale `chrome.storage.local` API auf deiner Festplatte gespeichert.

---

*Made with ❤️ by AI for Human Workflows.*
