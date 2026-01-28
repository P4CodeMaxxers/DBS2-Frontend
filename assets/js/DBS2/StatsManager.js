/**
 * StatsManager.js
 * Bridges local game state with backend DBS2 API
 * Handles multi-coin wallet, inventory, scores, minigame completion
 */

// Try to import DBS2API - it may not be available in all contexts
let DBS2API = null;
try {
    const module = await import('./DBS2API.js');
    DBS2API = module.default || module;
    console.log('[StatsManager] DBS2API loaded via import');
} catch (e) {
    console.log('[StatsManager] DBS2API import failed, checking window.DBS2API');
    // Try window.DBS2API as fallback
    if (typeof window !== 'undefined' && window.DBS2API) {
        DBS2API = window.DBS2API;
        console.log('[StatsManager] Using window.DBS2API');
    } else {
        console.log('[StatsManager] DBS2API not available, using local storage fallback');
    }
}

// Helper to get DBS2API (checks both imported and window versions)
function getAPI() {
    return DBS2API || (typeof window !== 'undefined' ? window.DBS2API : null);
}

// Minigame to coin mapping
const MINIGAME_COINS = {
    crypto_miner: 'satoshis',
    cryptochecker: 'dogecoin',
    whackarat: 'dogecoin',  // Backend uses whackarat for dogecoin rewards
    laundry: 'cardano',
    ash_trail: 'solana',
    infinite_user: 'ethereum'
};

// Current user ID (set when syncing with backend)
let currentUserId = null;

// Local state (fallback when API unavailable) - ALWAYS starts empty
// Backend data takes priority; localStorage is only for offline fallback
let localState = {
    crypto: 0,
    inventory: [],
    scores: {},
    minigames_completed: {},
    wallet: {
        satoshis: 0,
        bitcoin: 0,
        ethereum: 0,
        solana: 0,
        cardano: 0,
        dogecoin: 0
    }
};

// Get user-specific localStorage key
function getStorageKey() {
    return currentUserId ? `dbs2_state_${currentUserId}` : 'dbs2_state_anonymous';
}

// Load local state from localStorage (only for current user)
function loadLocalState() {
    try {
        const key = getStorageKey();
        const saved = localStorage.getItem(key);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with defaults to ensure all fields exist
            localState = {
                crypto: parsed.crypto || 0,
                inventory: parsed.inventory || [],
                scores: parsed.scores || {},
                minigames_completed: parsed.minigames_completed || {},
                wallet: {
                    satoshis: parsed.wallet?.satoshis || parsed.crypto || 0,
                    bitcoin: parsed.wallet?.bitcoin || 0,
                    ethereum: parsed.wallet?.ethereum || 0,
                    solana: parsed.wallet?.solana || 0,
                    cardano: parsed.wallet?.cardano || 0,
                    dogecoin: parsed.wallet?.dogecoin || 0
                }
            };
            console.log(`[StatsManager] Loaded local state for user: ${currentUserId || 'anonymous'}`);
        }
    } catch (e) {
        console.log('[StatsManager] Could not load local state:', e);
    }
}

// Save local state to localStorage (user-specific)
function saveLocalState() {
    try {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(localState));
    } catch (e) {
        console.log('[StatsManager] Could not save local state:', e);
    }
}

// Reset local state to defaults (called on user change)
function resetLocalState() {
    localState = {
        crypto: 0,
        inventory: [],
        scores: {},
        minigames_completed: {},
        wallet: {
            satoshis: 0,
            bitcoin: 0,
            ethereum: 0,
            solana: 0,
            cardano: 0,
            dogecoin: 0
        }
    };
    console.log('[StatsManager] Local state reset to defaults');
}

/**
 * Initialize StatsManager with current user
 * Should be called on page load or after login
 * @returns {Promise<boolean>} Success
 */
