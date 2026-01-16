/**
 * WalletDisplay.js
 * UI component showing player's multi-coin wallet with live prices
 */

import { getWallet, getAllPrices, getPrices} from './StatsManager.js';

// Coin definitions with styling
const COINS = [
    { id: 'satoshis', symbol: 'SATS', name: 'Satoshis', color: '#f7931a', icon: '₿', decimals: 0 },
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: '#f7931a', icon: '₿', decimals: 8 },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: '#627eea', icon: 'Ξ', decimals: 6 },
    { id: 'solana', symbol: 'SOL', name: 'Solana', color: '#00ffa3', icon: '◎', decimals: 4 },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', color: '#0033ad', icon: '₳', decimals: 2 },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', color: '#c2a633', icon: 'Ð', decimals: 2 }
];

// Which minigame rewards which coin
export const MINIGAME_REWARDS = {
    'crypto_miner': { coin: 'satoshis', name: 'Crypto Miner' },
    'laundry': { coin: 'cardano', name: 'Laundry Repair' },
    'ash_trail': { coin: 'solana', name: 'Ash Trail' },
    'infinite_user': { coin: 'ethereum', name: 'Infinite User' },
    'whackarat': { coin: 'dogecoin', name: 'Whack-a-Rat' }
};

let walletPanel = null;
let isExpanded = false;
let prices = {};
let refreshInterval = null;

/**
 * Initialize the wallet display
 * @param {string} containerId - ID of container element (optional)
 */
