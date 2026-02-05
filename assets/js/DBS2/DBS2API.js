/**
 * DBS2API.js
 * Backend API interface for DBS2 game
 * Handles wallet, inventory, scores, and minigame state
 */

import { pythonURI, fetchOptions, getHeaders, getAuthFetchOptions, getAuthToken } from '../api/config.js';

// Fetch options for DBS2 API - headers from getHeaders() include Authorization when logged in
const noCacheFetchOptions = {
    ...fetchOptions,
    cache: 'no-store',
    get headers() { return getHeaders(); }
};

// Coin configurations
const COIN_CONFIG = {
    satoshis: { symbol: 'SATS', name: 'Satoshis', decimals: 0 },
    bitcoin: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
    ethereum: { symbol: 'ETH', name: 'Ethereum', decimals: 6 },
    solana: { symbol: 'SOL', name: 'Solana', decimals: 4 },
    cardano: { symbol: 'ADA', name: 'Cardano', decimals: 2 },
    dogecoin: { symbol: 'DOGE', name: 'Dogecoin', decimals: 2 }
};

// Minigame to coin mapping
const MINIGAME_COINS = {
    crypto_miner: 'satoshis',
    cryptochecker: 'dogecoin',
    whackarat: 'dogecoin',  // Backend uses whackarat for dogecoin rewards
    laundry: 'cardano',
    ash_trail: 'solana',
    infinite_user: 'ethereum'
};