export async function initializeForUser() {
    const api = getAPI();
    try {
        if (api && api.getPlayer) {
            const player = await api.getPlayer();
            if (player && player.user_info) {
                const newUserId = player.user_info.uid || player.user_info.id;
                
                // Check if user changed
                if (currentUserId !== newUserId) {
                    console.log(`[StatsManager] User changed: ${currentUserId} -> ${newUserId}`);
                    currentUserId = newUserId;
                    resetLocalState();
                    loadLocalState();
                }
                
                // Sync local state with backend data
                localState.crypto = player.crypto || player.satoshis || 0;
                localState.inventory = player.inventory || [];
                localState.scores = player.scores || {};
                localState.minigames_completed = {
                    crypto_miner: player.completed_crypto_miner,
                    cryptochecker: player.completed_cryptochecker || player.completed_whackarat,
                    laundry: player.completed_laundry,
                    ash_trail: player.completed_ash_trail,
                    infinite_user: player.completed_infinite_user
                };
                
                // Sync wallet
                if (player.wallet) {
                    localState.wallet = {
                        satoshis: player.wallet.satoshis || player.crypto || 0,
                        bitcoin: player.wallet.bitcoin || 0,
                        ethereum: player.wallet.ethereum || 0,
                        solana: player.wallet.solana || 0,
                        cardano: player.wallet.cardano || 0,
                        dogecoin: player.wallet.dogecoin || 0
                    };
                }
                
                saveLocalState();
                console.log('[StatsManager] Synced with backend for user:', currentUserId);
                return true;
            }
        }
    } catch (e) {
        console.log('[StatsManager] Could not sync with backend:', e);
    }
    return false;
}

/**
 * Clear all local data (call on logout)
 */
export function clearLocalData() {
    console.log('[StatsManager] Clearing local data for logout');
    // Clear current user's data
    try {
        const key = getStorageKey();
        localStorage.removeItem(key);
    } catch (e) {
        console.log('[StatsManager] Could not clear localStorage:', e);
    }
    currentUserId = null;
    resetLocalState();
}

// Don't auto-load on module init - wait for initializeForUser() call
// This prevents loading stale data from a previous user;

// ==================== WALLET FUNCTIONS ====================

/**
 * Get the coin ID for a minigame
 * @param {string} minigame - Minigame name
 * @returns {string} Coin ID
 */
export function getCoinForMinigame(minigame) {
    return MINIGAME_COINS[minigame] || 'satoshis';
}

/**
 * Get full wallet with all coin balances
 * @returns {Promise<Object>} Wallet object
 */
export async function getWallet() {
    const api = getAPI();
    try {
        if (api && api.getWallet) {
            const result = await api.getWallet();
            // Sync local state with backend data
            if (result && result.raw_balances) {
                localState.wallet = {
                    satoshis: result.raw_balances.satoshis || 0,
                    bitcoin: result.raw_balances.bitcoin || 0,
                    ethereum: result.raw_balances.ethereum || 0,
                    solana: result.raw_balances.solana || 0,
                    cardano: result.raw_balances.cardano || 0,
                    dogecoin: result.raw_balances.dogecoin || 0
                };
                localState.crypto = localState.wallet.satoshis;
                saveLocalState();
            }
            return result;
        }
    } catch (e) {
        console.log('[StatsManager] API getWallet failed, using local:', e);
    }
    return { wallet: localState.wallet, raw_balances: localState.wallet, total_usd: 0 };
}

/**
 * Add to a specific coin balance
 * @param {string} coin - Coin ID (satoshis, dogecoin, etc)
 * @param {number} amount - Amount to add
 * @returns {Promise<Object>} Updated wallet
 */
export async function addToWallet(coin, amount) {
    const api = getAPI();
    try {
        if (api && api.addToWallet) {
            const result = await api.addToWallet(coin, amount);
            // Sync local state
            if (result && result.wallet) {
                localState.wallet = { ...localState.wallet, ...result.wallet };
                localState.crypto = localState.wallet.satoshis || 0;
                saveLocalState();
            }
            return result;
        }
    } catch (e) {
        console.log('[StatsManager] API addToWallet failed, using local:', e);
    }
    // Local fallback
    if (coin in localState.wallet) {
        localState.wallet[coin] = (localState.wallet[coin] || 0) + amount;
        if (coin === 'satoshis') {
            localState.crypto = localState.wallet.satoshis;
        }
        saveLocalState();
    }
    return { wallet: localState.wallet };
}

