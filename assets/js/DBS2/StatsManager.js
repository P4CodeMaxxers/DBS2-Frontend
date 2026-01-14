/**
 * StatsManager.js
 * Bridges local game state with backend DBS2 API
 * Handles crypto, inventory, scores, minigame completion, and multi-coin wallet
 */

// Try to import DBS2API - it may not be available in all contexts
let DBS2API = null;
try {
    const module = await import('./DBS2API.js');
    DBS2API = module.default || module;
} catch (e) {
    console.log('DBS2API not available, using local storage fallback');
}

// Local state (fallback when API unavailable)
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

// Load local state from localStorage
function loadLocalState() {
    try {
        const saved = localStorage.getItem('dbs2_local_state');
        if (saved) {
            localState = JSON.parse(saved);
            // Ensure wallet exists in old saves
            if (!localState.wallet) {
                localState.wallet = {
                    satoshis: localState.crypto || 0,
                    bitcoin: 0,
                    ethereum: 0,
                    solana: 0,
                    cardano: 0,
                    dogecoin: 0
                };
            }
        }
    } catch (e) {
        console.log('Could not load local state:', e);
    }
}

// Save local state to localStorage
function saveLocalState() {
    try {
        localStorage.setItem('dbs2_local_state', JSON.stringify(localState));
    } catch (e) {
        console.log('Could not save local state:', e);
    }
}

// Initialize local state on load
loadLocalState();

// ==================== CRYPTO FUNCTIONS ====================

/**
 * Get current crypto balance
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
 * Add crypto to player's balance
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

// ==================== WALLET FUNCTIONS ====================

/**
 * Get full wallet with all coin balances
 * @returns {Promise<Object>} Wallet object
 */
export async function getWallet() {
    try {
        if (DBS2API && DBS2API.getWallet) {
            const result = await DBS2API.getWallet();
            return result.wallet || result;
        }
        // Try direct API call
        const baseUrl = await getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/dbs2/wallet`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            const data = await res.json();
            return data.wallet || data;
        }
    } catch (e) {
        console.log('API getWallet failed, using local:', e);
    }
    return localState.wallet;
}

/**
 * Update wallet balances (add amounts)
 * @param {Object} updates - {satoshis: 100, bitcoin: 0.001, ...}
 * @returns {Promise<Object>} Updated wallet
 */
export async function updateWallet(updates) {
    try {
        if (DBS2API && DBS2API.updateWallet) {
            const result = await DBS2API.updateWallet(updates);
            return result.wallet || result;
        }
        // Try direct API call
        const baseUrl = await getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/dbs2/wallet`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ add: updates })
        });
        if (res.ok) {
            const data = await res.json();
            return data.wallet || data;
        }
    } catch (e) {
        console.log('API updateWallet failed, using local:', e);
    }
    // Local fallback
    if (updates.satoshis) {
        localState.crypto += updates.satoshis;
        localState.wallet.satoshis = localState.crypto;
    }
    if (updates.bitcoin) localState.wallet.bitcoin += updates.bitcoin;
    if (updates.ethereum) localState.wallet.ethereum += updates.ethereum;
    if (updates.solana) localState.wallet.solana += updates.solana;
    if (updates.cardano) localState.wallet.cardano += updates.cardano;
    if (updates.dogecoin) localState.wallet.dogecoin += updates.dogecoin;
    saveLocalState();
    return localState.wallet;
}

/**
 * Convert cryptocurrency to satoshis
 * @param {string} coinId - Coin to convert
 * @param {number} amount - Amount to convert
 * @returns {Promise<Object>} Conversion result
 */
export async function convertToSatoshis(coinId, amount) {
    try {
        const baseUrl = await getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/dbs2/wallet/convert`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coin: coinId, amount: amount })
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.log('API convertToSatoshis failed:', e);
    }
    return { success: false, error: 'Conversion failed' };
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
        const baseUrl = await getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/dbs2/coin-price?coin=${coinId}`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.log('getCoinPrice failed:', e);
    }
    return {
        coin: coinId,
        price_usd: 0,
        change_24h: 0,
        boost_multiplier: 1.0
    };
}

/**
 * Get all coin prices
 * @returns {Promise<Object>} All prices
 */
export async function getAllPrices() {
    try {
        const baseUrl = await getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/dbs2/prices`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        if (res.ok) {
            const data = await res.json();
            return data.prices || data;
        }
    } catch (e) {
        console.log('getAllPrices failed:', e);
    }
    return {};
}

// ==================== INVENTORY FUNCTIONS ====================

/**
 * Get player's inventory
 * @returns {Promise<Array>} Inventory items
 */
export async function getInventory() {
    try {
        if (DBS2API && DBS2API.getInventory) {
            const result = await DBS2API.getInventory();
            // API returns array directly or in inventory property
            return Array.isArray(result) ? result : (result.inventory || []);
        }
    } catch (e) {
        console.log('API getInventory failed, using local:', e);
    }
    return localState.inventory;
}

/**
 * Add item to inventory
 * @param {string|Object} item - Item to add
 * @returns {Promise<Array>} Updated inventory
 */
export async function addInventoryItem(item) {
    try {
        if (DBS2API && DBS2API.addInventoryItem) {
            // Handle both object format and string format
            let name, foundAt;
            if (typeof item === 'object') {
                name = item.name;
                foundAt = item.found_at || 'unknown';
            } else {
                name = item;
                foundAt = 'unknown';
            }
            const result = await DBS2API.addInventoryItem(name, foundAt);
            return result.inventory || [];
        }
    } catch (e) {
        console.log('API addInventoryItem failed, using local:', e);
    }
    // Local fallback
    const itemObj = typeof item === 'object' ? item : { name: item, found_at: 'unknown' };
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

// ==================== SCORE FUNCTIONS ====================

/**
 * Get player's scores
 * @returns {Promise<Object>} Scores object
 */
export async function getScores() {
    try {
        if (DBS2API && DBS2API.getScores) {
            // DBS2API.getScores() returns the raw scores dict
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
        // DBS2API exposes submitScore(game, score) which returns {scores: {...}}
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
    updateWallet,
    convertToSatoshis,
    // Prices
    getCoinPrice,
    getAllPrices,
    // Inventory
    getInventory,
    addInventoryItem,
    removeInventoryItem,
    hasItem,
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