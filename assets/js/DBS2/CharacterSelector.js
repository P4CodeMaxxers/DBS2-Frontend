/**
 * CharacterSelector.js
 * UI for viewing and equipping purchased character avatars
 * Integrates with Inventory system and Player sprite switching
 */

import { getInventory, equipCharacter } from './StatsManager.js';
import Player from './Player.js';
import GameEnv from './GameEnv.js';

// Available character sprite data
const CHARACTER_SPRITES = {
    chillguy: {
        id: 'chillguy',
        name: 'Chill Guy',
        src: '/images/DBS2/chillguy.png',
        pixels: { height: 128, width: 128 },
        orientation: { rows: 4, columns: 4 },
        down: { row: 0, start: 0, columns: 4 },
        left: { row: 2, start: 0, columns: 4 },
        right: { row: 1, start: 0, columns: 4 },
        up: { row: 3, start: 0, columns: 4 },
        SCALE_FACTOR: 5,
        default: true
    },
    'character_pink_princess': {
        id: 'character_pink_princess',
        name: 'Pink Princess',
        src: '/images/DBS2/pink-princess.png',
        pixels: { height: 128, width: 128 },
        orientation: { rows: 4, columns: 4 },
        down: { row: 0, start: 0, columns: 4 },
        left: { row: 2, start: 0, columns: 4 },
        right: { row: 1, start: 0, columns: 4 },
        up: { row: 3, start: 0, columns: 4 },
        SCALE_FACTOR: 5
    },
    'character_yellow_princess': {
        id: 'character_yellow_princess',
        name: 'Yellow Princess',
        src: '/images/DBS2/yellow-princess.png',
        pixels: { height: 128, width: 128 },
        orientation: { rows: 4, columns: 4 },
        down: { row: 0, start: 0, columns: 4 },
        left: { row: 2, start: 0, columns: 4 },
        right: { row: 1, start: 0, columns: 4 },
        up: { row: 3, start: 0, columns: 4 },
        SCALE_FACTOR: 5
    }
};

let selectorOverlay = null;
let currentInventory = [];

/**
 * Show the character selector UI
 */
export async function showCharacterSelector() {
    if (selectorOverlay) {
        selectorOverlay.remove();
    }
    
    try {
        currentInventory = await getInventory();
    } catch (e) {
        console.error('[CharacterSelector] Failed to load inventory:', e);
        currentInventory = [];
    }
    
    createSelectorUI();
}

/**
 * Create the character selector overlay UI
 */
function createSelectorUI() {
    const baseurl = document.body.getAttribute('data-baseurl') || '';
    
    selectorOverlay = document.createElement('div');
    selectorOverlay.id = 'character-selector-overlay';
    selectorOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 16000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Courier New', monospace;
    `;
    
    const container = document.createElement('div');
    container.style.cssText = `
        background: linear-gradient(135deg, #1a0a2e 0%, #2e1a3e 100%);
        border: 3px solid #9d4edd;
        border-radius: 15px;
        padding: 30px;
        max-width: 800px;
        max-height: 90vh;
        width: 90%;
        overflow-y: auto;
        color: #eee;
        box-shadow: 0 0 50px rgba(157, 78, 221, 0.5);
    `;
    
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h1 style="color: #9d4edd; margin: 0; font-size: 28px; letter-spacing: 2px;">
                👤 CHARACTER SELECTOR
            </h1>
            <button id="selector-close-btn" style="
                background: #600;
                color: #ccc;
                border: 1px solid #800;
                padding: 10px 20px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                border-radius: 5px;
            ">CLOSE</button>
        </div>
        
        <div style="
            background: rgba(0,0,0,0.4);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 12px;
            color: #888;
            text-align: center;
        ">
            👕 Select a character to equip as your avatar
        </div>
        
        <div id="characters-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
        ">
            ${renderCharacters()}
        </div>
    `;
    
    selectorOverlay.appendChild(container);
    document.body.appendChild(selectorOverlay);
    
    // Close button handler
    document.getElementById('selector-close-btn').onclick = closeSelector;
    
    // Attach character card handlers
    attachCharacterHandlers();
}

/**
 * Render character cards
 */
function renderCharacters() {
    const baseurl = document.body.getAttribute('data-baseurl') || '';
    let html = '';
    
    // Get owned characters from inventory
    const ownedCharacters = currentInventory
        .filter(item => item.type === 'character' || item.id === 'chillguy')
        .map(item => item.id);
    
    // Always include default character
    if (!ownedCharacters.includes('chillguy')) {
        ownedCharacters.push('chillguy');
    }
    
    // Get currently equipped character
    let equippedCharacter = localStorage.getItem('equippedCharacter') || 'chillguy';
    
    for (const charId of ownedCharacters) {
        const char = CHARACTER_SPRITES[charId];
        if (!char) continue;
        
        const isEquipped = charId === equippedCharacter;
        
        html += `
            <div class="character-card" data-char-id="${charId}" style="
                background: rgba(0,0,0,0.4);
                border: 2px solid ${isEquipped ? '#0f0' : '#9d4edd'};
                border-radius: 10px;
                padding: 15px;
                cursor: pointer;
                opacity: 1;
                transition: all 0.2s;
                position: relative;
            ">
                ${isEquipped ? `
                    <div style="
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: #0f0;
                        color: #000;
                        padding: 5px 10px;
                        border-radius: 5px;
                        font-size: 10px;
                        font-weight: bold;
                    ">EQUIPPED</div>
                ` : ''}
                
                <div style="text-align: center; margin-bottom: 10px;">
                    <img src="${baseurl}${char.src}" 
                         style="max-width: 100px; max-height: 100px; border: 1px solid #9d4edd; border-radius: 5px; image-rendering: pixelated;"
                         onerror="this.style.display='none';">
                </div>
                
                <h3 style="color: #9d4edd; margin: 10px 0 5px 0; font-size: 16px; text-align: center;">
                    ${char.name}
                </h3>
                
                <button class="equip-char-btn" 
                        data-char-id="${charId}"
                        style="
                    width: 100%;
                    padding: 10px;
                    background: ${isEquipped ? '#666' : '#9d4edd'};
                    color: ${isEquipped ? '#999' : '#000'};
                    border: none;
                    border-radius: 5px;
                    cursor: ${isEquipped ? 'not-allowed' : 'pointer'};
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: bold;
                    transition: all 0.2s;
                    margin-top: 10px;
                " ${isEquipped ? 'disabled' : ''}>
                    ${isEquipped ? 'CURRENTLY EQUIPPED' : 'EQUIP'}
                </button>
            </div>
        `;
    }
    
    if (html === '') {
        return '<div style="grid-column: 1 / -1; text-align: center; color: #666; padding: 40px;">No characters available. Purchase characters from the shop!</div>';
    }
    
    return html;
}

/**
 * Attach click handlers to character cards
 */
function attachCharacterHandlers() {
    document.querySelectorAll('.character-card').forEach(card => {
        const charId = card.dataset.charId;
        
        card.onmouseenter = () => {
            if (!card.querySelector('.equip-char-btn')?.disabled) {
                card.style.transform = 'scale(1.05)';
                card.style.borderColor = '#c77dff';
            }
        };
        
        card.onmouseleave = () => {
            card.style.transform = 'scale(1)';
            const isEquipped = card.querySelector('.equip-char-btn')?.disabled;
            card.style.borderColor = isEquipped ? '#0f0' : '#9d4edd';
        };
    });
    
    document.querySelectorAll('.equip-char-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const charId = btn.dataset.charId;
            await handleEquip(charId);
        };
    });
}