/**
 * Reward player for completing a minigame with appropriate coin
 * @param {string} minigame - Minigame name
 * @param {number} amount - Amount to reward
 * @returns {Promise<Object>} Result with coin info
 */
export async function rewardMinigame(minigame, amount) {
    const coin = getCoinForMinigame(minigame);
    
    try {
        if (DBS2API && DBS2API.rewardMinigame) {
            const result = await DBS2API.rewardMinigame(minigame, amount);
            return result;
        }
    } catch (e) {
        console.log('API rewardMinigame failed, using local:', e);
    }
    
    // Local fallback
    const result = await addToWallet(coin, amount);
    return {
        success: true,
        minigame: minigame,
        coin: coin,
        amount: amount,
        wallet: result.wallet
    };
}

/**
 * Convert between coins (5% fee)
 * @param {string} fromCoin - Source coin
 * @param {string} toCoin - Target coin
 * @param {number} amount - Amount to convert
 * @returns {Promise<Object>} Conversion result
 */
export async function convertCoin(fromCoin, toCoin, amount) {
    try {
        if (DBS2API && DBS2API.convertCoin) {
            return await DBS2API.convertCoin(fromCoin, toCoin, amount);
        }
    } catch (e) {
        console.log('API convertCoin failed:', e);
    }
    return { success: false, error: 'Conversion not available offline' };
}

/**
 * Get current coin prices
 * @returns {Promise<Object>} Prices object
 */
export async function getPrices() {
    try {
        if (DBS2API && DBS2API.getPrices) {
            return await DBS2API.getPrices();
        }
    } catch (e) {
        console.log('API getPrices failed:', e);
    }
    return { prices: {} };
}

// ==================== CRYPTO FUNCTIONS (Legacy - maps to satoshis) ====================

/**
 * Get current crypto balance (satoshis)
 * @returns {Promise<number>} Current crypto amount
 */
export async function getCrypto() {
    try {
        if (DBS2API && DBS2API.getCrypto) {
            const result = await DBS2API.getCrypto();
            return result.crypto || 0;
        }
    } catch (e) {
        console.log('API getCrypto failed, using local:', e);
    }
    return localState.crypto;
}

/**
 * Add crypto to player's balance (satoshis)
 * @param {number} amount - Amount to add
 * @returns {Promise<number>} New crypto balance
 */
export async function addCrypto(amount) {
    try {
        if (DBS2API && DBS2API.addCrypto) {
            const result = await DBS2API.addCrypto(amount);
            return result.crypto || 0;
        }
    } catch (e) {
        console.log('API addCrypto failed, using local:', e);
    }
    // Local fallback
    localState.crypto += amount;
    localState.wallet.satoshis = localState.crypto;
    saveLocalState();
    return localState.crypto;
}

/**
 * Update crypto (add to current balance)
 * Alias for addCrypto for backwards compatibility
 * @param {number} amount - Amount to add
 * @returns {Promise<number>} New crypto balance
 */
export async function updateCrypto(amount) {
    return addCrypto(amount);
}

/**
 * Set crypto to specific value
 * @param {number} amount - New crypto amount
 * @returns {Promise<number>} New crypto balance
 */
export async function setCrypto(amount) {
    try {
        if (DBS2API && DBS2API.setCrypto) {
            const result = await DBS2API.setCrypto(amount);
            return result.crypto || 0;
        }
    } catch (e) {
        console.log('API setCrypto failed, using local:', e);
    }
    // Local fallback
    localState.crypto = amount;
    localState.wallet.satoshis = amount;
    saveLocalState();
    return localState.crypto;
}

// ==================== PRICE FUNCTIONS ====================

/**
 * Get API base URL
 */
async function getApiBaseUrl() {
    try {
        const config = await import('../api/config.js');
        return config.pythonURI || 'http://localhost:8403';
    } catch (e) {
        return 'http://localhost:8403';
    }
}

