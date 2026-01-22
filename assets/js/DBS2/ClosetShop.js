/**
 * ClosetShop.js
 * Shop UI for purchasing code scraps, characters, and cosmetic items
 * Players spend different types of crypto (NOT satoshis) to buy items
 */

import { getWallet, purchaseShopItem, getPrices } from './StatsManager.js';
import { getCoinInfo } from './WalletDisplay.js';
import { addInventoryItem } from './StatsManager.js';

// Shop item definitions
const SHOP_ITEMS = {
    // Code Scraps (purchasable for progression)
    code_scrap_crypto_miner: {
        id: 'code_scrap_crypto_miner',
        name: 'Mining Algorithm Code Scrap',
        type: 'code_scrap',
        category: 'progression',
        image: 'codescrapCrypto.png',
        price: { coin: 'ethereum', amount: 0.001 },
        description: 'A crumpled page covered in dense handwritten code. The mining algorithm that powered The Green Machine.',
        unlockMessage: 'Code scrap added to inventory!'
    },
    code_scrap_laundry: {
        id: 'code_scrap_laundry',
        name: 'Transaction Ledger Code Scrap',
        type: 'code_scrap',
        category: 'progression',
        image: 'codescrapLaundry.png',
        price: { coin: 'cardano', amount: 50 },
        description: 'A soggy, barely legible page with transaction validation formulas.',
        unlockMessage: 'Code scrap added to inventory!'
    },
    code_scrap_whackarat: {
        id: 'code_scrap_whackarat',
        name: 'Security Keys Code Scrap',
        type: 'code_scrap',
        category: 'progression',
        image: 'codescrapRats.png',
        price: { coin: 'dogecoin', amount: 100 },
        description: 'A chewed and torn page with bite marks. Security protocol keys written here.',
        unlockMessage: 'Code scrap added to inventory!'
    },
    code_scrap_ash_trail: {
        id: 'code_scrap_ash_trail',
        name: 'Backup Documentation Code Scrap',
        type: 'code_scrap',
        category: 'progression',
        image: 'codescrapPages.png',
        price: { coin: 'solana', amount: 0.5 },
        description: 'A charred page with burned edges. Backup codes and recovery keys.',
        unlockMessage: 'Code scrap added to inventory!'
    },
    code_scrap_infinite_user: {
        id: 'code_scrap_infinite_user',
        name: 'Master Password List Code Scrap',
        type: 'code_scrap',
        category: 'progression',
        image: 'codescrapPassword.png',
        price: { coin: 'ethereum', amount: 0.0015 },
        description: 'A faded page with a list of passwords and authentication codes.',
        unlockMessage: 'Code scrap added to inventory!'
    },
    
    // Characters
    character_pink_princess: {
        id: 'character_pink_princess',
        name: 'Pink Princess',
        type: 'character',
        category: 'cosmetic',
        image: 'pink-princess.png',
        price: { coin: 'dogecoin', amount: 500 },
        description: 'A stylish pink princess character sprite.',
        unlockMessage: 'Pink Princess character unlocked!'
    },
    character_yellow_princess: {
        id: 'character_yellow_princess',
        name: 'Yellow Princess',
        type: 'character',
        category: 'cosmetic',
        image: 'yellow-princess.png',
        price: { coin: 'solana', amount: 2 },
        description: 'A radiant yellow princess character sprite.',
        unlockMessage: 'Yellow Princess character unlocked!'
    },
    
    // Cosmetic Items (examples - can be expanded)
    cosmetic_hat_1: {
        id: 'cosmetic_hat_1',
        name: 'Miner Helmet',
        type: 'cosmetic',
        category: 'accessory',
        image: null,
        price: { coin: 'bitcoin', amount: 0.0001 },
        description: 'A sturdy mining helmet with built-in LED light.',
        unlockMessage: 'Miner Helmet added to closet!'
    },
    cosmetic_backpack_1: {
        id: 'cosmetic_backpack_1',
        name: 'Crypto Backpack',
        type: 'cosmetic',
        category: 'accessory',
        image: null,
        price: { coin: 'cardano', amount: 75 },
        description: 'A backpack covered in crypto-themed patches.',
        unlockMessage: 'Crypto Backpack added to closet!'
    }
};

let shopOverlay = null;
let currentWallet = {};
let currentPrices = {};

/**
 * Initialize the closet shop
 */
export function initClosetShop() {
    console.log('[ClosetShop] Initialized');
}

/**
 * Show the shop UI
 */
export async function showClosetShop() {
    if (shopOverlay) {
        shopOverlay.remove();
    }
    
    try {
        const walletData = await getWallet();
        currentWallet = walletData.raw_balances || walletData.wallet || {};
        currentPrices = await getPrices();
    } catch (e) {
        console.error('[ClosetShop] Failed to load wallet/prices:', e);
        currentWallet = {};
        currentPrices = {};
    }
    
    createShopUI();
}

