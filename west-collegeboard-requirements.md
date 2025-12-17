---
title: "West's Minigame Collegeboard Requirements"
permalink: "/west-collegeboard-requirements"
---

# Collegeboard Requirement Review for West's Minigame: The Infinite User Game
Here, I'll explain how my minigame, The Infinite User Game, in our group project, Discord Basement Simulator 2, meets the AP CSP requirements.

## Instructions for Input
The password minigame detects player keypresses so that the user can type the decoded password. Here's the detection code:
```
...
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
...
window.addEventListener("keydown", keyHandler, true);
```
## Collection Data Types and Backend Integration
Various aspects of the game use collection data types, such as Javascript arrays and Python lists. For instance, a JSON file stored in the backend gets pulled into the frontend by the Javascript code and gets stored in an array for random picking in the game. Here is some of the code that controls that:
```
...
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
...
const selectedIndex = Math.floor(Math.random() * passwords.length);
...
```