/**
 * Get current price for a coin
 * @param {string} coinId - Coin ID (bitcoin, ethereum, etc.)
 * @returns {Promise<Object>} Price data with boost multiplier
 */
export async function getCoinPrice(coinId = 'bitcoin') {
    try {
        const priceData = await getPrices();
        const prices = priceData.prices || {};
        if (coinId in prices) {
            return prices[coinId];
        }
    } catch (e) {
        console.log('getCoinPrice failed:', e);
    }
    return {
        price_usd: 0,
        change_24h: 0,
        sats_per_unit: 0
    };
}

/**
 * Get all coin prices
 * @returns {Promise<Object>} All prices
 */
export async function getAllPrices() {
    return getPrices();
}

// ==================== INVENTORY FUNCTIONS ====================

/**
 * Get player's inventory
 * @returns {Promise<Array>} Inventory items
 */
export async function getInventory() {
    const api = getAPI();
    try {
        if (api && api.getInventory) {
            const result = await api.getInventory();
            const inventory = result.inventory || [];
            // Sync local state with backend
            localState.inventory = inventory;
            saveLocalState();
            console.log('[StatsManager] getInventory synced from backend:', inventory.length, 'items');
            return inventory;
        }
    } catch (e) {
        console.log('[StatsManager] API getInventory failed, using local:', e);
    }
    return localState.inventory;
}

/**
 * Add item to inventory
 * @param {string|Object} item - Item to add
 * @returns {Promise<Array>} Updated inventory
 */
export async function addInventoryItem(item) {
    const itemObj = typeof item === 'string' 
        ? { name: item, found_at: 'unknown', timestamp: new Date().toISOString() }
        : item;
    
    const api = getAPI();
    try {
        if (api && api.addInventoryItem) {
            const result = await api.addInventoryItem(itemObj);
            const inventory = result.inventory || [];
            localState.inventory = inventory;
            saveLocalState();
            return inventory;
        }
    } catch (e) {
        console.log('[StatsManager] API addInventoryItem failed, using local:', e);
    }
    // Local fallback
    const exists = localState.inventory.some(i => 
        (typeof i === 'object' ? i.name : i) === (itemObj.name)
    );
    if (!exists) {
        localState.inventory.push(itemObj);
        saveLocalState();
    }
    return localState.inventory;
}

/**
 * Remove item from inventory
 * @param {string} item - Item to remove
 * @returns {Promise<Array>} Updated inventory
 */
export async function removeInventoryItem(item) {
    try {
        if (DBS2API && DBS2API.removeInventoryItem) {
            const result = await DBS2API.removeInventoryItem(item);
            return result.inventory || [];
        }
    } catch (e) {
        console.log('API removeInventoryItem failed, using local:', e);
    }
    // Local fallback
    const index = localState.inventory.indexOf(item);
    if (index > -1) {
        localState.inventory.splice(index, 1);
        saveLocalState();
    }
    return localState.inventory;
}

/**
 * Check if player has an item
 * @param {string} item - Item to check
 * @returns {Promise<boolean>} Whether player has the item
 */
export async function hasItem(item) {
    const inventory = await getInventory();
    return inventory.includes(item);
}

// ==================== SHOP FUNCTIONS ====================

/**
 * Purchase an item from the shop
 * The backend /shop/purchase endpoint handles:
 * 1. Balance checking
 * 2. Coin deduction  
 * 3. Adding item to inventory
 * @param {string} itemId - Shop item ID
 * @param {Object} item - Item data
 * @returns {Promise<Object>} Purchase result
 */