/**
 * Create the shop overlay UI
 */
function createShopUI() {
    const baseurl = document.body.getAttribute('data-baseurl') || '';
    
    shopOverlay = document.createElement('div');
    shopOverlay.id = 'closet-shop-overlay';
    shopOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 15000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Courier New', monospace;
    `;
    
    const shopContainer = document.createElement('div');
    shopContainer.id = 'closet-shop-container';
    shopContainer.style.cssText = `
        background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
        border: 3px solid #f7931a;
        border-radius: 15px;
        padding: 30px;
        max-width: 900px;
        max-height: 90vh;
        width: 90%;
        overflow-y: auto;
        color: #eee;
        box-shadow: 0 0 50px rgba(247, 147, 26, 0.5);
    `;
    
    shopContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h1 style="color: #f7931a; margin: 0; font-size: 28px; letter-spacing: 2px;">
                👕 CLOSET SHOP
            </h1>
            <button id="shop-close-btn" style="
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
            💰 Spend crypto coins to buy progression items, characters, and cosmetics! (Note: Satoshis not accepted)
        </div>
        
        <div id="shop-tabs" style="
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
        ">
            <button class="shop-tab active" data-category="all" style="
                background: #333;
                color: #f7931a;
                border: none;
                padding: 10px 20px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            ">ALL</button>
            <button class="shop-tab" data-category="progression" style="
                background: transparent;
                color: #888;
                border: none;
                padding: 10px 20px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            ">CODE SCRAPS</button>
            <button class="shop-tab" data-category="cosmetic" style="
                background: transparent;
                color: #888;
                border: none;
                padding: 10px 20px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            ">CHARACTERS</button>
            <button class="shop-tab" data-category="accessory" style="
                background: transparent;
                color: #888;
                border: none;
                padding: 10px 20px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            ">COSMETICS</button>
        </div>
        
        <div id="shop-items-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
        ">
            ${renderShopItems('all')}
        </div>
    `;
    
    shopOverlay.appendChild(shopContainer);
    document.body.appendChild(shopOverlay);
    
    // Close button handler
    document.getElementById('shop-close-btn').onclick = closeShop;
    
    // Tab handlers
    document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.shop-tab').forEach(t => {
                t.classList.remove('active');
                t.style.background = 'transparent';
                t.style.color = '#888';
            });
            tab.classList.add('active');
            tab.style.background = '#333';
            tab.style.color = '#f7931a';
            
            const category = tab.dataset.category;
            document.getElementById('shop-items-grid').innerHTML = renderShopItems(category);
            attachItemHandlers();
        };
    });
    
    attachItemHandlers();
}

/**
 * Render shop items for a category
 */
function renderShopItems(category = 'all') {
    const baseurl = document.body.getAttribute('data-baseurl') || '';
    let html = '';
    
    const items = Object.values(SHOP_ITEMS);
    const filteredItems = category === 'all' ? items : items.filter(item => item.category === category);
    
    if (filteredItems.length === 0) {
        return '<div style="grid-column: 1 / -1; text-align: center; color: #666; padding: 40px;">No items in this category</div>';
    }
    
    for (const item of filteredItems) {
        const price = item.price;
        const coinInfo = getCoinInfo(price.coin);
        const balance = currentWallet[price.coin] || 0;
        const canAfford = balance >= price.amount;
        
        html += `
            <div class="shop-item-card" data-item-id="${item.id}" style="
                background: rgba(0,0,0,0.4);
                border: 2px solid ${canAfford ? coinInfo.color : '#666'};
                border-radius: 10px;
                padding: 15px;
                cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                opacity: ${canAfford ? '1' : '0.6'};
                transition: all 0.2s;
            ">
                <div style="text-align: center; margin-bottom: 10px;">
                    ${item.image ? `
                        <img src="${baseurl}/images/DBS2/${item.image}" 
                             style="max-width: 100px; max-height: 100px; border: 1px solid ${coinInfo.color}; border-radius: 5px;"
                             onerror="this.style.display='none';">
                    ` : `
                        <div style="width: 100px; height: 100px; background: #333; border: 1px solid ${coinInfo.color}; border-radius: 5px; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 48px;">
                            ${item.type === 'character' ? '👤' : item.type === 'code_scrap' ? '📄' : '✨'}
                        </div>
                    `}
                </div>
                
                <h3 style="color: #f7931a; margin: 10px 0 5px 0; font-size: 16px; text-align: center;">
                    ${item.name}
                </h3>
                
                <p style="font-size: 11px; color: #888; margin: 0 0 10px 0; text-align: center; line-height: 1.4;">
                    ${item.description}
                </p>
                
                <div style="
                    background: rgba(0,0,0,0.5);
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 10px;
                ">
                    <div style="font-size: 10px; color: #666; margin-bottom: 3px;">Price:</div>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
                        <span style="color: ${coinInfo.color}; font-size: 14px; font-weight: bold;">
                            ${formatPrice(price.amount, coinInfo.decimals)} ${coinInfo.symbol}
                        </span>
                    </div>
                    <div style="font-size: 9px; color: ${canAfford ? '#0f0' : '#f00'}; margin-top: 3px;">
                        Your balance: ${formatPrice(balance, coinInfo.decimals)} ${coinInfo.symbol}
                    </div>
                </div>
                
                <button class="shop-purchase-btn" 
                        data-item-id="${item.id}"
                        style="
                    width: 100%;
                    padding: 10px;
                    background: ${canAfford ? coinInfo.color : '#666'};
                    color: ${canAfford ? '#000' : '#999'};
                    border: none;
                    border-radius: 5px;
                    cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: bold;
                    transition: all 0.2s;
                " ${!canAfford ? 'disabled' : ''}>
                    ${canAfford ? 'PURCHASE' : 'INSUFFICIENT FUNDS'}
                </button>
            </div>
        `;
    }
    
    return html;
}