export function initWalletDisplay(containerId = null) {
    // Remove existing if present
    if (walletPanel) {
        walletPanel.remove();
    }
    
    // Create wallet panel
    walletPanel = document.createElement('div');
    walletPanel.id = 'wallet-display';
    walletPanel.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9000;
        font-family: 'Courier New', monospace;
        user-select: none;
    `;
    
    // Add to container or body
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) container.appendChild(walletPanel);
        else document.body.appendChild(walletPanel);
    } else {
        document.body.appendChild(walletPanel);
    }
    
    // Initial render
    refreshWallet();
    
    // Auto-refresh every 30 seconds
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(refreshWallet, 30000);
    
    return walletPanel;
}

/**
 * Refresh wallet data and re-render
 */
export async function refreshWallet() {
    try {
        const wallet = await getWallet();
        prices = await getAllPrices();
        renderWallet(wallet);
    } catch (e) {
        console.log('[WalletDisplay] Could not refresh:', e);
    }
}

/**
 * Render the wallet UI
 */
function renderWallet(wallet) {
    if (!walletPanel) return;
    
    const totalSats = wallet.satoshis || 0;
    
    walletPanel.innerHTML = `
        <div id="wallet-header" style="
            background: linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%);
            border: 2px solid #f7931a;
            border-radius: 12px;
            padding: 12px 16px;
            cursor: pointer;
            min-width: 180px;
            box-shadow: 0 4px 20px rgba(247, 147, 26, 0.3);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 11px; color: #888; margin-bottom: 2px;">WALLET</div>
                    <div style="font-size: 20px; color: #f7931a; font-weight: bold;">
                        ${formatNumber(totalSats)} <span style="font-size: 12px;">SATS</span>
                    </div>
                </div>
                <div id="wallet-expand-icon" style="
                    color: #f7931a;
                    font-size: 18px;
                    transition: transform 0.3s;
                    transform: rotate(${isExpanded ? '180deg' : '0deg'});
                ">▼</div>
            </div>
        </div>
        
        <div id="wallet-expanded" style="
            display: ${isExpanded ? 'block' : 'none'};
            background: linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%);
            border: 2px solid #333;
            border-top: none;
            border-radius: 0 0 12px 12px;
            padding: 12px;
            margin-top: -2px;
        ">
            ${renderCoinList(wallet)}
            
            <div style="
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid #333;
                font-size: 10px;
                color: #666;
                text-align: center;
            ">
                Play minigames to earn different coins!
            </div>
        </div>
    `;
    
    // Add click handler for expand/collapse
    const header = document.getElementById('wallet-header');
    if (header) {
        header.onclick = () => {
            isExpanded = !isExpanded;
            refreshWallet();
        };
    }
}

/**
 * Render the list of coins
 */
function renderCoinList(wallet) {
    let html = '';
    
    // Skip satoshis in the expanded list (shown in header)
    const coinsToShow = COINS.filter(c => c.id !== 'satoshis');
    
    for (const coin of coinsToShow) {
        const balance = wallet[coin.id] || 0;
        const price = prices[coin.id]?.price_usd || 0;
        const change = prices[coin.id]?.change_24h || 0;
        const hasBalance = balance > 0;
        
        // Find which minigame rewards this coin
        const rewardInfo = Object.entries(MINIGAME_REWARDS).find(([_, v]) => v.coin === coin.id);
        const minigameName = rewardInfo ? rewardInfo[1].name : '';
        
        html += `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #222;
                opacity: ${hasBalance ? '1' : '0.5'};
            ">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="
                        width: 28px;
                        height: 28px;
                        background: ${coin.color}22;
                        border: 1px solid ${coin.color};
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        color: ${coin.color};
                    ">${coin.icon}</div>
                    <div>
                        <div style="font-size: 12px; color: #eee;">${coin.symbol}</div>
                        <div style="font-size: 9px; color: #666;">${minigameName}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 13px; color: ${coin.color};">
                        ${formatBalance(balance, coin.decimals)}
                    </div>
                    ${price > 0 ? `
                        <div style="font-size: 9px; color: ${change >= 0 ? '#0f0' : '#f00'};">
                            $${price.toLocaleString(undefined, {maximumFractionDigits: 2})}
                            (${change >= 0 ? '+' : ''}${change.toFixed(1)}%)
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    return html;
}

/**
 * Format a number with commas
 */
function formatNumber(num) {
    return num.toLocaleString();
}

/**
 * Format balance with appropriate decimals
 */
function formatBalance(balance, decimals) {
    if (balance === 0) return '0';
    if (decimals === 0) return formatNumber(Math.floor(balance));
    return balance.toFixed(Math.min(decimals, 6));
}

/**
 * Show a coin reward animation
 * @param {string} coinId - The coin that was earned
 * @param {number} amount - Amount earned
 */
export function showRewardAnimation(coinId, amount) {
    const coin = COINS.find(c => c.id === coinId);
    if (!coin) return;
    
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%);
        border: 3px solid ${coin.color};
        border-radius: 15px;
        padding: 30px 50px;
        z-index: 10001;
        text-align: center;
        font-family: 'Courier New', monospace;
        animation: popIn 0.4s ease-out;
        box-shadow: 0 0 40px ${coin.color}66;
    `;
    
    popup.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 10px;">${coin.icon}</div>
        <div style="font-size: 14px; color: #888;">EARNED</div>
        <div style="font-size: 32px; color: ${coin.color}; font-weight: bold; margin: 10px 0;">
            +${formatBalance(amount, coin.decimals)} ${coin.symbol}
        </div>
        <div style="font-size: 12px; color: #666;">${coin.name}</div>
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes popIn {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            70% { transform: translate(-50%, -50%) scale(1.1); }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes fadeOut {
            to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(popup);
    
    // Remove after delay
    setTimeout(() => {
        popup.style.animation = 'fadeOut 0.3s ease-in forwards';
        setTimeout(() => {
            popup.remove();
            style.remove();
            refreshWallet();
        }, 300);
    }, 1500);
}

/**
 * Get coin info by ID
 */
export function getCoinInfo(coinId) {
    return COINS.find(c => c.id === coinId);
}

/**
 * Cleanup wallet display
 */
export function destroyWalletDisplay() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    if (walletPanel) {
        walletPanel.remove();
        walletPanel = null;
    }
}

// Export for global access
window.WalletDisplay = {
    init: initWalletDisplay,
    refresh: refreshWallet,
    showReward: showRewardAnimation,
    destroy: destroyWalletDisplay
};

export default {
    initWalletDisplay,
    refreshWallet,
    showRewardAnimation,
    getCoinInfo,
    destroyWalletDisplay,
    COINS,
    MINIGAME_REWARDS
};