export async function purchaseShopItem(itemId, item) {
    const coin = item.price.coin;
    const amount = item.price.amount;
    const api = getAPI();
    
    console.log(`[Shop] Attempting purchase: ${itemId} for ${amount} ${coin}`);
    console.log(`[Shop] API available:`, !!api);
    
    try {
        // Try API first - backend handles everything
        if (api && api.purchaseShopItem) {
            console.log('[Shop] Using DBS2API.purchaseShopItem');
            const result = await api.purchaseShopItem(itemId, item);
            
            if (result && result.success) {
                console.log('[Shop] Purchase successful via API');
                // Refresh local state from backend
                await getWallet();
                await getInventory();
                return result;
            } else {
                console.log('[Shop] API purchase failed:', result?.error);
                return result || { success: false, error: 'Purchase failed' };
            }
        }
        
        // Local fallback when API not available (offline mode)
        console.log('[Shop] Using local storage fallback');
        const currentBalance = localState.wallet[coin] || 0;
        
        if (currentBalance < amount) {
            return { success: false, error: 'Insufficient funds' };
        }
        
        // Deduct from local wallet
        localState.wallet[coin] = currentBalance - amount;
        
        // Add to local inventory if it's a code scrap
        if (item.type === 'code_scrap') {
            const inventoryNameMap = {
                'scrap_crypto_miner': 'Mining Algorithm Code Scrap',
                'scrap_laundry': 'Transaction Ledger Code Scrap',
                'scrap_whackarat': 'Security Keys Code Scrap',
                'scrap_ash_trail': 'Backup Documentation Code Scrap',
                'scrap_infinite_user': 'Master Password List Code Scrap'
            };
            
            const inventoryName = inventoryNameMap[itemId] || item.name;
            localState.inventory.push({
                name: inventoryName,
                found_at: 'Closet Shop',
                timestamp: new Date().toISOString()
            });
        }
        
        saveLocalState();
        console.log('[Shop] Local purchase successful');
        return { success: true };
        
    } catch (e) {
        console.error('[Shop] Purchase error:', e);
        return { success: false, error: e.message || 'Purchase failed' };
    }
}

// ==================== SCORE FUNCTIONS ====================

/**
 * Get player's scores
 * @returns {Promise<Object>} Scores object
 */
export async function getScores() {
    try {
        if (DBS2API && DBS2API.getScores) {
            const scores = await DBS2API.getScores();
            return scores || {};
        }
    } catch (e) {
        console.log('API getScores failed, using local:', e);
    }
    return localState.scores;
}

/**
 * Update a score
 * @param {string} game - Game name
 * @param {number} score - New score
 * @returns {Promise<Object>} Updated scores
 */
export async function updateScore(game, score) {
    try {
        if (DBS2API && DBS2API.submitScore) {
            const result = await DBS2API.submitScore(game, score);
            return result.scores || {};
        }
    } catch (e) {
        console.log('API updateScore failed, using local:', e);
    }
    // Local fallback - keep highest score
    if (!localState.scores[game] || score > localState.scores[game]) {
        localState.scores[game] = score;
        saveLocalState();
    }
    return localState.scores;
}

// ==================== ASH TRAIL FUNCTIONS ====================

/**
 * Submit an Ash Trail run trace to backend for ghost replay.
 * @param {string} bookId - 'defi_grimoire' | 'lost_ledger' | 'proof_of_burn'
 * @param {number} score - 0..100
 * @param {Array<{x:number,y:number}>} trace - player path points in grid space
 */
export async function submitAshTrailRun(bookId, score, trace) {
    try {
        if (DBS2API && DBS2API.submitAshTrailRun) {
            return await DBS2API.submitAshTrailRun(bookId, score, trace);
        }
    } catch (e) {
        console.log('API submitAshTrailRun failed:', e);
    }
    return null;
}

export async function getAshTrailRuns(bookId, limit = 10) {
    if (DBS2API && DBS2API.getAshTrailRuns) return await DBS2API.getAshTrailRuns(bookId, limit);
    return { book_id: bookId, runs: [] };
}

export async function getAshTrailRun(runId) {
    if (DBS2API && DBS2API.getAshTrailRun) return await DBS2API.getAshTrailRun(runId);
    return { run: null };
}

// ==================== MINIGAME FUNCTIONS ====================

/**
 * Get minigame completion status
 * @returns {Promise<Object>} Minigame completion status
 */
