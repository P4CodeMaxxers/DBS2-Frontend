/**
 * Inventory.js
 * Manages player inventory with backend sync and code scrap collection
 * 
 * STORY: IShowGreen once ran a legendary crypto mining rig he called "The Green Machine."
 * Years of neglect destroyed it - rats gnawed the cables, a flood ruined the drives,
 * a fire burned his backups, and he forgot his own passwords. Now he has trapped you
 * in his basement until you help him recover the fragments of his lost program.
 */

import { getInventory, addInventoryItem, getWallet, convertCoin, getPrices } from './StatsManager.js';

// Code scrap definitions - physical paper fragments with handwritten code
const CODE_SCRAPS = {
    crypto_miner: {
        id: 'crypto_miner',
        name: 'Mining Algorithm',
        icon: 'PAGE',
        image: 'codescrapCrypto.png',
        description: 'A crumpled page covered in dense handwritten code. The mining algorithm that powered The Green Machine. IShowGreen wrote it during a mass power outage when he couldnt use his computer. He typed it in later but lost the original page behind the terminal.',
        hint: 'Check behind the mining terminal.',
        storyFragment: '"I wrote the whole algorithm by hand during the blackout. Twelve pages. This was the most important one." - Journal Entry #47'
    },
    laundry: {
        id: 'laundry',
        name: 'Transaction Ledger',
        icon: 'PAGE',
        image: 'codescrapLaundry.png', 
        description: 'A soggy, barely legible page. The transaction validation formulas were written on this paper. IShowGreen left it in his pants pocket and threw them in the wash. The ink ran but the code is still readable if you squint.',
        hint: 'Something paper is stuck in the washing machine drum.',
        storyFragment: '"I keep important notes in my pockets. I also never check my pockets before doing laundry. You can see the problem." - Journal Entry #62'
    },
    whackarat: {
        id: 'whackarat',
        name: 'Security Keys',
        icon: 'PAGE',
        image: 'codescrapRats.png',
        description: 'A chewed and torn page with bite marks all over it. The security protocol keys were written here. IShowGreen hid it in a crack in the wall. The rats found it and shredded half of it for their nest. What remains is still usable.',
        hint: 'The rats took paper into the walls. Get it back.',
        storyFragment: '"I hid it where no one would look. The rats looked. They ate the corners but the important parts survived." - Journal Entry #78'
    },
    ash_trail: {
        id: 'ash_trail',
        name: 'Backup Documentation',
        icon: 'PAGE',
        image: 'codescrapPages.png',
        description: 'A charred page with burned edges. IShowGreen printed his backup codes and recovery keys on paper for safekeeping. A candle fell on the bookshelf. Most of the pages burned but this one only lost the margins.',
        hint: 'Trace the burned pages on the bookshelf.',
        storyFragment: '"Paper cant be hacked, I said. Paper is safe, I said. Paper burns, I learned." - Journal Entry #91'
    },
    infinite_user: {
        id: 'infinite_user',
        name: 'Master Password List',
        icon: 'PAGE',
        image: 'codescrapPassword.png',
        description: 'A faded page with a list of passwords and authentication codes. IShowGreen wrote them down so he wouldnt forget. Then he forgot where he put the paper. It was wedged behind the keyboard the whole time.',
        hint: 'The password terminal might have something stuck behind it.',
        storyFragment: '"I wrote down every password so I would never be locked out. Then I lost the paper. I was locked out for three months." - Journal Entry #103'
    }
};