/**
 * Attach click handlers to item cards and purchase buttons
 */
function attachItemHandlers() {
    document.querySelectorAll('.shop-item-card').forEach(card => {
        const itemId = card.dataset.itemId;
        const item = SHOP_ITEMS[itemId];
        if (!item) return;
        
        card.onmouseenter = () => {
            if (!card.querySelector('.shop-purchase-btn')?.disabled) {
                card.style.transform = 'scale(1.05)';
                card.style.borderColor = getCoinInfo(item.price.coin).color;
            }
        };
        
        card.onmouseleave = () => {
            card.style.transform = 'scale(1)';
            const coinInfo = getCoinInfo(item.price.coin);
            const balance = currentWallet[item.price.coin] || 0;
            card.style.borderColor = balance >= item.price.amount ? coinInfo.color : '#666';
        };
    });
    
    document.querySelectorAll('.shop-purchase-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.itemId;
            await handlePurchase(itemId);
        };
    });
}

/**
 * Handle item purchase
 */
async function handlePurchase(itemId) {
    const item = SHOP_ITEMS[itemId];
    if (!item) return;
    
    const price = item.price;
    const balance = currentWallet[price.coin] || 0;
    
    if (balance < price.amount) {
        showMessage('Insufficient funds!', 'error');
        return;
    }
    
    // Disable button during purchase
    const btn = document.querySelector(`.shop-purchase-btn[data-item-id="${itemId}"]`);
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'PURCHASING...';
        btn.style.background = '#666';
    }
    
    try {
        // Attempt purchase (will call backend when available)
        const result = await purchaseShopItem(itemId, item);
        
        if (result.success) {
            showMessage(item.unlockMessage, 'success');
            
            // Refresh wallet
            const walletData = await getWallet();
            currentWallet = walletData.raw_balances || walletData.wallet || {};
            
            // Update UI
            const category = document.querySelector('.shop-tab.active')?.dataset.category || 'all';
            document.getElementById('shop-items-grid').innerHTML = renderShopItems(category);
            attachItemHandlers();
            
            // Refresh wallet display if available
            if (window.WalletDisplay && window.WalletDisplay.refresh) {
                window.WalletDisplay.refresh();
            }
            
            // Refresh inventory if available
            if (window.Inventory && window.Inventory.loadFromBackend) {
                window.Inventory.loadFromBackend();
            }
        } else {
            showMessage(result.error || 'Purchase failed!', 'error');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'PURCHASE';
                btn.style.background = getCoinInfo(price.coin).color;
            }
        }
    } catch (e) {
        console.error('[ClosetShop] Purchase error:', e);
        showMessage('Purchase failed!', 'error');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'PURCHASE';
            btn.style.background = getCoinInfo(price.coin).color;
        }
    }
}

/**
 * Show a message to the user
 */
function showMessage(message, type = 'info') {
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'rgba(0, 200, 0, 0.9)' : type === 'error' ? 'rgba(200, 0, 0, 0.9)' : 'rgba(0, 100, 200, 0.9)'};
        color: white;
        padding: 15px 30px;
        border-radius: 8px;
        z-index: 20000;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
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
 * Format price with appropriate decimals
 */
function formatPrice(amount, decimals) {
    if (decimals === 0) return Math.floor(amount).toLocaleString();
    return amount.toFixed(Math.min(decimals, 6));
}

/**
 * Close the shop
 */
function closeShop() {
    if (shopOverlay) {
        shopOverlay.remove();
        shopOverlay = null;
    }
}

// Export for global access
window.ClosetShop = {
    show: showClosetShop,
    close: closeShop,
    init: initClosetShop,
    SHOP_ITEMS
};

export default {
    initClosetShop,
    showClosetShop,
    closeShop,
    SHOP_ITEMS
};

