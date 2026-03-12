// content.js - Injected into pages to provide Hover-Toolbar

let hoverMenu = null;
let currentSelection = "";

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.toString().trim() === "") {
    hideHoverMenu();
  }
});

document.addEventListener("mouseup", (e) => {
  setTimeout(() => {
    chrome.storage.sync.get({ enableHoverMenu: false }, (settings) => {
      if (!settings.enableHoverMenu) return;

      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text.length > 0) {
        currentSelection = text;
        showHoverMenu(e.pageX, e.pageY);
      } else {
        hideHoverMenu();
      }
    });
  }, 10);
});

function showHoverMenu(x, y) {
  if (!hoverMenu) {
    hoverMenu = document.createElement("div");
    hoverMenu.id = "cleanpaste-hover-menu";
    hoverMenu.innerHTML = `<button style="background:none;border:none;cursor:pointer;font-size:16px;padding:4px;display:flex;align-items:center;" title="CleanPaste & Copy">✨</button>`;
    Object.assign(hoverMenu.style, {
      position: "absolute",
      zIndex: "2147483647",
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      padding: "2px 4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "opacity 0.2s",
      cursor: "pointer",
      color: "#4f46e5"
    });

    hoverMenu.addEventListener("mousedown", (e) => e.preventDefault()); // Prevent losing selection

    hoverMenu.querySelector("button").addEventListener("click", () => {
      hoverMenu.style.opacity = "0.5";
      chrome.runtime.sendMessage({ action: "clean_text", text: currentSelection }, (response) => {
        if (response && response.cleanedText) {
          copyToClipboardAndToast(response.cleanedText, response.showToast);
        }
        hideHoverMenu();
        window.getSelection().removeAllRanges();
      });
    });
    document.body.appendChild(hoverMenu);
  }
  
  // Position slightly above the cursor
  hoverMenu.style.left = `${x}px`;
  hoverMenu.style.top = `${y - 45}px`;
  hoverMenu.style.display = "flex";
  hoverMenu.style.opacity = "1";
}

function hideHoverMenu() {
  if (hoverMenu) hoverMenu.style.display = "none";
}

function copyToClipboardAndToast(text, showToast) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => showToastNotification(showToast)).catch(fallbackCopyTextToClipboard);
  } else {
    fallbackCopyTextToClipboard();
  }
  
  function fallbackCopyTextToClipboard() {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      if (document.execCommand('copy')) showToastNotification(showToast);
    } catch (err) {}
    document.body.removeChild(textArea);
  }
}

function showToastNotification(showToast) {
  if (!showToast) return;
  const existing = document.getElementById('cleanpaste-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'cleanpaste-toast';
  toast.innerHTML = '<span>✨</span> CleanPaste: Copied!';
  
  Object.assign(toast.style, {
    position: 'fixed', bottom: '30px', right: '30px', backgroundColor: '#1f2937', color: '#ffffff',
    padding: '12px 20px', borderRadius: '8px', zIndex: '2147483647', opacity: '0', 
    transform: 'translateY(10px)', transition: 'opacity 0.3s, transform 0.3s',
    display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  });
  
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)'; setTimeout(() => toast.remove(), 300); }, 2000);
}
