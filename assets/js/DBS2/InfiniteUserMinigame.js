// InfiniteUserMinigame.js - Rewards ETHEREUM (ETH)
// Change: Replace updateCrypto() with rewardMinigame()

import { rewardMinigame, isMinigameCompleted, completeMinigame, addInventoryItem } from './StatsManager.js';
import { javaURI, pythonURI, fetchOptions } from '../api/config.js';
import Prompt from './Prompt.js';

const MINIGAME_NAME = 'infinite_user';
const COIN_NAME = 'Ethereum';
const COIN_SYMBOL = 'ETH';

const PASSWORDS_URL = `${pythonURI}/api/DBS2/passwords`;
const ROTATE_URL = `${pythonURI}/api/DBS2/passwords/rotate`;
const MAX_PASSWORDS = 5;

const BANNED_WORDS = [
    'fuck', 'shit', 'damn', 'bitch', 'ass', 'dick', 'cock', 'pussy', 'cunt',
    'fag', 'nigger', 'nigga', 'retard', 'slut', 'whore', 'porn', 'sex',
    'nazi', 'hitler', 'rape', 'kill', 'murder', 'die', 'kys'
];

const DEFAULT_PASSWORDS = ["ishowgreen", "cryptoking", "basement", "password", "helloworld"];

let quizzing = false;
let passwords = [...DEFAULT_PASSWORDS];
let passwordsLoaded = false;

async function loadPasswordsFromBackend() {
    try {
        const response = await fetch(PASSWORDS_URL, { ...fetchOptions, method: 'GET' });
        if (!response.ok) return;
        const data = await response.json();
        if (data && Array.isArray(data.data) && data.data.length > 0) {
            passwords = data.data.filter(p => typeof p === 'string' && p.length >= 4);
            if (passwords.length === 0) passwords = [...DEFAULT_PASSWORDS];
            passwordsLoaded = true;
        }
    } catch (err) {
        console.warn("[InfiniteUser] Could not fetch passwords:", err);
    }
}

async function rotatePasswordOnBackend(oldPassword, newPassword) {
    try {
        const response = await fetch(ROTATE_URL, {
            ...fetchOptions,
            method: 'POST',
            body: JSON.stringify({ old: oldPassword, new: newPassword })
        });
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.data)) passwords = data.data;
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

function containsBannedWord(password) {
    const lower = password.toLowerCase();
    return BANNED_WORDS.some(banned => lower.includes(banned));
}

function convertToAlphaNumeric(str) {
    let newString = "";
    for (let i = 0; i < str.length; i++) {
        newString += str.charCodeAt(i) - 96;
        newString += "/";
    }
    return newString;
}

loadPasswordsFromBackend();

