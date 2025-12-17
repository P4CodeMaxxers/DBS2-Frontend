import { pythonURI, fetchOptions } from '../api/config.js';

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
    
    // ============ CRYPTO ============
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
            // Return object with crypto property for StatsManager compatibility
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
            // Backend returns: { scores: { game: score, ... } }
            const scores = data && typeof data === 'object' ? (data.scores || {}) : {};
            return scores;
        } catch (e) {
            console.log('[DBS2API] getScores error:', e);
            return {};
        }
    },
    
    async updateScore(game, score) {
        // Backwards-compatible helper that mirrors submitScore
        return this.submitScore(game, score);
    },

    /**
     * Submit a score for a given game.
     * Expected by StatsManager.updateScore(game, score) to return {scores: {...}}.
     */
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
        // Leaderboard is public, no auth needed
        const res = await fetch(`${this.baseUrl}/leaderboard?limit=${limit}`);
        const data = await res.json();
        return data.leaderboard || [];
    },
    
    // Refresh leaderboard widget
    refreshLeaderboard() {
        try {
            if (window.Leaderboard && typeof window.Leaderboard.refresh === 'function') {
                window.Leaderboard.refresh();
            }
            // Also try the instance on GameControl
            if (window.GameControl && window.GameControl.leaderboard) {
                window.GameControl.leaderboard.refresh();
            }
        } catch (e) {
            console.log('[DBS2API] Could not refresh leaderboard:', e);
        }
    },
    
    // ============ BITCOIN BOOST (for Crypto Miner) ============
    async getBitcoinBoost() {
        const res = await fetch(`${this.baseUrl}/bitcoin-boost`);
        return res.json();
    },
    
    /**
     * Add crypto with Bitcoin boost applied
     * @param {number} baseAmount - Base crypto to add before boost
     * @returns {object} { crypto, boost_multiplier, boosted_amount, btc_change_24h }
     */
    async addCryptoWithBoost(baseAmount) {
        // Get current Bitcoin boost
        const boostData = await this.getBitcoinBoost();
        const multiplier = boostData.boost_multiplier || 1.0;
        
        // Calculate boosted amount
        const boostedAmount = Math.round(baseAmount * multiplier);
        
        // Add the boosted crypto
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
            // Check if player has any progress (crypto > 0, any minigames completed, or inventory items)
            const hasProgress = (player.crypto > 0) || 
                               (player.inventory && player.inventory.length > 0) ||
                               (player.minigames_completed && Object.values(player.minigames_completed).some(v => v));
            return hasProgress;
        } catch (e) {
            // Not logged in - check localStorage as fallback
            return localStorage.getItem('dbs2_intro_seen') === 'true';
        }
    },
    
    async markIntroSeen() {
        // Store in localStorage as fallback
        localStorage.setItem('dbs2_intro_seen', 'true');
        // The backend tracks this implicitly via player progress
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