export async function getMinigameStatus() {
    try {
        if (DBS2API && DBS2API.getMinigameStatus) {
            const result = await DBS2API.getMinigameStatus();
            return result.minigames_completed || result || {};
        }
    } catch (e) {
        console.log('API getMinigameStatus failed, using local:', e);
    }
    return localState.minigames_completed;
}

/**
 * Check if a specific minigame has been completed
 * @param {string} minigameName - Name of the minigame (e.g., 'crypto_miner', 'ash_trail')
 * @returns {Promise<boolean>} Whether the minigame has been completed
 */
export async function isMinigameCompleted(minigameName) {
    try {
        const status = await getMinigameStatus();
        return status[minigameName] === true;
    } catch (e) {
        console.log('Could not check minigame status:', e);
    }
    return localState.minigames_completed[minigameName] === true;
}

/**
 * Mark a minigame as complete
 * @param {string} minigameName - Name of the minigame
 * @returns {Promise<Object>} Updated minigame status
 */
export async function completeMinigame(minigameName) {
    try {
        if (DBS2API && DBS2API.completeMinigame) {
            const result = await DBS2API.completeMinigame(minigameName);
            return result.minigames_completed || result || {};
        }
    } catch (e) {
        console.log('API completeMinigame failed, using local:', e);
    }
    // Local fallback
    localState.minigames_completed[minigameName] = true;
    saveLocalState();
    return localState.minigames_completed;
}

// ==================== PLAYER FUNCTIONS ====================

/**
 * Get full player data
 * @returns {Promise<Object>} Full player data
 */
export async function getPlayerData() {
    try {
        if (DBS2API && DBS2API.getPlayer) {
            return await DBS2API.getPlayer();
        }
    } catch (e) {
        console.log('API getPlayer failed, using local:', e);
    }
    return localState;
}

/**
 * Sync local state with server
 * Call this after login to merge any offline progress
 */
export async function syncWithServer() {
    if (!DBS2API) {
        console.log('Cannot sync - DBS2API not available');
        return false;
    }
    
    try {
        // Get server state
        const serverData = await DBS2API.getPlayer();
        
        // If local has more crypto, add the difference
        if (localState.crypto > 0) {
            await DBS2API.addCrypto(localState.crypto);
            localState.crypto = 0;
        }
        
        // Sync inventory items
        for (const item of localState.inventory) {
            if (!serverData.inventory?.includes(item)) {
                await DBS2API.addInventoryItem(item);
            }
        }
        localState.inventory = [];
        
        // Sync scores (keep highest)
        for (const [game, score] of Object.entries(localState.scores)) {
            const serverScore = serverData.scores?.[game] || 0;
            if (score > serverScore) {
                await DBS2API.updateScore(game, score);
            }
        }
        localState.scores = {};
        
        // Sync minigame completions
        for (const [game, completed] of Object.entries(localState.minigames_completed)) {
            if (completed && !serverData.minigames_completed?.[game]) {
                await DBS2API.completeMinigame(game);
            }
        }
        localState.minigames_completed = {};
        
        saveLocalState();
        console.log('Synced local state with server');
        return true;
    } catch (e) {
        console.log('Sync failed:', e);
        return false;
    }
}

// Alias for backwards compatibility with Prompt.js
export const updateBalance = updateCrypto;

// Export default object with all functions for backwards compatibility
export default {
    // Crypto
    getCrypto,
    addCrypto,
    updateCrypto,
    updateBalance,
    setCrypto,
    // Wallet
    getWallet,
    addToWallet,
    rewardMinigame,
    convertCoin,
    getCoinForMinigame,
    // Prices
    getCoinPrice,
    getAllPrices,
    getPrices,
    // Inventory
    getInventory,
    addInventoryItem,
    removeInventoryItem,
    hasItem,
    // Shop
    purchaseShopItem,
    // Scores
    getScores,
    updateScore,
    // Ash Trail
    submitAshTrailRun,
    getAshTrailRuns,
    getAshTrailRun,
    // Minigames
    getMinigameStatus,
    isMinigameCompleted,
    completeMinigame,
    // Player
    getPlayerData,
    syncWithServer
};