export default async function infiniteUserMinigame() {
    if (quizzing) return;
    
    await loadPasswordsFromBackend();
    
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
    
    let quizWindow = document.createElement("div");
    quizWindow.style.cssText = `
        position: fixed;
        width: 55%; height: 55%;
        top: 22%; left: 22%;
        z-index: 10000;
        background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
        border: 2px solid #627eea;
        text-align: center;
        color: #627eea;
        font-family: "Courier New", monospace;
        border-radius: 10px;
        padding: 20px;
    `;
    quizWindow.id = "quizWindow";
    document.body.appendChild(quizWindow);
    
    let header = document.createElement("div");
    header.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;`;
    
    let title = document.createElement("div");
    title.textContent = "PASSWORD TERMINAL";
    title.style.cssText = `color: #627eea; font-size: 16px; font-weight: bold; letter-spacing: 2px;`;
    
    let closeBtn = document.createElement("button");
    closeBtn.innerText = "EXIT";
    closeBtn.style.cssText = `background: #600; color: #ccc; border: 1px solid #800; padding: 6px 15px; cursor: pointer; font-size: 15px; font-family: "Courier New", monospace;`;
    closeBtn.onclick = closeMinigame;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    quizWindow.appendChild(header);
    
    // Coin indicator
    let coinNote = document.createElement("div");
    coinNote.style.cssText = `color: #627eea; font-size: 13px; margin-bottom: 10px; padding: 5px; background: rgba(98,126,234,0.1); border-radius: 3px;`;
    coinNote.innerHTML = `Rewards: <strong>${COIN_NAME} (${COIN_SYMBOL})</strong>`;
    quizWindow.appendChild(coinNote);
    
    let globalNote = document.createElement("div");
    globalNote.style.cssText = `color: #a80; font-size: 13px; margin-bottom: 10px; padding: 5px; background: rgba(170, 136, 0, 0.1); border-radius: 3px;`;
    globalNote.textContent = "GLOBAL SYSTEM - Passwords shared between all users";
    quizWindow.appendChild(globalNote);
    
    let messageDiv = document.createElement("div");
    messageDiv.style.cssText = `color: #627eea; font-size: 17px; margin: 15px 0;`;
    messageDiv.innerHTML = `
        <div style="font-size: 15px; color: #888; margin-bottom: 10px;">Decode the password:</div>
        <div style="font-size: 20px; letter-spacing: 3px; color: #627eea;">${convertToAlphaNumeric(selectedPassword)}</div>
        <div style="font-size: 13px; color: #666; margin-top: 5px;">Hint: a=1, b=2, c=3...</div>
    `;
    quizWindow.appendChild(messageDiv);
    
    let typebox = document.createElement("div");
    typebox.innerText = ">";
    typebox.style.cssText = `
        width: 80%; margin: 15px auto;
        padding: 12px 15px;
        border: 2px solid #314177;
        background: #000;
        color: #627eea;
        font-family: "Courier New", monospace;
        font-size: 18px;
        text-align: left;
        border-radius: 5px;
    `;
    quizWindow.appendChild(typebox);
    
    let instructions = document.createElement("div");
    instructions.style.cssText = `color: #666; font-size: 17px; margin-bottom: 10px;`;
    instructions.textContent = "Type the decoded password and press Enter.";
    quizWindow.appendChild(instructions);
    
    let bottomBar = document.createElement("div");
    bottomBar.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-top: 10px;`;
    
    let autoCompleteBtn = document.createElement("button");
    autoCompleteBtn.textContent = "[DEV] Auto-Complete";
    autoCompleteBtn.style.cssText = `background: #333; color: #666; border: 1px solid #444; padding: 5px 10px; cursor: pointer; font-size: 13px; font-family: "Courier New", monospace;`;
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
    
    let pwCount = document.createElement("div");
    pwCount.style.cssText = `color: #444; font-size: 13px;`;
    pwCount.textContent = `Global passwords: ${passwords.length}/${MAX_PASSWORDS}`;
    
    bottomBar.appendChild(autoCompleteBtn);
    bottomBar.appendChild(pwCount);
    quizWindow.appendChild(bottomBar);
    
    let isFirstCompletion = false;
    try {
        isFirstCompletion = !(await isMinigameCompleted(MINIGAME_NAME));
        console.log('[InfiniteUser] First completion:', isFirstCompletion);
    } catch (e) {}
    
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
        const rotated = await rotatePasswordOnBackend(selectedPassword, newPassword);
        
        if (!rotated) {
            const idx = passwords.indexOf(selectedPassword);
            if (idx > -1) passwords.splice(idx, 1);
            if (!passwords.includes(newPassword)) passwords.push(newPassword);
            while (passwords.length > MAX_PASSWORDS) passwords.shift();
        }
        
        // Calculate reward
        const baseReward = 0.0001 + Math.random() * 0.0001; // Small ETH amount
        const bonus = isFirstCompletion ? 0.0002 : 0;
        const totalReward = baseReward + bonus;
        const displayReward = totalReward.toFixed(6);
        
        // *** KEY CHANGE: Use rewardMinigame for Ethereum ***
        await rewardMinigame(MINIGAME_NAME, totalReward);
        
        if (isFirstCompletion) {
            try {
                await completeMinigame(MINIGAME_NAME);
                await addInventoryItem({
                    name: 'Code Scrap: Infinite User',
                    found_at: MINIGAME_NAME,
                    timestamp: new Date().toISOString()
                });
            } catch (e) {}
        }
        
        if (isFirstCompletion) {
            messageDiv.innerHTML = `
                <div style="font-size: 16px; color: #627eea;">CODE FRAGMENT RECOVERED</div>
                <div style="font-size: 15px; margin-top: 10px; color: #888;">Found the password list behind the keyboard.</div>
                <div style="margin-top: 15px;">
                    <img src="${baseurl}/images/DBS2/codescrapPassword.png" style="max-width: 70px; border: 1px solid #627eea; border-radius: 4px;" onerror="this.style.display='none'">
                </div>
                <div style="font-size: 17px; margin-top: 10px; color: #627eea;">+${displayReward} ${COIN_SYMBOL}</div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div style="font-size: 16px; color: #627eea;">PASSWORD UPDATED</div>
                <div style="font-size: 15px; margin-top: 10px; color: #888;">"${newPassword}" added to the global system.</div>
                <div style="font-size: 17px; margin-top: 5px; color: #a80;">Other players may now have to decrypt your password!</div>
                <div style="font-size: 17px; margin-top: 15px; color: #627eea;">+${displayReward} ${COIN_NAME}</div>
            `;
        }
        
        typebox.style.display = 'none';
        instructions.style.display = 'none';
        bottomBar.style.display = 'none';
        globalNote.style.display = 'none';
        coinNote.style.display = 'none';
        
        setTimeout(() => {
            closeMinigame();
            try {
                Prompt.showDialoguePopup('System', `+${displayReward} ${COIN_NAME} earned!`);
            } catch(e) {}
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
                if (input.length < 4) {
                    typebox.style.borderColor = "#f00";
                    instructions.textContent = "Password must be at least 4 characters.";
                    instructions.style.color = "#f00";
                    setTimeout(() => {
                        typebox.style.borderColor = "#314177";
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
                        typebox.style.borderColor = "#314177";
                        instructions.textContent = "Type a new password (4+ letters, no bad words).";
                        instructions.style.color = "#666";
                    }, 1500);
                    return;
                }
                
                if (passwords.includes(input)) {
                    typebox.style.borderColor = "#f00";
                    instructions.textContent = "Password already exists. Choose another.";
                    instructions.style.color = "#f00";
                    setTimeout(() => {
                        typebox.style.borderColor = "#314177";
                        instructions.textContent = "Type a new password (4+ letters, no bad words).";
                        instructions.style.color = "#666";
                    }, 1500);
                    return;
                }
                
                completeWithReward(input);
            } else {
                if (input === selectedPassword) {
                    messageDiv.innerHTML = `
                        <div style="color: #627eea; font-size: 16px;">ACCESS GRANTED</div>
                        <div style="color: #888; font-size: 15px; margin-top: 10px;">Now create a replacement password for the global system.</div>
                        <div style="color: #a80; font-size: 13px; margin-top: 5px;">Your password will be shared with other players!</div>
                    `;
                    typebox.innerText = ">";
                    creatingNew = true;
                    instructions.textContent = "Type a new password (4+ letters, no bad words).";
                } else {
                    typebox.style.borderColor = "#f00";
                    typebox.innerText = ">DENIED";
                    setTimeout(() => {
                        typebox.innerText = ">";
                        typebox.style.borderColor = "#314177";
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