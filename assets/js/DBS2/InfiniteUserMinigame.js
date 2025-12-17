import { updateCrypto, isMinigameCompleted, completeMinigame, addInventoryItem } from './StatsManager.js';
import { javaURI, pythonURI, fetchOptions } from '../api/config.js';
import Prompt from './Prompt.js';

// Backend setup - uses DBS2 endpoint (uppercase)
const PASSWORDS_URL = `${pythonURI}/api/DBS2/passwords`;
const ROTATE_URL = `${pythonURI}/api/DBS2/passwords/rotate`;
const MAX_PASSWORDS = 5;

// Banned words list (lowercase) - also enforced on backend
const BANNED_WORDS = [
    'fuck', 'shit', 'damn', 'bitch', 'ass', 'dick', 'cock', 'pussy', 'cunt',
    'fag', 'nigger', 'nigga', 'retard', 'slut', 'whore', 'porn', 'sex',
    'nazi', 'hitler', 'rape', 'kill', 'murder', 'die', 'kys'
];

// Default passwords if backend is empty
const DEFAULT_PASSWORDS = [
    "ishowgreen",
    "cryptoking",
    "basement",
    "password",
    "helloworld"
];

let quizzing = false;
let passwords = [...DEFAULT_PASSWORDS];
let passwordsLoaded = false;

// Fetch GLOBAL passwords from backend
async function loadPasswordsFromBackend() {
    try {
        console.log('[InfiniteUser] Fetching global passwords from:', PASSWORDS_URL);
        const response = await fetch(PASSWORDS_URL, {
            ...fetchOptions,
            method: 'GET'
        });
        
        if (!response.ok) {
            console.warn("[InfiniteUser] Could not fetch passwords:", response.status);
            return;
        }
        
        const data = await response.json();
        console.log('[InfiniteUser] Backend response:', data);
        
        if (data && Array.isArray(data.data) && data.data.length > 0) {
            passwords = data.data.filter(p => typeof p === 'string' && p.length >= 4);
            
            // Ensure we have at least some passwords
            if (passwords.length === 0) {
                passwords = [...DEFAULT_PASSWORDS];
            }
            
            passwordsLoaded = true;
            console.log('[InfiniteUser] Global passwords loaded:', passwords);
        }
    } catch (err) {
        console.warn("[InfiniteUser] Could not fetch passwords from backend:", err);
    }
}