const DBS2API = {
    baseUrl: pythonURI + '/api/dbs2',

    /** Persistent guest ID for unauthenticated Ash Trail runs (localStorage) */
    _getOrCreateGuestId() {
        const key = 'dbs2_guest_id';
        let id = localStorage.getItem(key);
        if (!id) {
            id = 'Guest_' + Math.random().toString(36).slice(2, 10);
            localStorage.setItem(key, id);
        }
        return id;
    },
    
    // ============ PLAYER ============
    async getPlayer() {
        try {
            const cacheBuster = `?_t=${Date.now()}`;
            const res = await fetch(`${this.baseUrl}/player${cacheBuster}`, noCacheFetchOptions);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.log('[DBS2API] getPlayer error:', e);
            return null;
        }
    },

    async updatePlayer(data) {
        try {
            const res = await fetch(`${this.baseUrl}/player`, {
                ...fetchOptions,
                method: 'PUT',
                body: JSON.stringify(data)
            });
            return res.ok;
        } catch (e) {
            console.log('[DBS2API] updatePlayer error:', e);
            return false;
        }
    },

    // ============ WALLET ============
    async getWallet() {
        try {
            // Use no-cache AND cache-busting timestamp to ensure fresh data
            const cacheBuster = `?_t=${Date.now()}`;
            const res = await fetch(`${this.baseUrl}/wallet${cacheBuster}`, noCacheFetchOptions);
            if (!res.ok) {
                console.log('[DBS2API] getWallet failed:', res.status);
                return { wallet: {}, raw_balances: {}, total_usd: 0 };
            }
            const data = await res.json();
            console.log('[DBS2API] getWallet fresh data:', data);
            return data;
        } catch (e) {
            console.log('[DBS2API] getWallet error:', e);
            return { wallet: {}, raw_balances: {}, total_usd: 0 };
        }
    },

    async addToWallet(coin, amount) {
        try {
            const res = await fetch(`${this.baseUrl}/wallet/add`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({ coin: coin, amount: amount })
            });
            if (!res.ok) {
                console.log('[DBS2API] addToWallet failed:', res.status);
                return { success: false };
            }
            const data = await res.json();
            this.refreshLeaderboard();
            return data;
        } catch (e) {
            console.log('[DBS2API] addToWallet error:', e);
            return { success: false };
        }
    },
    
    async purchaseShopItem(itemId, item) {
        try {
            console.log(`[DBS2API] Purchasing ${itemId}: ${item.price.amount} ${item.price.coin}`);
            
            // Use the dedicated shop purchase endpoint
            const res = await fetch(`${this.baseUrl}/shop/purchase`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({
                    item_id: itemId
                })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                console.log(`[DBS2API] Purchase failed:`, data.error);
                return { success: false, error: data.error || 'Purchase failed' };
            }
            
            console.log(`[DBS2API] Purchase successful:`, data);
            this.refreshLeaderboard();
            return { 
                success: true, 
                item: data.item,
                new_balance: data.new_balance,
                coin: data.coin 
            };
        } catch (e) {
            console.log('[DBS2API] purchaseShopItem error:', e);
            return { success: false, error: e.message };
        }
    },

    async convertCoin(fromCoin, toCoin, amount) {
        try {
            const res = await fetch(`${this.baseUrl}/wallet/convert`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({
                    from_coin: fromCoin,
                    to_coin: toCoin,
                    amount: amount
                })
            });
            if (!res.ok) {
                const err = await res.json();
                return { success: false, error: err.error || 'Conversion failed' };
            }
            const data = await res.json();
            this.refreshLeaderboard();
            return data;
        } catch (e) {
            console.log('[DBS2API] convertCoin error:', e);
            return { success: false, error: 'Network error' };
        }
    },

    // ============ PRICES ============
    async getPrices() {
        try {
            const res = await fetch(`${this.baseUrl}/prices`, fetchOptions);
            if (!res.ok) return {};
            return await res.json();
        } catch (e) {
            console.log('[DBS2API] getPrices error:', e);
            return {};
        }
    },

    // ============ MINIGAME REWARDS ============
    async rewardMinigame(minigame, amount) {
        const coin = MINIGAME_COINS[minigame] || 'satoshis';
        console.log(`[DBS2API] Rewarding ${amount} ${coin} for ${minigame}`);
        
        try {
            const res = await fetch(`${this.baseUrl}/minigame/reward`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({
                    minigame: minigame,
                    coin: coin,
                    amount: amount
                })
            });
            
            if (!res.ok) {
                console.log('[DBS2API] rewardMinigame failed, falling back to addToWallet');
                return await this.addToWallet(coin, amount);
            }
            
            const data = await res.json();
            this.refreshLeaderboard();
            return data;
        } catch (e) {
            console.log('[DBS2API] rewardMinigame error, using fallback:', e);
            return await this.addToWallet(coin, amount);
        }
    },
    
    getMinigameCoin(minigame) {
        return MINIGAME_COINS[minigame] || 'satoshis';
    },

    // ============ CRYPTO (Legacy - maps to satoshis) ============
    async getCrypto() {
        try {
            const wallet = await this.getWallet();
            return wallet.raw_balances?.satoshis || 0;
        } catch (e) {
            return 0;
        }
    },

    async setCrypto(amount) {
        try {
            const current = await this.getCrypto();
            const diff = amount - current;
            if (diff !== 0) {
                return await this.addToWallet('satoshis', diff);
            }
            return { success: true };
        } catch (e) {
            return { success: false };
        }
    },

    async addCrypto(amount) {
        return await this.addToWallet('satoshis', amount);
    },

    // ============ INVENTORY ============
    async getInventory() {
        try {
            // Use no-cache AND cache-busting timestamp to ensure fresh data
            const cacheBuster = `?_t=${Date.now()}`;
            const res = await fetch(`${this.baseUrl}/inventory${cacheBuster}`, noCacheFetchOptions);
            if (!res.ok) return { inventory: [] };
            const data = await res.json();
            console.log('[DBS2API] getInventory fresh data:', data);
            return data;
        } catch (e) {
            console.log('[DBS2API] getInventory error:', e);
            return { inventory: [] };
        }
    },

    async addInventoryItem(item) {
        try {
            const res = await fetch(`${this.baseUrl}/inventory`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify(item)
            });
            if (!res.ok) return { success: false };
            return await res.json();
        } catch (e) {
            console.log('[DBS2API] addInventoryItem error:', e);
            return { success: false };
        }
    },

    async removeInventoryItem(index) {
        try {
            const res = await fetch(`${this.baseUrl}/inventory/${index}`, {
                ...fetchOptions,
                method: 'DELETE'
            });
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    // ============ SCORES ============
    async getScores() {
        try {
            const res = await fetch(`${this.baseUrl}/scores`, fetchOptions);
            if (!res.ok) return {};
            return await res.json();
        } catch (e) {
            return {};
        }
    },

    async updateScore(game, score) {
        return this.submitScore(game, score);
    },
    
    async submitScore(game, score) {
        try {
            const res = await fetch(`${this.baseUrl}/scores`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({ game, score })
            });
            if (!res.ok) return { success: false };
            this.refreshLeaderboard();
            return await res.json();
        } catch (e) {
            console.log('[DBS2API] submitScore error:', e);
            return { success: false };
        }
    },

    // ============ MINIGAME COMPLETION ============
    async getMinigameStatus() {
        try {
            const res = await fetch(`${this.baseUrl}/minigames`, fetchOptions);
            if (!res.ok) return {};
            return await res.json();
        } catch (e) {
            return {};
        }
    },

    async completeMinigame(gameName) {
        try {
            const res = await fetch(`${this.baseUrl}/minigames/complete`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({ minigame: gameName })
            });
            if (!res.ok) return { success: false };
            return await res.json();
        } catch (e) {
            console.log('[DBS2API] completeMinigame error:', e);
            return { success: false };
        }
    },
    
    async isMinigameCompleted(gameName) {
        try {
            const status = await this.getMinigameStatus();
            return status[gameName] === true || status.completed?.includes(gameName);
        } catch (e) {
            return false;
        }
    },

    // ============ ASH TRAIL RUNS ============
    async submitAshTrailRun(bookId, score, trace) {
        try {
            const body = {
                book_id: bookId,
                score,
                trace: Array.isArray(trace) ? trace : []
            };
            // When not logged in, pass guest_name so backend can store run under guest user
            if (!getAuthToken()) {
                body.guest_name = this._getOrCreateGuestId();
            }
            const res = await fetch(`${this.baseUrl}/ash-trail/runs`, getAuthFetchOptions('POST', body));
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const msg = errData.error || errData.message || `HTTP ${res.status}`;
                console.log('[DBS2API] submitAshTrailRun failed:', res.status, msg);
                return { success: false, error: msg };
            }
            const data = await res.json();
            return { success: true, run: data.run, ...data };
        } catch (e) {
            console.log('[DBS2API] submitAshTrailRun error:', e);
            return { success: false, error: e?.message || 'network-error' };
        }
    },

    async getAshTrailRuns(bookId, limit = 10) {
        try {
            const params = new URLSearchParams();
            if (bookId) params.set('book_id', bookId);
            if (limit) params.set('limit', Math.min(limit, 50));
            const res = await fetch(`${this.baseUrl}/ash-trail/runs?${params.toString()}`, fetchOptions);
            if (!res.ok) {
                console.log('[DBS2API] getAshTrailRuns failed:', res.status);
                return { runs: [], book_id: bookId };
            }
            return await res.json();
        } catch (e) {
            console.log('[DBS2API] getAshTrailRuns error:', e);
            return { runs: [], book_id: bookId, error: e?.message || 'network-error' };
        }
    },

    async getAshTrailRun(runId) {
        try {
            const res = await fetch(`${this.baseUrl}/ash-trail/runs/${runId}`, fetchOptions);
            if (!res.ok) {
                console.log('[DBS2API] getAshTrailRun failed:', res.status);
                return { run: null };
            }
            return await res.json();
        } catch (e) {
            console.log('[DBS2API] getAshTrailRun error:', e);
            return { run: null, error: e?.message || 'network-error' };
        }
    },

    // ============ LEADERBOARD ============
    async getLeaderboard(limit = 10) {
        try {
            const res = await fetch(`${this.baseUrl}/leaderboard?limit=${limit}`, fetchOptions);
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            console.log('[DBS2API] getLeaderboard error:', e);
            return [];
        }
    },
    
    refreshLeaderboard() {
        try {
            const lb = window.GameControl?.leaderboard || window.Leaderboard;
            if (lb && typeof lb.refresh === 'function') {
                lb.refresh();
            }
        } catch (e) {
            // Ignore leaderboard refresh errors
        }
    },

    // ============ INTRO TRACKING ============
    async hasSeenIntro() {
        try {
            // Use localStorage for intro tracking (per-user, client-side)
            return localStorage.getItem('dbs2_intro_seen') === 'true';
        } catch (e) {
            return false;
        }
    },

    async markIntroSeen() {
        try {
            localStorage.setItem('dbs2_intro_seen', 'true');
            return { success: true };
        } catch (e) {
            return { success: false };
        }
    },

    // ============ INITIALIZATION ============
    async init() {
        console.log('[DBS2API] Initializing...');
        console.log('[DBS2API] Base URL:', this.baseUrl);
        
        // Test connection
        try {
            const player = await this.getPlayer();
            if (player) {
                console.log('[DBS2API] Connected, player:', player.name || player.uid);
                return true;
            }
        } catch (e) {
            console.log('[DBS2API] Could not connect to backend');
        }
        
        return false;
    }
};

// Make available globally
window.DBS2API = DBS2API;

export default DBS2API;
export { COIN_CONFIG, MINIGAME_COINS };