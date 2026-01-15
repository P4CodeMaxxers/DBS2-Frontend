/**
 * DBS2API.js - Multi-coin wallet support
 * Handles all backend communication for DBS2 game
 */
import { pythonURI, fetchOptions } from '../api/config.js';

// Coin configuration - must match backend
const SUPPORTED_COINS = {
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
    whackarat: 'dogecoin',
    laundry: 'cardano',
    ash_trail: 'solana',
    infinite_user: 'ethereum'
};

const DBS2API = {
    baseUrl: `${pythonURI}/api/dbs2`,
    
    // ============ PLAYER DATA ============
    async getPlayer() {
        const res = await fetch(`${this.baseUrl}/player`, fetchOptions);
        if (!res.ok) throw new Error('Failed to get player');
        return res.json();
    },
    
    async updatePlayer(data) {
        const res = await fetch(`${this.baseUrl}/player`, {
            ...fetchOptions,
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return res.json();
    },
    
    // ============ WALLET ============
    async getWallet() {
        try {
            const res = await fetch(`${this.baseUrl}/wallet`, fetchOptions);
            if (!res.ok) {
                console.log('[DBS2API] getWallet failed:', res.status);
                return { wallet: {}, raw_balances: {}, total_usd: 0 };
            }
            return res.json();
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
            const res = await fetch(`${this.baseUrl}/prices`);
            if (!res.ok) return { prices: {} };
            return res.json();
        } catch (e) {
            console.log('[DBS2API] getPrices error:', e);
            return { prices: {} };
        }
    },
    
    // ============ MINIGAME REWARDS ============
    async rewardMinigame(minigame, amount) {
        try {
            const res = await fetch(`${this.baseUrl}/minigame/reward`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({ minigame: minigame, amount: amount })
            });
            if (!res.ok) {
                console.log('[DBS2API] rewardMinigame failed:', res.status);
                return { success: false };
            }
            const data = await res.json();
            this.refreshLeaderboard();
            return data;
        } catch (e) {
            console.log('[DBS2API] rewardMinigame error:', e);
            return { success: false };
        }
    },
    
    getCoinForMinigame(minigame) {
        return MINIGAME_COINS[minigame] || 'satoshis';
    },
    
    getCoinInfo(coinId) {
        return SUPPORTED_COINS[coinId] || { symbol: '???', name: 'Unknown', decimals: 0 };
    },
    
    // ============ CRYPTO (Legacy - maps to satoshis) ============
    async getCrypto() {
        try {
            const res = await fetch(`${this.baseUrl}/crypto`, fetchOptions);
            if (!res.ok) {
                console.log('[DBS2API] getCrypto failed:', res.status);
                return { crypto: 0 };
            }
            const data = await res.json();
            const cryptoValue = typeof data === 'number' ? data : (data.crypto || 0);
            console.log('[DBS2API] getCrypto:', cryptoValue);
            return { crypto: cryptoValue };
        } catch (e) {
            console.log('[DBS2API] getCrypto error:', e);
            return { crypto: 0 };
        }
    },
    
    async setCrypto(amount) {
        const res = await fetch(`${this.baseUrl}/crypto`, {
            ...fetchOptions,
            method: 'PUT',
            body: JSON.stringify({ crypto: amount })
        });
        const data = await res.json();
        this.updateCryptoUI(data.crypto);
        this.refreshLeaderboard();
        return { crypto: data.crypto || 0 };
    },
    
    async addCrypto(amount) {
        const res = await fetch(`${this.baseUrl}/crypto`, {
            ...fetchOptions,
            method: 'PUT',
            body: JSON.stringify({ add: amount })
        });
        const data = await res.json();
        
        // Update window variables for backward compatibility
        window.playerCrypto = data.crypto;
        window.playerBalance = data.crypto;
        this.updateCryptoUI(data.crypto);
        this.refreshLeaderboard();
        
        return { crypto: data.crypto || 0 };
    },
    
    // ============ INVENTORY ============
    async getInventory() {
        const res = await fetch(`${this.baseUrl}/inventory`, fetchOptions);
        const data = await res.json();
        return { inventory: data.inventory || [] };
    },
    
    async addInventoryItem(item) {
        // Handle both object and string input
        const name = typeof item === 'string' ? item : item.name;
        const foundAt = typeof item === 'string' ? 'unknown' : (item.found_at || 'unknown');
        
        const res = await fetch(`${this.baseUrl}/inventory`, {
            ...fetchOptions,
            method: 'POST',
            body: JSON.stringify({ name: name, found_at: foundAt })
        });
        const data = await res.json();
        return { inventory: data.inventory || [] };
    },
    
    async removeInventoryItem(index) {
        const res = await fetch(`${this.baseUrl}/inventory`, {
            ...fetchOptions,
            method: 'DELETE',
            body: JSON.stringify({ index: index })
        });
        const data = await res.json();
        return { inventory: data.inventory || [] };
    },
    
    // ============ SCORES ============
    async getScores() {
        try {
            const res = await fetch(`${this.baseUrl}/scores`, fetchOptions);
            if (!res.ok) {
                console.log('[DBS2API] getScores failed:', res.status);
                return {};
            }
            const data = await res.json();
            const scores = data && typeof data === 'object' ? (data.scores || {}) : {};
            return scores;
        } catch (e) {
            console.log('[DBS2API] getScores error:', e);
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
                method: 'PUT',
                body: JSON.stringify({ game: game, score: score })
            });
            if (!res.ok) {
                console.log('[DBS2API] submitScore failed:', res.status);
                return { scores: {} };
            }
            const data = await res.json();
            this.refreshLeaderboard();
            return { scores: data.scores || {} };
        } catch (e) {
            console.log('[DBS2API] submitScore error:', e);
            return { scores: {} };
        }
    },
    
    // ============ MINIGAMES ============
    async getMinigameStatus() {
        const res = await fetch(`${this.baseUrl}/minigames`, fetchOptions);
        const data = await res.json();
        return { minigames_completed: data.minigames_completed || data || {} };
    },
    
    async completeMinigame(gameName) {
        const payload = {};
        payload[gameName] = true;
        
        const res = await fetch(`${this.baseUrl}/minigames`, {
            ...fetchOptions,
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        this.refreshLeaderboard();
        return { minigames_completed: data.minigames_completed || data || {} };
    },
    
    // ============ LEADERBOARD ============
    async getLeaderboard(limit = 10) {
        const res = await fetch(`${this.baseUrl}/leaderboard?limit=${limit}`);
        const data = await res.json();
        return data.leaderboard || [];
    },
    
    refreshLeaderboard() {
        try {
            if (window.Leaderboard && typeof window.Leaderboard.refresh === 'function') {
                window.Leaderboard.refresh();
            }
            if (window.GameControl && window.GameControl.leaderboard) {
                window.GameControl.leaderboard.refresh();
            }
        } catch (e) {
            console.log('[DBS2API] Could not refresh leaderboard:', e);
        }
    },
    
    // ============ BITCOIN BOOST ============
    async getBitcoinBoost() {
        const res = await fetch(`${this.baseUrl}/bitcoin-boost`);
        return res.json();
    },
    
    async addCryptoWithBoost(baseAmount) {
        const boostData = await this.getBitcoinBoost();
        const multiplier = boostData.boost_multiplier || 1.0;
        const boostedAmount = Math.round(baseAmount * multiplier);
        const result = await this.addCrypto(boostedAmount);
        
        return {
            crypto: result.crypto,
            base_amount: baseAmount,
            boosted_amount: boostedAmount,
            boost_multiplier: multiplier,
            btc_change_24h: boostData.btc_change_24h || 0,
            btc_price_usd: boostData.btc_price_usd || 0,
            message: boostData.message || ''
        };
    },
    
    // ============ INTRO TRACKING ============
    async hasSeenIntro() {
        try {
            const player = await this.getPlayer();
            const hasProgress = (player.crypto > 0) || 
                               (player.inventory && player.inventory.length > 0) ||
                               (player.minigames_completed && Object.values(player.minigames_completed).some(v => v));
            return hasProgress;
        } catch (e) {
            return localStorage.getItem('dbs2_intro_seen') === 'true';
        }
    },
    
    async markIntroSeen() {
        localStorage.setItem('dbs2_intro_seen', 'true');
    },
    
    // ============ UI HELPERS ============
    updateCryptoUI(crypto) {
        const ids = ['balance', 'money', 'crypto', 'playerCrypto'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = crypto;
        });
    },
    
    // ============ INITIALIZATION ============
    async init() {
        try {
            const player = await this.getPlayer();
            window.playerCrypto = player.crypto;
            window.playerBalance = player.crypto;
            window.playerInventory = player.inventory;
            window.playerWallet = player.wallet;
            this.updateCryptoUI(player.crypto);
            console.log('[DBS2API] Initialized:', player);
            return player;
        } catch (e) {
            console.log('[DBS2API] Not logged in or error:', e);
            return null;
        }
    }
};

// Make available globally
window.DBS2API = DBS2API;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DBS2API.init();
    });
} else {
    DBS2API.init();
}

export default DBS2API;