// Rotate password on backend (remove old, add new)
async function rotatePasswordOnBackend(oldPassword, newPassword) {
    try {
        console.log('[InfiniteUser] Rotating password:', oldPassword, '->', newPassword);
        const response = await fetch(ROTATE_URL, {
            ...fetchOptions,
            method: 'POST',
            body: JSON.stringify({
                old: oldPassword,
                new: newPassword
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('[InfiniteUser] Password rotated successfully:', data);
            
            // Update local passwords from server response
            if (data && Array.isArray(data.data)) {
                passwords = data.data;
            }
            return true;
        } else {
            const error = await response.json();
            console.error('[InfiniteUser] Failed to rotate password:', error);
            return false;
        }
    } catch (e) {
        console.error('[InfiniteUser] Could not rotate password on backend:', e);
        return false;
    }
}

// Check if password contains banned words
function containsBannedWord(password) {
    const lower = password.toLowerCase();
    return BANNED_WORDS.some(banned => lower.includes(banned));
}

// Convert to alphanumeric puzzle format (a=1, b=2, etc.)
function convertToAlphaNumeric(str) {
    let newString = "";
    for (let i = 0; i < str.length; i++) {
        newString += str.charCodeAt(i) - 96;
        newString += "/";
    }
    return newString;
}

// Load passwords on module init
loadPasswordsFromBackend();

export default async function infiniteUserMinigame() {
    if (quizzing) return;
    
    // Refresh passwords before starting
    await loadPasswordsFromBackend();
    
    // Cleanup any existing instance
    const existing = document.getElementById("quizWindow");
    if (existing) existing.remove();
    if (window._infiniteUserKeyHandler) {
        try { window.removeEventListener("keydown", window._infiniteUserKeyHandler, true); } catch (e) {}
        window._infiniteUserKeyHandler = null;
    }

    quizzing = true;
    window.infiniteUserActive = true;
    window.minigameActive = true;
    
    let creatingNew = false;
    const selectedIndex = Math.floor(Math.random() * passwords.length);
    const selectedPassword = passwords[selectedIndex];
    
    const baseurl = document.body.getAttribute('data-baseurl') || '';
    
    // Create DOM elements
    let quizWindow = document.createElement("div");
    quizWindow.style.cssText = `
        position: fixed;
        width: 55%;
        height: 55%;
        top: 22%;
        left: 22%;
        z-index: 10000;
        background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
        border: 2px solid #0a5;
        text-align: center;
        color: #0a5;
        font-family: "Courier New", monospace;
        border-radius: 10px;
        padding: 20px;
    `;
    quizWindow.id = "quizWindow";
    document.body.appendChild(quizWindow);
    
    // Header
    let header = document.createElement("div");
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    `;
    
    let title = document.createElement("div");
    title.textContent = "PASSWORD TERMINAL";
    title.style.cssText = `
        color: #0a5;
        font-size: 16px;
        font-weight: bold;
        letter-spacing: 2px;
    `;
    
    let closeBtn = document.createElement("button");
    closeBtn.innerText = "EXIT";
    closeBtn.style.cssText = `
        background: #600;
        color: #ccc;
        border: 1px solid #800;
        padding: 6px 15px;
        cursor: pointer;
        font-size: 12px;
        font-family: "Courier New", monospace;
    `;
    closeBtn.onclick = closeMinigame;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    quizWindow.appendChild(header);
    
    // Global indicator
    let globalNote = document.createElement("div");
    globalNote.style.cssText = `
        color: #a80;
        font-size: 10px;
        margin-bottom: 10px;
        padding: 5px;
        background: rgba(170, 136, 0, 0.1);
        border-radius: 3px;
    `;
    globalNote.textContent = "GLOBAL SYSTEM - Passwords shared between all users";
    quizWindow.appendChild(globalNote);
    
    // Message area
    let messageDiv = document.createElement("div");
    messageDiv.style.cssText = `
        color: #0a5;
        font-size: 14px;
        margin: 15px 0;
        min-height: 80px;
    `;
    messageDiv.innerHTML = `
        <div style="color: #888; margin-bottom: 10px;">Decrypt the alphanumeric password:</div>
        <div style="font-size: 18px; letter-spacing: 2px; color: #0a5;">${convertToAlphaNumeric(selectedPassword)}</div>
        <div style="color: #555; font-size: 10px; margin-top: 8px;">Hint: a=1, b=2, c=3... z=26</div>
    `;
    quizWindow.appendChild(messageDiv);

    // Input box
    let typebox = document.createElement("div");
    typebox.style.cssText = `
        width: 80%;
        margin: 0 auto;
        height: 50px;
        background: rgba(0, 40, 20, 0.5);
        font-family: "Courier New", monospace;
        font-size: 24px;
        text-align: center;
        color: #0a5;
        border: 1px solid #052;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    typebox.innerText = ">";
    quizWindow.appendChild(typebox);
    
    // Instructions
    let instructions = document.createElement("div");
    instructions.style.cssText = `
        color: #666;
        font-size: 11px;
        margin-top: 15px;
    `;
    instructions.textContent = "Type the password and press Enter. Letters only.";
    quizWindow.appendChild(instructions);
    
    // Bottom bar
    let bottomBar = document.createElement("div");
    bottomBar.style.cssText = `
        position: absolute;
        bottom: 15px;
        left: 15px;
        right: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    // Auto-complete button (for testing)
    let autoCompleteBtn = document.createElement("button");
    autoCompleteBtn.innerText = "AUTO (TEST)";
    autoCompleteBtn.style.cssText = `
        background: #330;
        color: #aa0;
        border: 1px solid #550;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 10px;
        font-family: "Courier New", monospace;
    `;
    autoCompleteBtn.onclick = () => {
        if (!creatingNew) {
            typebox.innerText = ">" + selectedPassword;
            setTimeout(() => {
                const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
                keyHandler(enterEvent);
            }, 100);
        } else {
            const testPw = "test" + Math.floor(Math.random() * 1000);
            typebox.innerText = ">" + testPw;
            setTimeout(() => {
                const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
                keyHandler(enterEvent);
            }, 100);
        }
    };
    
    // Password count indicator
    let pwCount = document.createElement("div");
    pwCount.style.cssText = `
        color: #444;
        font-size: 10px;
    `;
    pwCount.textContent = `Global passwords: ${passwords.length}/${MAX_PASSWORDS}`;
    
    bottomBar.appendChild(autoCompleteBtn);
    bottomBar.appendChild(pwCount);
    quizWindow.appendChild(bottomBar);
    
    // Check if first completion
    let isFirstCompletion = false;
    try {
        isFirstCompletion = !(await isMinigameCompleted('infinite_user'));
        console.log('[InfiniteUser] First completion:', isFirstCompletion);
    } catch (e) {
        console.log('[InfiniteUser] Could not check completion status:', e);
    }
    
    function closeMinigame() {
        try { quizWindow.remove(); } catch (e) {}
        quizzing = false;
        window.infiniteUserActive = false;
        window.minigameActive = false;
        window.removeEventListener("keydown", keyHandler, true);
        try {
            if (window.Leaderboard && typeof window.Leaderboard.refresh === 'function') {
                window.Leaderboard.refresh();
            }
        } catch(e) {}
    }
    
    async function completeWithReward(newPassword) {
        // Rotate password on backend (removes old, adds new)
        const rotated = await rotatePasswordOnBackend(selectedPassword, newPassword);
        
        if (!rotated) {
            // Update local only if backend failed
            const idx = passwords.indexOf(selectedPassword);
            if (idx > -1) passwords.splice(idx, 1);
            if (!passwords.includes(newPassword)) {
                passwords.push(newPassword);
            }
            while (passwords.length > MAX_PASSWORDS) {
                passwords.shift();
            }
        }
        
        console.log('[InfiniteUser] Current passwords:', passwords);
        
        // Calculate reward
        const baseReward = 15 + Math.floor(Math.random() * 10);
        const bonus = isFirstCompletion ? 20 : 0;
        const totalReward = baseReward + bonus;
        
        // Award crypto
        await updateCrypto(totalReward);
        
        // Mark complete and add code scrap on first completion
        if (isFirstCompletion) {
            try {
                await completeMinigame('infinite_user');
                console.log('[InfiniteUser] Marked as complete');
                
                await addInventoryItem({
                    name: 'Code Scrap: Infinite User',
                    found_at: 'infinite_user',
                    timestamp: new Date().toISOString()
                });
                console.log('[InfiniteUser] Code scrap added to inventory');
            } catch (e) {
                console.log('[InfiniteUser] Could not save completion:', e);
            }
        }
        
        // Show completion message
        if (isFirstCompletion) {
            messageDiv.innerHTML = `
                <div style="font-size: 16px; color: #0a5;">CODE FRAGMENT RECOVERED</div>
                <div style="font-size: 12px; margin-top: 10px; color: #888;">Found the password list behind the keyboard.</div>
                <div style="margin-top: 15px;">
                    <img src="${baseurl}/images/DBS2/codescrapPassword.png" style="max-width: 70px; border: 1px solid #0a5; border-radius: 4px;" onerror="this.style.display='none'">
                </div>
                <div style="font-size: 14px; margin-top: 10px; color: #0a5;">+${totalReward} Crypto</div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div style="font-size: 16px; color: #0a5;">PASSWORD UPDATED</div>
                <div style="font-size: 12px; margin-top: 10px; color: #888;">"${newPassword}" added to the global system.</div>
                <div style="font-size: 11px; margin-top: 5px; color: #a80;">Other players may now have to decrypt your password!</div>
                <div style="font-size: 14px; margin-top: 15px; color: #0a5;">+${totalReward} Crypto</div>
            `;
        }
        
        typebox.style.display = 'none';
        instructions.style.display = 'none';
        bottomBar.style.display = 'none';
        globalNote.style.display = 'none';
        
        setTimeout(() => {
            closeMinigame();
            try {
                if (isFirstCompletion) {
                    Prompt.showDialoguePopup('System', `Password list recovered. +${totalReward} Crypto.`);
                } else {
                    Prompt.showDialoguePopup('System', `Password "${newPassword}" saved globally. +${totalReward} Crypto.`);
                }
            } catch(e) {
                console.log(`Earned ${totalReward} Crypto`);
            }
        }, isFirstCompletion ? 2500 : 1500);
    }

    function keyHandler(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (event.key === 'Backspace' && typebox.innerText.length > 1) {
            typebox.innerText = typebox.innerText.slice(0, -1);
        } else if (event.key === "Escape") {
            closeMinigame();
        } else if (event.key === "Enter" || event.key === "Return") {
            const input = typebox.innerText.slice(1).toLowerCase();
            
            if (creatingNew) {
                // Validate new password
                if (input.length < 4) {
                    typebox.style.borderColor = "#f00";
                    instructions.textContent = "Password must be at least 4 characters.";
                    instructions.style.color = "#f00";
                    setTimeout(() => {
                        typebox.style.borderColor = "#052";
                        instructions.textContent = "Type a new password (4+ letters, no bad words).";
                        instructions.style.color = "#666";
                    }, 1500);
                    return;
                }
                
                if (containsBannedWord(input)) {
                    typebox.style.borderColor = "#f00";
                    typebox.innerText = ">DENIED";
                    instructions.textContent = "Inappropriate password rejected.";
                    instructions.style.color = "#f00";
                    setTimeout(() => {
                        typebox.innerText = ">";
                        typebox.style.borderColor = "#052";
                        instructions.textContent = "Type a new password (4+ letters, no bad words).";
                        instructions.style.color = "#666";
                    }, 1500);
                    return;
                }
                
                // Check for duplicates
                if (passwords.includes(input)) {
                    typebox.style.borderColor = "#f00";
                    instructions.textContent = "Password already exists. Choose another.";
                    instructions.style.color = "#f00";
                    setTimeout(() => {
                        typebox.style.borderColor = "#052";
                        instructions.textContent = "Type a new password (4+ letters, no bad words).";
                        instructions.style.color = "#666";
                    }, 1500);
                    return;
                }
                
                completeWithReward(input);
            } else {
                // Check if password matches
                if (input === selectedPassword) {
                    messageDiv.innerHTML = `
                        <div style="color: #0a5; font-size: 16px;">ACCESS GRANTED</div>
                        <div style="color: #888; font-size: 12px; margin-top: 10px;">Now create a replacement password for the global system.</div>
                        <div style="color: #a80; font-size: 10px; margin-top: 5px;">Your password will be shared with other players!</div>
                    `;
                    typebox.innerText = ">";
                    creatingNew = true;
                    instructions.textContent = "Type a new password (4+ letters, no bad words).";
                } else {
                    typebox.style.borderColor = "#f00";
                    typebox.innerText = ">DENIED";
                    setTimeout(() => {
                        typebox.innerText = ">";
                        typebox.style.borderColor = "#052";
                    }, 800);
                }
            }
        } else if (event.key.length === 1 && typebox.innerText.length < 20 && /^[a-z]$/i.test(event.key)) {
            typebox.innerText += event.key.toLowerCase();
        }
    }
    
    window.addEventListener("keydown", keyHandler, true);
    window._infiniteUserKeyHandler = keyHandler;
}