/**
 * Handle character equipping
 */
async function handleEquip(charId) {
    const char = CHARACTER_SPRITES[charId];
    if (!char) return;
    
    try {
        const result = await equipCharacter(charId);
        
        if (result.success) {
            showMessage(`${char.name} equipped!`, 'success');
            
            setTimeout(() => {
                // Just reload - no need to hide first
                window.location.reload();
            }, 500);
        } else {
            showMessage(result.error || 'Failed to equip character!', 'error');
        }
    } catch (e) {
        console.error('[CharacterSelector] Equip error:', e);
        showMessage('Failed to equip character!', 'error');
    }
}

/**
 * Update the player's sprite in the game
 */
function updatePlayerSprite(charData) {
    // Find the player object in GameEnv
    const player = GameEnv.gameObjects.find(obj => obj.id === 'player');
    
    if (!player) {
        console.error('[CharacterSelector] Player object not found!');
        return;
    }
    
    const baseurl = document.body.getAttribute('data-baseurl') || '';
    
    // Update player sprite properties
    player.spriteSheet.src = baseurl + charData.src;
    player.spriteSheet.onload = () => {
        console.log('[CharacterSelector] Player sprite updated to:', charData.name);
    };
    
    // Store the character ID on the player for persistence
    player.characterId = charData.id;
}

/**
 * Get the currently equipped character sprite data
 */
export function getEquippedCharacter() {
    const equippedId = localStorage.getItem('equippedCharacter') || 'chillguy';
    return CHARACTER_SPRITES[equippedId] || CHARACTER_SPRITES.chillguy;
}

/**
 * Show a message to the user
 */
function showMessage(message, type = 'info') {
    const existing = document.getElementById('character-selector-message');
    if (existing) existing.remove();
    
    const msgDiv = document.createElement('div');
    msgDiv.id = 'character-selector-message';
    msgDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${type === 'success' ? 'rgba(0, 200, 0, 0.95)' : type === 'error' ? 'rgba(200, 0, 0, 0.95)' : 'rgba(0, 100, 200, 0.95)'};
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        z-index: 20000;
        font-family: 'Courier New', monospace;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 6px 30px rgba(0,0,0,0.7);
        border: 2px solid ${type === 'success' ? 'rgba(0, 255, 0, 0.5)' : type === 'error' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 150, 255, 0.5)'};
        text-align: center;
        min-width: 300px;
    `;
    msgDiv.textContent = message;
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        msgDiv.style.transition = 'opacity 0.3s';
        msgDiv.style.opacity = '0';
        setTimeout(() => msgDiv.remove(), 300);
    }, 2000);
}

/**
 * Close the selector
 */
function closeSelector() {
    if (selectorOverlay) {
        selectorOverlay.remove();
        selectorOverlay = null;
    }
}

// Export for global access
window.CharacterSelector = {
    show: showCharacterSelector,
    close: closeSelector,
    getEquippedCharacter,
    CHARACTER_SPRITES
};

export default {
    showCharacterSelector,
    closeSelector,
    getEquippedCharacter,
    CHARACTER_SPRITES
};