const Inventory = {
    slots: 10,
    items: [],
    isOpen: false,
    isLoading: false,
    baseImagePath: '',
    owner: null,
    _keyListenerAdded: false,

    init(options = {}) {
        if (options.slots) this.slots = options.slots;
        
        const baseurl = document.body.getAttribute('data-baseurl') || '';
        this.baseImagePath = `${baseurl}/images/DBS2`;
        
        this.ensureStyles();
        this.renderButton();
        this.renderPanel();
        
        this.loadFromBackend().catch(e => {
            console.error('[Inventory] Background load failed:', e);
        });
        
        if (!this._keyListenerAdded) {
            this._keyListenerAdded = true;
            window.addEventListener('keydown', (e) => {
                if ((e.key === 'i' || e.key === 'I') && !window.minigameActive) {
                    this.toggle();
                }
            });
        }
        
        console.log('[Inventory] Initialized');
    },

    setOwner(owner) {
        this.owner = owner || null;
        if (this.owner) {
            this.owner.inventory = this.getItems();
        }
    },

    async loadFromBackend() {
        this.isLoading = true;
        this.updateLoadingState();
        
        try {
            const inventory = await getInventory();
            console.log('[Inventory] Loaded from backend:', inventory);
            
            this.items = [];
            if (Array.isArray(inventory) && inventory.length > 0) {
                for (const item of inventory) {
                    if (!item) continue;
                    
                    try {
                        const scrapInfo = this.getCodeScrapInfo(item);
                        if (scrapInfo) {
                            this.items.push({
                                ...scrapInfo,
                                raw: item
                            });
                        } else {
                            let name = 'Unknown Item';
                            if (typeof item === 'string') {
                                name = item;
                            } else if (typeof item.name === 'string') {
                                name = item.name;
                            } else if (item.name && typeof item.name.name === 'string') {
                                name = item.name.name;
                            } else if (item.item_name) {
                                name = item.item_name;
                            }
                            
                            this.items.push({
                                id: item.id || name || 'unknown',
                                name: name,
                                icon: 'ITEM',
                                description: item.description || `Found at: ${item.found_at || 'unknown'}`,
                                raw: item
                            });
                        }
                    } catch (parseError) {
                        console.warn('[Inventory] Failed to parse item:', item, parseError);
                    }
                }
            }
            
            this.refreshGrid();
            this.updateBadge();
            this.checkCodeScrapWinCondition();
            
        } catch (e) {
            console.error('[Inventory] Failed to load from backend:', e);
            this.items = [];
            this.refreshGrid();
        }
        
        this.isLoading = false;
        this.updateLoadingState();
    },

    getCodeScrapInfo(item) {
        if (!item) return null;
        
        let itemName = '';
        let foundAt = '';
        
        if (typeof item === 'string') {
            itemName = item.toLowerCase();
        } else if (typeof item.name === 'string') {
            itemName = item.name.toLowerCase();
        } else if (item.name && typeof item.name.name === 'string') {
            itemName = item.name.name.toLowerCase();
        } else if (item.item_name && typeof item.item_name === 'string') {
            itemName = item.item_name.toLowerCase();
        }
        
        if (typeof item.found_at === 'string') {
            foundAt = item.found_at.toLowerCase();
        } else if (item.name && typeof item.name.found_at === 'string') {
            foundAt = item.name.found_at.toLowerCase();
        }
        
        for (const [minigame, scrap] of Object.entries(CODE_SCRAPS)) {
            if (foundAt.includes(minigame) || 
                foundAt.includes(minigame.replace('_', '')) ||
                itemName.includes(minigame) ||
                itemName.includes(minigame.replace('_', ' ')) ||
                itemName.includes(scrap.name.toLowerCase())) {
                return {
                    ...scrap,
                    minigame: minigame
                };
            }
        }
        
        if (itemName.includes('code scrap') || itemName.includes('codescrap')) {
            if (itemName.includes('crypto') || itemName.includes('miner') || itemName.includes('bitcoin') || itemName.includes('algorithm')) {
                return { ...CODE_SCRAPS.crypto_miner, minigame: 'crypto_miner' };
            }
            if (itemName.includes('laundry') || itemName.includes('wash') || itemName.includes('transaction') || itemName.includes('validator')) {
                return { ...CODE_SCRAPS.laundry, minigame: 'laundry' };
            }
            if (itemName.includes('rat') || itemName.includes('whack') || itemName.includes('security')) {
                return { ...CODE_SCRAPS.whackarat, minigame: 'whackarat' };
            }
            if (itemName.includes('ash') || itemName.includes('trail') || itemName.includes('book') || itemName.includes('page') || itemName.includes('backup')) {
                return { ...CODE_SCRAPS.ash_trail, minigame: 'ash_trail' };
            }
            if (itemName.includes('infinite') || itemName.includes('user') || itemName.includes('password') || itemName.includes('auth')) {
                return { ...CODE_SCRAPS.infinite_user, minigame: 'infinite_user' };
            }
        }
        
        return null;
    },

    hasAllCodeScraps() {
        const collected = this.getCollectedMinigames();
        return collected.size >= 5;
    },

    getCollectedMinigames() {
        const collected = new Set();
        for (const item of this.items) {
            if (item.minigame) {
                collected.add(item.minigame);
            }
        }
        return collected;
    },

    checkCodeScrapWinCondition() {
        if (this.hasAllCodeScraps()) {
            window.dispatchEvent(new CustomEvent('allCodeScrapsCollected', {
                detail: { items: this.items }
            }));
            console.log('[Inventory] All pages found. Player can present to IShowGreen.');
        }
    },

    ensureStyles() {
        if (document.getElementById('inventory-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'inventory-styles';
        style.textContent = `
            #inventory-btn {
                position: fixed;
                bottom: 80px;
                right: 20px;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #0a5;
                border-radius: 10px;
                cursor: pointer;
                z-index: 9998;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
                color: #0a5;
                font-family: 'Courier New', monospace;
                box-shadow: 0 4px 15px rgba(0, 170, 85, 0.3);
                transition: all 0.3s ease;
            }
            #inventory-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 170, 85, 0.5);
                border-color: #0f0;
                color: #0f0;
            }
            #inventory-btn .badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #a00;
                color: white;
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 10px;
                font-weight: bold;
            }
            #inventory-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
                border: 2px solid #0a5;
                border-radius: 10px;
                padding: 20px;
                z-index: 9999;
                min-width: 450px;
                max-width: 95vw;
                box-shadow: 0 0 30px rgba(0, 100, 50, 0.4);
                font-family: 'Courier New', monospace;
                display: none;
            }
            #inventory-panel.open {
                display: block;
                animation: inventoryOpen 0.2s ease;
            }
            @keyframes inventoryOpen {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            #inventory-panel h2 {
                color: #0a5;
                margin: 0 0 5px 0;
                text-align: center;
                font-size: 18px;
                letter-spacing: 2px;
            }
            .inventory-subtitle {
                color: #666;
                font-size: 11px;
                text-align: center;
                margin-bottom: 15px;
            }
            .inventory-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 8px;
                margin-bottom: 15px;
            }
            .inventory-slot {
                aspect-ratio: 1;
                background: rgba(0, 40, 20, 0.4);
                border: 2px solid #052;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
                min-height: 70px;
            }
            .inventory-slot:hover {
                border-color: #0a5;
                background: rgba(0, 80, 40, 0.4);
            }
            .inventory-slot.collected {
                border-color: #0a5;
                box-shadow: inset 0 0 15px rgba(0, 170, 85, 0.3);
            }
            .inventory-slot.empty {
                opacity: 0.5;
            }
            .inventory-slot .slot-icon {
                font-size: 10px;
                color: #0a5;
                font-weight: bold;
            }
            .inventory-slot .slot-image {
                width: 80%;
                height: 80%;
                object-fit: contain;
                image-rendering: pixelated;
            }
            .inventory-slot .slot-unknown {
                font-size: 24px;
                color: #333;
            }
            .inventory-progress {
                text-align: center;
                padding: 12px;
                background: rgba(0, 40, 20, 0.4);
                border-radius: 6px;
                margin-bottom: 15px;
                border: 1px solid #052;
            }
            .inventory-progress-title {
                color: #0a5;
                font-size: 12px;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .inventory-progress-icons {
                font-size: 11px;
                letter-spacing: 3px;
                color: #0a5;
                font-weight: bold;
            }
            .inventory-progress-text {
                color: #888;
                font-size: 12px;
                margin-top: 8px;
            }
            .inventory-story-hint {
                background: rgba(80, 60, 0, 0.2);
                border: 1px solid #640;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 15px;
                text-align: center;
            }
            .inventory-story-hint p {
                color: #a80;
                font-size: 11px;
                margin: 0;
                line-height: 1.5;
            }
            .inventory-close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: #600;
                color: #ccc;
                border: 1px solid #800;
                padding: 4px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-family: 'Courier New', monospace;
            }
            .inventory-close:hover {
                background: #800;
            }
            .inventory-loading {
                text-align: center;
                padding: 40px;
                color: #0a5;
                font-size: 12px;
            }
            .item-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .item-modal-content {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #0a5;
                border-radius: 10px;
                padding: 25px;
                max-width: 400px;
                text-align: center;
            }
            .item-modal-content h3 {
                color: #0a5;
                margin: 0 0 15px 0;
                font-size: 16px;
                letter-spacing: 1px;
            }
            .item-modal-content img {
                max-width: 120px;
                margin: 15px auto;
                display: block;
                border: 1px solid #0a5;
                border-radius: 6px;
                image-rendering: pixelated;
            }
            .item-modal-content p {
                color: #999;
                font-size: 12px;
                line-height: 1.6;
                margin: 10px 0;
            }
            .item-modal-content .story-fragment {
                color: #a80;
                font-style: italic;
                font-size: 11px;
                background: rgba(80, 60, 0, 0.2);
                padding: 12px;
                border-radius: 4px;
                margin-top: 15px;
                border-left: 3px solid #640;
                text-align: left;
            }
            .item-modal-content .hint {
                color: #088;
                font-size: 11px;
            }
            .item-modal-content button {
                margin-top: 15px;
                background: #052;
                color: #0a5;
                border: 1px solid #0a5;
                padding: 8px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 12px;
            }
            .item-modal-content button:hover {
                background: #0a5;
                color: #000;
            }
            
            /* Wallet Section Styles */
            .wallet-section {
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #0a5;
            }
            .wallet-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            .wallet-title {
                color: #f7931a;
                font-size: 14px;
                font-weight: bold;
            }
            .wallet-total {
                color: #0f0;
                font-size: 14px;
                font-weight: bold;
            }
            .wallet-coins {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                margin-bottom: 10px;
            }
            .wallet-coin {
                background: rgba(0, 40, 20, 0.4);
                border: 1px solid #052;
                border-radius: 6px;
                padding: 8px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
            }
            .wallet-coin:hover {
                border-color: #0a5;
                background: rgba(0, 80, 40, 0.4);
            }
            .wallet-coin.selected {
                border-color: #f7931a;
                background: rgba(100, 80, 20, 0.4);
            }
            .wallet-coin-icon {
                font-size: 18px;
                display: block;
            }
            .wallet-coin-balance {
                color: #fff;
                font-size: 11px;
                margin-top: 3px;
            }
            .wallet-coin-usd {
                color: #888;
                font-size: 9px;
            }
            .wallet-coin-change {
                font-size: 9px;
            }
            .wallet-coin-change.up { color: #0f0; }
            .wallet-coin-change.down { color: #f66; }
            .wallet-convert {
                background: rgba(100, 80, 20, 0.2);
                border: 1px solid #640;
                border-radius: 6px;
                padding: 10px;
                margin-top: 10px;
            }
            .convert-title {
                color: #f7931a;
                font-size: 11px;
                margin-bottom: 8px;
                text-align: center;
            }
            .convert-select, .convert-input {
                width: 100%;
                background: #111;
                border: 1px solid #333;
                color: #fff;
                padding: 6px 8px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                margin-bottom: 6px;
            }
            .convert-btn {
                width: 100%;
                background: #640;
                color: #fa0;
                border: 1px solid #a80;
                padding: 8px;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                transition: all 0.2s;
            }
            .convert-btn:hover {
                background: #a80;
                color: #000;
            }
            .convert-btn:disabled {
                background: #333;
                color: #666;
                cursor: not-allowed;
            }
            .convert-result {
                margin-top: 8px;
                font-size: 10px;
                text-align: center;
                min-height: 16px;
            }
            .convert-result.success { color: #0f0; }
            .convert-result.error { color: #f66; }
        `;
        document.head.appendChild(style);
    },

    renderButton() {
        if (document.getElementById('inventory-btn')) return;
        
        const btn = document.createElement('div');
        btn.id = 'inventory-btn';
        btn.innerHTML = 'PAGES<span class="badge" style="display:none">0</span>';
        btn.title = 'Code Pages [I]';
        btn.onclick = () => this.toggle();
        document.body.appendChild(btn);
    },

    renderPanel() {
        if (document.getElementById('inventory-panel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'inventory-panel';
        panel.innerHTML = `
            <button class="inventory-close" onclick="Inventory.close()">CLOSE</button>
            <h2>THE GREEN MACHINE</h2>
            <div class="inventory-subtitle">Recovery Status</div>
            
            <div class="inventory-story-hint">
                <p>Recover all five code fragments and present them to IShowGreen.</p>
                <p>He may let you leave. Or you can earn 500 crypto to buy your way out.</p>
            </div>
            
            <div class="inventory-progress">
                <div class="inventory-progress-title">CODE FRAGMENTS</div>
                <div class="inventory-progress-icons" id="progress-icons">[X] [X] [ ] [ ] [ ]</div>
                <div class="inventory-progress-text" id="progress-text">0 of 5 recovered</div>
            </div>
            
            <div class="inventory-grid" id="inventory-grid"></div>
            
            <!-- WALLET SECTION -->
            <div class="wallet-section" id="wallet-section">
                <div class="wallet-header">
                    <span class="wallet-title">💰 WALLET</span>
                    <span class="wallet-total" id="wallet-total">$0.00</span>
                </div>
                <div class="wallet-coins" id="wallet-coins">
                    <div style="color: #666; text-align: center; padding: 10px;">Loading wallet...</div>
                </div>
                <div class="wallet-convert" id="wallet-convert" style="display: none;">
                    <div class="convert-title">Convert to Satoshis</div>
                    <select id="convert-coin" class="convert-select">
                        <option value="">Select coin...</option>
                    </select>
                    <input type="number" id="convert-amount" class="convert-input" placeholder="Amount" step="0.0001" min="0">
                    <button id="convert-btn" class="convert-btn" onclick="Inventory.convertToSats()">CONVERT (5% fee)</button>
                    <div id="convert-result" class="convert-result"></div>
                </div>
            </div>
            
            <div class="inventory-loading" id="inventory-loading" style="display:none">
                Loading...
            </div>
        `;
        document.body.appendChild(panel);
        
        this.refreshGrid();
    },

    updateBadge() {
        const badge = document.querySelector('#inventory-btn .badge');
        if (badge) {
            const count = this.getCodeScrapCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
            
            if (count >= 5) {
                badge.style.background = '#0a5';
                badge.style.color = '#000';
            }
        }
    },

    refreshGrid() {
        const grid = document.getElementById('inventory-grid');
        if (!grid) return;
        
        const collected = this.getCollectedMinigames();
        
        let html = '';
        for (const [minigame, scrap] of Object.entries(CODE_SCRAPS)) {
            const isCollected = collected.has(minigame);
            html += `
                <div class="inventory-slot ${isCollected ? 'collected' : 'empty'}" 
                     onclick="Inventory.showItemDetail('${minigame}')"
                     title="${isCollected ? scrap.name : 'Unknown'}">
                    ${isCollected 
                        ? `<img class="slot-image" src="${this.baseImagePath}/${scrap.image}" alt="${scrap.name}" onerror="this.outerHTML='<span class=\\'slot-icon\\'>${scrap.icon}</span>'">`
                        : '<span class="slot-unknown">?</span>'
                    }
                </div>
            `;
        }
        
        grid.innerHTML = html;
        this.updateProgress(collected);
        this.updateBadge();
    },

    updateProgress(collected) {
        const icons = document.getElementById('progress-icons');
        const text = document.getElementById('progress-text');
        
        if (icons) {
            const order = ['crypto_miner', 'laundry', 'whackarat', 'ash_trail', 'infinite_user'];
            icons.innerHTML = order.map(m => {
                return collected.has(m) ? '[X]' : '[ ]';
            }).join(' ');
        }
        
        if (text) {
            const count = collected.size;
            if (count >= 5) {
                text.innerHTML = '<span style="color:#0a5">All pages found. Bring them to IShowGreen.</span>';
            } else {
                text.textContent = `${count} of 5 found`;
            }
        }
    },

    showItemDetail(minigame) {
        const scrap = CODE_SCRAPS[minigame];
        if (!scrap) return;
        
        const collected = this.getCollectedMinigames();
        const isCollected = collected.has(minigame);
        
        const modal = document.createElement('div');
        modal.className = 'item-modal';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        
        modal.innerHTML = `
            <div class="item-modal-content">
                <h3>${scrap.name.toUpperCase()}</h3>
                ${isCollected 
                    ? `<img src="${this.baseImagePath}/${scrap.image}" alt="${scrap.name}" onerror="this.style.display='none'">`
                    : '<div style="font-size: 48px; margin: 20px 0; color: #333;">?</div>'
                }
                <p>${isCollected ? scrap.description : 'Page not yet found.'}</p>
                ${isCollected 
                    ? `<div class="story-fragment">${scrap.storyFragment}</div>`
                    : `<p class="hint">${scrap.hint}</p>`
                }
                <button onclick="this.closest('.item-modal').remove()">CLOSE</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    },

    updateLoadingState() {
        const loading = document.getElementById('inventory-loading');
        const grid = document.getElementById('inventory-grid');
        
        if (loading) loading.style.display = this.isLoading ? 'block' : 'none';
        if (grid) grid.style.display = this.isLoading ? 'none' : 'grid';
    },

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    open() {
        const panel = document.getElementById('inventory-panel');
        if (panel) {
            panel.classList.add('open');
            this.isOpen = true;
            this.loadFromBackend();
            this.loadWallet();
        }
    },

    close() {
        const panel = document.getElementById('inventory-panel');
        if (panel) {
            panel.classList.remove('open');
            this.isOpen = false;
        }
    },

    getItems() {
        return this.items;
    },

    getCodeScrapCount() {
        return this.getCollectedMinigames().size;
    },

    // ==================== WALLET METHODS ====================
    
    walletData: null,
    pricesData: null,
    selectedCoin: null,

    COIN_CONFIG: {
        satoshis: { symbol: 'SATS', icon: '₿', color: '#f7931a', decimals: 0 },
        bitcoin: { symbol: 'BTC', icon: '₿', color: '#f7931a', decimals: 8 },
        ethereum: { symbol: 'ETH', icon: 'Ξ', color: '#627eea', decimals: 6 },
        solana: { symbol: 'SOL', icon: '◎', color: '#00ffa3', decimals: 4 },
        cardano: { symbol: 'ADA', icon: '₳', color: '#0033ad', decimals: 2 },
        dogecoin: { symbol: 'DOGE', icon: 'Ð', color: '#c2a633', decimals: 2 }
    },

    async loadWallet() {
        try {
            const [walletResult, pricesResult] = await Promise.all([
                getWallet(),
                getPrices()
            ]);
            
            this.walletData = walletResult;
            this.pricesData = pricesResult?.prices || {};
            
            this.refreshWalletDisplay();
        } catch (e) {
            console.log('[Inventory] Wallet load failed:', e);
            const coinsEl = document.getElementById('wallet-coins');
            if (coinsEl) {
                coinsEl.innerHTML = '<div style="color: #f66; text-align: center; padding: 10px;">Failed to load wallet</div>';
            }
        }
    },

    refreshWalletDisplay() {
        const coinsEl = document.getElementById('wallet-coins');
        const totalEl = document.getElementById('wallet-total');
        const convertSection = document.getElementById('wallet-convert');
        const convertSelect = document.getElementById('convert-coin');
        
        if (!coinsEl || !this.walletData) return;
        
        const wallet = this.walletData.raw_balances || {};
        const totalUsd = this.walletData.total_usd || 0;
        
        if (totalEl) {
            totalEl.textContent = `$${totalUsd.toFixed(2)}`;
        }
        
        let html = '';
        let hasConvertibleCoins = false;
        let selectOptions = '<option value="">Select coin...</option>';
        
        for (const [coinId, config] of Object.entries(this.COIN_CONFIG)) {
            const balance = wallet[coinId] || 0;
            const priceInfo = this.pricesData[coinId] || {};
            const usdValue = balance * (priceInfo.price_usd || 0);
            const change = priceInfo.change_24h || 0;
            
            const changeClass = change >= 0 ? 'up' : 'down';
            const changeSymbol = change >= 0 ? '▲' : '▼';
            const isSelected = this.selectedCoin === coinId;
            
            html += `
                <div class="wallet-coin ${isSelected ? 'selected' : ''}" 
                     onclick="Inventory.selectCoin('${coinId}')"
                     title="${config.symbol}: ${this.formatBalance(balance, config.decimals)}">
                    <span class="wallet-coin-icon" style="color: ${config.color}">${config.icon}</span>
                    <div class="wallet-coin-balance">${this.formatBalance(balance, config.decimals)}</div>
                    <div class="wallet-coin-usd">$${usdValue.toFixed(2)}</div>
                    <div class="wallet-coin-change ${changeClass}">${changeSymbol} ${Math.abs(change).toFixed(1)}%</div>
                </div>
            `;
            
            // Add to select if has balance and not satoshis
            if (balance > 0 && coinId !== 'satoshis') {
                hasConvertibleCoins = true;
                selectOptions += `<option value="${coinId}">${config.symbol} (${this.formatBalance(balance, config.decimals)})</option>`;
            }
        }
        
        coinsEl.innerHTML = html;
        
        // Show/hide convert section
        if (convertSection) {
            convertSection.style.display = hasConvertibleCoins ? 'block' : 'none';
        }
        if (convertSelect) {
            convertSelect.innerHTML = selectOptions;
        }
    },

    formatBalance(balance, decimals) {
        if (decimals === 0) {
            return balance.toLocaleString();
        }
        return balance.toFixed(Math.min(decimals, 4));
    },

    selectCoin(coinId) {
        this.selectedCoin = coinId;
        
        // Update visual selection
        document.querySelectorAll('.wallet-coin').forEach(el => {
            el.classList.remove('selected');
        });
        event.currentTarget?.classList.add('selected');
        
        // If not satoshis, populate convert fields
        if (coinId !== 'satoshis') {
            const select = document.getElementById('convert-coin');
            const amountInput = document.getElementById('convert-amount');
            
            if (select) {
                select.value = coinId;
            }
            if (amountInput && this.walletData?.raw_balances) {
                amountInput.value = this.walletData.raw_balances[coinId] || '';
            }
        }
    },

    async convertToSats() {
        const coinSelect = document.getElementById('convert-coin');
        const amountInput = document.getElementById('convert-amount');
        const resultDiv = document.getElementById('convert-result');
        const btn = document.getElementById('convert-btn');
        
        const coinId = coinSelect?.value;
        const amount = parseFloat(amountInput?.value || 0);
        
        if (!coinId) {
            if (resultDiv) {
                resultDiv.className = 'convert-result error';
                resultDiv.textContent = 'Select a coin to convert';
            }
            return;
        }
        
        if (amount <= 0) {
            if (resultDiv) {
                resultDiv.className = 'convert-result error';
                resultDiv.textContent = 'Enter an amount';
            }
            return;
        }
        
        // Check balance
        const balance = this.walletData?.raw_balances?.[coinId] || 0;
        if (amount > balance) {
            if (resultDiv) {
                resultDiv.className = 'convert-result error';
                resultDiv.textContent = 'Insufficient balance';
            }
            return;
        }
        
        // Disable button
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Converting...';
        }
        if (resultDiv) {
            resultDiv.className = 'convert-result';
            resultDiv.textContent = '';
        }
        
        try {
            const result = await convertCoin(coinId, 'satoshis', amount);
            
            if (result && result.success) {
                if (resultDiv) {
                    resultDiv.className = 'convert-result success';
                    resultDiv.textContent = `✓ Converted to ${result.to_amount.toLocaleString()} sats`;
                }
                
                // Refresh wallet
                await this.loadWallet();
                
                // Clear inputs
                if (amountInput) amountInput.value = '';
                if (coinSelect) coinSelect.value = '';
                
            } else {
                throw new Error(result?.error || 'Conversion failed');
            }
            
        } catch (e) {
            console.error('[Inventory] Convert error:', e);
            if (resultDiv) {
                resultDiv.className = 'convert-result error';
                resultDiv.textContent = e.message || 'Conversion failed';
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'CONVERT (5% fee)';
            }
        }
    }
};

window.Inventory = Inventory;

export default Inventory;