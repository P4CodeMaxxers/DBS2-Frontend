/**
 * Leaderboard component for DBS2 game
 * Displays a pixel-themed leaderboard with data from backend API
 * Features: refresh button, minimize button, auto-refresh, shows YOUR crypto
 */
import { pythonURI, getHeaders } from '../api/config.js';
import { getAshTrailRuns, getAshTrailRun } from './StatsManager.js';
import { showAshTrailReplay } from './AshTrailMinigame.js';

class Leaderboard {
    constructor(apiBase = null) {
        this.container = null;
        this.isVisible = true;
        this.isMinimized = false;
        this.currentPlayerData = null; // Store current player's data
        
        if (apiBase) {
            this.apiBase = apiBase;
        } else {
            // Use pythonURI from config.js to ensure correct backend URL when deployed
            this.apiBase = `${pythonURI}/api/dbs2`;
        }
        this.refreshInterval = null;
        this.isRefreshing = false;
        this.currentTab = 'games'; // 'satoshis' | 'games' | 'ashtrail' — Games is main
        this.gamesData = [];      // sorted by completions count
        this.ashTrailData = [];   // { rank, name, score } for selected book
        this.ashTrailBook = 'defi_grimoire';
        this.ashTrailRunCache = new Map();
        
        // Default filler data (used as fallback)
        this.leaderboardData = [
            { name: "Cyrus", score: 1250, rank: 1 },
            { name: "Evan", score: 980, rank: 2 },
            { name: "Aryaan", score: 875, rank: 3 },
            { name: "West", score: 720, rank: 4 },
            { name: "Maya", score: 650, rank: 5 }
        ];
    }

    /**
     * Fetch current player's data
     */
    async fetchCurrentPlayer() {
        try {
            // Use DBS2API if available (it handles authentication properly)
            if (window.DBS2API && window.DBS2API.getPlayer) {
                try {
                    const data = await window.DBS2API.getPlayer();
                    this.currentPlayerData = {
                        name: data.user_info?.name || data.user?.name || 'You',
                        uid: data.user_info?.uid || data.user?.uid || '',
                        crypto: data.crypto || 0
                    };
                    console.log('[Leaderboard] Current player:', this.currentPlayerData);
                    return this.currentPlayerData;
                } catch (apiError) {
                    // If DBS2API.getPlayer() fails, try direct fetch as fallback
                    console.log('[Leaderboard] DBS2API.getPlayer() failed, trying direct fetch:', apiError.message);
                }
            }
            
            // Fallback to direct fetch - use getHeaders() which includes Authorization when logged in
            const response = await fetch(`${this.apiBase}/player?_t=${Date.now()}`, {
                method: 'GET',
                credentials: 'include',
                headers: getHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentPlayerData = {
                    name: data.user_info?.name || data.user?.name || 'You',
                    uid: data.user_info?.uid || data.user?.uid || '',
                    crypto: data.crypto || 0
                };
                console.log('[Leaderboard] Current player:', this.currentPlayerData);
                return this.currentPlayerData;
            } else {
                console.warn('[Leaderboard] Failed to fetch current player:', response.status, response.statusText);
                if (response.status === 401) {
                    console.warn('[Leaderboard] 401 Unauthorized - Auth cookie may be missing or expired. Try logging in again.');
                }
            }
        } catch (error) {
            console.log('[Leaderboard] Could not fetch current player (not logged in?):', error.message);
        }
        return null;
    }

    /**
     * Fetch leaderboard data from backend API
     */
    async fetchLeaderboard(limit = 10) {
        try {
            const url = `${this.apiBase}/leaderboard?limit=${limit}`;
            console.log('[Leaderboard] Fetching from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.leaderboard || !Array.isArray(data.leaderboard)) {
                return null;
            }
            
            if (data.leaderboard.length === 0) {
                return null;
            }
            
            const transformedData = data.leaderboard.map(entry => ({
                rank: entry.rank || 0,
                name: entry.user_info?.name || entry.user_info?.uid || 'Unknown',
                uid: entry.user_info?.uid || '',
                score: entry.crypto || 0,
                minigames_completed: entry.minigames_completed || {}
            }));
            
            return transformedData;
        } catch (error) {
            console.error('[Leaderboard] Error fetching leaderboard:', error);
            return null;
        }
    }

    /**
     * Fetch leaderboard data for Games Completed view (more entries, sorted by completions)
     */
    async fetchLeaderboardForGames(limit = 50) {
        const raw = await this.fetchLeaderboard(limit);
        if (!raw || !raw.length) return [];
        const mgCount = (entry) => {
            const m = entry.minigames_completed || {};
            return [m.crypto_miner, m.infinite_user, m.laundry, m.ash_trail, m.whackarat].filter(Boolean).length;
        };
        const sorted = [...raw].sort((a, b) => mgCount(b) - mgCount(a));
        return sorted.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    }

    /**
     * Fetch Ash Trail minigame leaderboard by book
     */
    async fetchAshTrailLeaderboard(book = 'defi_grimoire', limit = 10) {
        try {
            const gameKey = `ash_trail_${book}`;
            const url = `${this.apiBase}/leaderboard/minigame?game=${encodeURIComponent(gameKey)}&limit=${limit}`;
            const response = await fetch(url, { method: 'GET', credentials: 'include', headers: getHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const rows = data.leaderboard || [];

            // Build lookup of best recorded runs per user for this book
            // For guests (uid=_ashtrail_guest), key by name (guest_name) so each guest has own entry
            const runLookup = new Map();
            const guestRunRows = [];  // Runs from guests (no minigame leaderboard entry)
            try {
                const runPayload = await getAshTrailRuns(book, Math.max(limit, 10) * 3);
                if (runPayload?.runs && Array.isArray(runPayload.runs)) {
                    runPayload.runs.forEach((run) => {
                        if (!run || !run.user_info) return;
                        const uid = run.user_info.uid;
                        const name = run.user_info.name || 'Guest';
                        const key = (uid === '_ashtrail_guest') ? `guest:${name}` : (uid || '');
                        if (!key) return;
                        const existing = runLookup.get(key);
                        if (!existing || (Number(run.score) || 0) > (Number(existing.score) || 0)) {
                            runLookup.set(key, run);
                        }
                        if (run.id != null) {
                            this.ashTrailRunCache.set(run.id, run);
                        }
                    });
                    // Build rows for guest runs (not in minigame leaderboard)
                    const minigameUids = new Set((rows || []).map(r => (r.user_info || {}).uid));
                    runLookup.forEach((run, key) => {
                        if (key.startsWith('guest:') && run.user_info?.uid === '_ashtrail_guest') {
                            guestRunRows.push({
                                rank: 0,
                                user_info: run.user_info,
                                score: Number(run.score) || 0
                            });
                        }
                    });
                }
            } catch (runErr) {
                console.warn('[Leaderboard] Unable to load Ash Trail runs:', runErr);
            }

            const allRows = [...rows];
            guestRunRows.sort((a, b) => (b.score || 0) - (a.score || 0));
            guestRunRows.forEach((r, i) => {
                if (!allRows.some(ex => (ex.user_info?.name || ex.user_info?.uid) === (r.user_info?.name || r.user_info?.uid))) {
                    allRows.push({ ...r, rank: allRows.length + 1 });
                }
            });
            allRows.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));

            return allRows.map((entry, idx) => {
                const userInfo = entry.user_info || {};
                const uid = userInfo.uid;
                const name = userInfo.name || 'Unknown';
                const lookupKey = (uid === '_ashtrail_guest') ? `guest:${name}` : uid;
                const bestRun = lookupKey ? runLookup.get(lookupKey) : null;
                const scoreFromEntry = typeof entry.score === 'number' ? entry.score : Number(entry.score ?? NaN);
                const scoreValue = Number.isFinite(scoreFromEntry)
                    ? scoreFromEntry
                    : Number(bestRun?.score ?? 0);

                if (bestRun?.id && !this.ashTrailRunCache.has(bestRun.id)) {
                    this.ashTrailRunCache.set(bestRun.id, bestRun);
                }

                return {
                    rank: entry.rank ?? idx + 1,
                    name: userInfo.name || uid || 'Unknown',
                    score: scoreValue,
                    bookId: book,
                    user: userInfo,
                    runId: bestRun?.id ?? null,
                    runCreatedAt: bestRun?.created_at ?? null
                };
            });
        } catch (e) {
            console.error('[Leaderboard] Ash Trail fetch error:', e);
            return [];
        }
    }

    /**
     * Initialize and render the leaderboard UI
     */
    async init(autoRefresh = false, refreshIntervalMs = 30000) {
        console.log('[Leaderboard] Initializing...');
        
        const existing = document.getElementById('leaderboard-container');
        if (existing) {
            existing.remove();
        }

        // Wait a bit for DBS2API to initialize if it's not ready yet
        let retries = 0;
        while (!window.DBS2API && retries < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        // Give DBS2API.init() a moment to complete if it's still initializing
        if (window.DBS2API) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Fetch both leaderboard and current player data
        const [fetchedData, playerData] = await Promise.all([
            this.fetchLeaderboard(10),
            this.fetchCurrentPlayer()
        ]);
        
        if (fetchedData && fetchedData.length > 0) {
            this.leaderboardData = fetchedData;
        }

        // Create container
        this.container = document.createElement('div');
        this.container.id = 'leaderboard-container';
        this.container.style.cssText = `
            position: fixed;
            top: 75px;
            left: 10px;
            min-width: 280px;
            width: auto;
            max-width: 400px;
            background: rgba(24, 24, 24, 0.95);
            border: 4px solid #666666;
            border-radius: 0;
            padding: 0;
            color: #ffffff;
            font-family: 'Sixtyfour', 'Courier New', monospace;
            font-size: 13px;
            z-index: 1000;
            box-shadow: 6px 6px 0px rgba(0, 0, 0, 0.8), inset 0 0 0 2px rgba(255, 255, 255, 0.1);
            image-rendering: pixelated;
            line-height: 1.2;
            overflow: hidden;
        `;

        // Create header
        const header = document.createElement('div');
        header.id = 'leaderboard-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px;
            border-bottom: 3px solid #666666;
            background: rgba(0, 0, 0, 0.3);
        `;

        const title = document.createElement('span');
        title.textContent = '🏆 LEADERS';
        title.style.cssText = `
            font-size: 14px;
            font-weight: bold;
            text-shadow: 2px 2px 0px rgba(0, 0, 0, 1);
            letter-spacing: 1px;
            color: #ffd700;
        `;

        const tabRow = document.createElement('div');
        tabRow.style.cssText = `display: flex; gap: 4px; margin-top: 6px;`;
        const tabStyle = (active) => `
            background: ${active ? 'rgba(255, 215, 0, 0.25)' : 'rgba(255,255,255,0.08)'};
            border: 2px solid ${active ? '#ffd700' : '#666'};
            color: ${active ? '#ffd700' : '#ccc'};
            cursor: pointer;
            font-size: 10px;
            padding: 4px 8px;
            font-family: 'Sixtyfour', 'Courier New', monospace;
        `;
        const satoshisTab = document.createElement('button');
        satoshisTab.textContent = '💰 Satoshis';
        satoshisTab.id = 'leaderboard-tab-satoshis';
        satoshisTab.style.cssText = tabStyle(false);
        satoshisTab.onclick = () => this.switchTab('satoshis');
        const gamesTab = document.createElement('button');
        gamesTab.textContent = '🎮 Games';
        gamesTab.id = 'leaderboard-tab-games';
        gamesTab.style.cssText = tabStyle(true);
        gamesTab.onclick = () => this.switchTab('games');
        const ashTrailTab = document.createElement('button');
        ashTrailTab.textContent = '📚 Ash Trail';
        ashTrailTab.id = 'leaderboard-tab-ashtrail';
        ashTrailTab.style.cssText = tabStyle(false);
        ashTrailTab.onclick = () => this.switchTab('ashtrail');
        tabRow.appendChild(satoshisTab);
        tabRow.appendChild(gamesTab);
        tabRow.appendChild(ashTrailTab);

        const headerLeft = document.createElement('div');
        headerLeft.appendChild(title);
        headerLeft.appendChild(tabRow);

        const controls = document.createElement('div');
        controls.style.cssText = `display: flex; gap: 6px;`;

        // Refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'leaderboard-refresh-btn';
        refreshBtn.innerHTML = '🔄';
        refreshBtn.title = 'Refresh';
        refreshBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid #666;
            border-radius: 4px;
            color: #fff;
            cursor: pointer;
            font-size: 12px;
            padding: 4px 6px;
            transition: all 0.2s;
            line-height: 1;
        `;
        refreshBtn.onmouseover = () => {
            refreshBtn.style.background = 'rgba(255, 215, 0, 0.3)';
            refreshBtn.style.borderColor = '#ffd700';
        };
        refreshBtn.onmouseout = () => {
            if (!this.isRefreshing) {
                refreshBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                refreshBtn.style.borderColor = '#666';
            }
        };
        refreshBtn.onclick = () => this.manualRefresh();

        // Minimize button
        const minimizeBtn = document.createElement('button');
        minimizeBtn.id = 'leaderboard-minimize-btn';
        minimizeBtn.innerHTML = '−';
        minimizeBtn.title = 'Minimize';
        minimizeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid #666;
            border-radius: 4px;
            color: #fff;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            padding: 2px 8px;
            transition: all 0.2s;
            line-height: 1;
        `;
        minimizeBtn.onmouseover = () => {
            minimizeBtn.style.background = 'rgba(255, 100, 100, 0.3)';
            minimizeBtn.style.borderColor = '#ff6464';
        };
        minimizeBtn.onmouseout = () => {
            minimizeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            minimizeBtn.style.borderColor = '#666';
        };
        minimizeBtn.onclick = () => this.toggleMinimize();

        controls.appendChild(refreshBtn);
        controls.appendChild(minimizeBtn);
        header.appendChild(headerLeft);
        header.appendChild(controls);
        this.container.appendChild(header);

        // Panel: Satoshis
        const panelSatoshis = document.createElement('div');
        panelSatoshis.id = 'leaderboard-panel-satoshis';
        panelSatoshis.style.cssText = 'display: none;';
        const entriesContainer = document.createElement('div');
        entriesContainer.id = 'leaderboard-entries';
        entriesContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 10px;
            transition: all 0.3s ease;
        `;
        this.leaderboardData.forEach((entry, index) => {
            const entryElement = this.createEntry(entry, index);
            entriesContainer.appendChild(entryElement);
        });
        panelSatoshis.appendChild(entriesContainer);
        this.container.appendChild(panelSatoshis);

        // Panel: Games Completed (main default)
        const panelGames = document.createElement('div');
        panelGames.id = 'leaderboard-panel-games';
        panelGames.style.cssText = 'display: block; padding: 10px;';
        const gamesEntries = document.createElement('div');
        gamesEntries.id = 'leaderboard-games-entries';
        gamesEntries.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';
        panelGames.appendChild(gamesEntries);
        this.container.appendChild(panelGames);

        // Panel: Ash Trail
        const panelAshTrail = document.createElement('div');
        panelAshTrail.id = 'leaderboard-panel-ashtrail';
        panelAshTrail.style.cssText = 'display: none;';
        const ashTrailSelectRow = document.createElement('div');
        ashTrailSelectRow.style.cssText = 'padding: 8px 10px; border-bottom: 2px solid #666; display: flex; align-items: center; gap: 8px;';
        const ashTrailSelect = document.createElement('select');
        ashTrailSelect.id = 'leaderboard-ashtrail-book';
        ashTrailSelect.style.cssText = 'background: rgba(0,0,0,0.5); color: #fff; border: 2px solid #666; font-size: 11px; padding: 4px 6px;';
        ashTrailSelect.innerHTML = '<option value="defi_grimoire">DeFi Grimoire</option><option value="lost_ledger">Lost Ledger</option><option value="proof_of_burn">Proof-of-Burn</option>';
        ashTrailSelect.value = this.ashTrailBook;
        ashTrailSelect.onchange = () => { this.ashTrailBook = ashTrailSelect.value; this.switchTab('ashtrail'); };
        ashTrailSelectRow.appendChild(document.createTextNode('Book:'));
        ashTrailSelectRow.appendChild(ashTrailSelect);
        panelAshTrail.appendChild(ashTrailSelectRow);
        const ashTrailEntries = document.createElement('div');
        ashTrailEntries.id = 'leaderboard-ashtrail-entries';
        ashTrailEntries.style.cssText = 'display: flex; flex-direction: column; gap: 4px; padding: 10px;';
        panelAshTrail.appendChild(ashTrailEntries);
        this.container.appendChild(panelAshTrail);

        // Create YOUR CRYPTO section
        const yourSection = document.createElement('div');
        yourSection.id = 'leaderboard-your-crypto';
        yourSection.style.cssText = `
            border-top: 3px solid #666666;
            padding: 10px;
            background: rgba(0, 255, 100, 0.1);
            transition: all 0.3s ease;
        `;
        
        this.renderYourCrypto(yourSection);
        this.container.appendChild(yourSection);

        document.body.appendChild(this.container);

        // Load default tab data (Games is main)
        await this.switchTab(this.currentTab);

        if (autoRefresh) {
            this.startAutoRefresh(refreshIntervalMs);
        }
    }

    /**
     * Render the "YOUR CRYPTO" section
     */
    renderYourCrypto(container) {
        if (!container) {
            container = document.getElementById('leaderboard-your-crypto');
        }
        if (!container) return;

        const player = this.currentPlayerData;
        const isInLeaderboard = player && this.leaderboardData.some(e => e.uid === player.uid);
        
        // Find player's rank if they're in the full leaderboard
        let playerRank = '?';
        if (player && isInLeaderboard) {
            const entry = this.leaderboardData.find(e => e.uid === player.uid);
            if (entry) playerRank = entry.rank;
        }

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px;">
                <div style="white-space: nowrap;">
                    <div style="font-size: 10px; color: #888; margin-bottom: 4px;">YOUR CRYPTO</div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: #0f0; font-size: 11px;">${player ? player.name : 'Not logged in'}</span>
                        ${player && isInLeaderboard ? `<span style="color: #ffd700; font-size: 10px;">#${playerRank}</span>` : ''}
                    </div>
                </div>
                <div style="text-align: right; white-space: nowrap;">
                    <span id="your-crypto-value" style="font-size: 18px; font-weight: bold; color: #0f0; text-shadow: 2px 2px 0px rgba(0, 0, 0, 1);">
                        ${player ? player.crypto.toLocaleString() : '---'}
                    </span>
                    <span style="font-size: 12px; color: #0f0;"> 🪙</span>
                </div>
            </div>
        `;
    }

    /**
     * Create a leaderboard entry element
     */
    createEntry(entry, index) {
        const isCurrentPlayer = this.currentPlayerData && entry.uid === this.currentPlayerData.uid;
        
        const entryDiv = document.createElement('div');
        entryDiv.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 8px;
            background: ${isCurrentPlayer ? 'rgba(0, 255, 100, 0.2)' : index === 0 ? 'rgba(255, 215, 0, 0.15)' : index % 2 === 0 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.06)'};
            border: 2px solid ${isCurrentPlayer ? '#0f0' : index === 0 ? '#ffd700' : '#444444'};
            border-left-width: ${isCurrentPlayer || index === 0 ? '4px' : '2px'};
            font-size: 11px;
            line-height: 1.4;
            white-space: nowrap;
        `;

        // Rank
        const rankSpan = document.createElement('span');
        rankSpan.textContent = `#${entry.rank}`;
        rankSpan.style.cssText = `
            font-weight: bold;
            color: ${isCurrentPlayer ? '#0f0' : index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff'};
            min-width: 28px;
            text-shadow: 2px 2px 0px rgba(0, 0, 0, 1);
            font-size: ${index === 0 ? '12px' : '11px'};
        `;

        // Name
        const nameSpan = document.createElement('span');
        const displayName = entry.name.length > 10 ? entry.name.substring(0, 9) + '…' : entry.name;
        nameSpan.textContent = isCurrentPlayer ? `${displayName} (YOU)` : displayName;
        nameSpan.title = entry.name;
        nameSpan.style.cssText = `
            flex: 1;
            margin-left: 6px;
            text-transform: uppercase;
            font-weight: ${isCurrentPlayer || index === 0 ? 'bold' : 'normal'};
            color: ${isCurrentPlayer ? '#0f0' : index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff'};
            text-shadow: 2px 2px 0px rgba(0, 0, 0, 1);
            letter-spacing: 0.5px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;

        // Score
        const scoreSpan = document.createElement('span');
        scoreSpan.textContent = entry.score.toLocaleString();
        scoreSpan.style.cssText = `
            font-weight: bold;
            color: ${isCurrentPlayer ? '#0f0' : index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#a0a0a0'};
            text-shadow: 2px 2px 0px rgba(0, 0, 0, 1);
            font-family: 'Courier New', monospace;
            font-size: 11px;
            white-space: nowrap;
        `;

        entryDiv.appendChild(rankSpan);
        entryDiv.appendChild(nameSpan);
        entryDiv.appendChild(scoreSpan);

        return entryDiv;
    }

    /**
     * Manual refresh triggered by button
     */
    async manualRefresh() {
        if (this.isRefreshing) return;
        
        const refreshBtn = document.getElementById('leaderboard-refresh-btn');
        if (refreshBtn) {
            this.isRefreshing = true;
            refreshBtn.style.animation = 'spin 0.5s linear infinite';
            refreshBtn.style.background = 'rgba(255, 215, 0, 0.3)';
            refreshBtn.style.borderColor = '#ffd700';
            
            if (!document.getElementById('leaderboard-spin-style')) {
                const style = document.createElement('style');
                style.id = 'leaderboard-spin-style';
                style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
                document.head.appendChild(style);
            }
        }
        
        await this.refresh();
        
        if (refreshBtn) {
            this.isRefreshing = false;
            refreshBtn.style.animation = '';
            refreshBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            refreshBtn.style.borderColor = '#666';
        }
    }

    /**
     * Switch leaderboard tab (satoshis | games | ashtrail)
     */
    async switchTab(tab) {
        this.currentTab = tab;
        const panels = ['leaderboard-panel-satoshis', 'leaderboard-panel-games', 'leaderboard-panel-ashtrail'];
        const tabs = ['leaderboard-tab-satoshis', 'leaderboard-tab-games', 'leaderboard-tab-ashtrail'];
        const tabKeys = ['satoshis', 'games', 'ashtrail'];
        panels.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) el.style.display = tabKeys[i] === tab ? 'block' : 'none';
        });
        tabs.forEach((id, i) => {
            const btn = document.getElementById(id);
            if (btn) {
                const active = tabKeys[i] === tab;
                btn.style.background = active ? 'rgba(255, 215, 0, 0.25)' : 'rgba(255,255,255,0.08)';
                btn.style.borderColor = active ? '#ffd700' : '#666';
                btn.style.color = active ? '#ffd700' : '#ccc';
            }
        });
        if (tab === 'games') {
            this.gamesData = await this.fetchLeaderboardForGames(50);
            this.renderGamesPanel();
        } else if (tab === 'ashtrail') {
            const book = document.getElementById('leaderboard-ashtrail-book')?.value || this.ashTrailBook;
            this.ashTrailBook = book;
            this.ashTrailRunCache = new Map();
            this.ashTrailData = await this.fetchAshTrailLeaderboard(book, 10);
            this.renderAshTrailPanel();
        }
    }

    /**
     * Render Games Completed panel (icons for each minigame)
     */
    renderGamesPanel() {
        const container = document.getElementById('leaderboard-games-entries');
        if (!container) return;
        const gameIcons = [
            { key: 'crypto_miner', icon: '⛏️', title: 'Crypto Miner' },
            { key: 'infinite_user', icon: '💻', title: 'Infinite User' },
            { key: 'laundry', icon: '📋', title: 'Laundry' },
            { key: 'ash_trail', icon: '📚', title: 'Ash Trail' },
            { key: 'whackarat', icon: '🔐', title: 'Whackarat' }
        ];
        if (!this.gamesData || !this.gamesData.length) {
            container.innerHTML = '<div style="color:#888;font-size:11px;padding:8px;">No data. Refresh?</div>';
            return;
        }
        container.innerHTML = '';
        this.gamesData.slice(0, 15).forEach((entry, index) => {
            const m = entry.minigames_completed || {};
            const isCurrent = this.currentPlayerData && entry.uid === this.currentPlayerData.uid;
            const row = document.createElement('div');
            row.style.cssText = `
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 5px 8px;
                background: ${isCurrent ? 'rgba(0, 255, 100, 0.2)' : index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)'};
                border: 2px solid ${isCurrent ? '#0f0' : '#444'};
                font-size: 10px;
            `;
            const rankSpan = document.createElement('span');
            rankSpan.textContent = `#${entry.rank}`;
            rankSpan.style.cssText = `font-weight: bold; min-width: 24px; color: ${index < 3 ? '#ffd700' : '#aaa'};`;
            const nameSpan = document.createElement('span');
            const displayName = (entry.name || '').length > 10 ? (entry.name || '').substring(0, 9) + '…' : (entry.name || '?');
            nameSpan.textContent = isCurrent ? `${displayName} (YOU)` : displayName;
            nameSpan.style.cssText = `flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;
            const iconsWrap = document.createElement('span');
            iconsWrap.style.cssText = 'display: flex; gap: 2px;';
            gameIcons.forEach(g => {
                    const done = m[g.key];
                    const span = document.createElement('span');
                    span.title = g.title + (done ? ' ✓' : '');
                    span.textContent = g.icon;
                    span.style.cssText = done
                        ? 'font-size: 11px; filter: drop-shadow(0 0 4px #0f0) drop-shadow(0 0 2px #0f0);'
                        : 'font-size: 11px; opacity: 0.3; filter: grayscale(1);';
                    iconsWrap.appendChild(span);
                });
            row.appendChild(rankSpan);
            row.appendChild(nameSpan);
            row.appendChild(iconsWrap);
            container.appendChild(row);
        });
    }

    /**
     * Render Ash Trail panel
     */
    renderAshTrailPanel() {
        const container = document.getElementById('leaderboard-ashtrail-entries');
        if (!container) return;
        if (!this.ashTrailData || !this.ashTrailData.length) {
            container.innerHTML = '<div style="color:#888;font-size:11px;padding:8px;">No scores yet</div>';
            return;
        }
        container.innerHTML = '';
        this.ashTrailData.forEach((entry, index) => {
            const row = document.createElement('div');
            row.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px 8px;
                background: ${index === 0 ? 'rgba(134, 239, 172, 0.1)' : index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)'};
                border: 2px solid ${index === 0 ? '#86efac' : '#444'};
                font-size: 11px;
            `;
            const left = document.createElement('span');
            const displayName = (entry.name || '').length > 10 ? (entry.name || '').substring(0, 9) + '…' : (entry.name || '?');
            left.textContent = `#${entry.rank} ${displayName}`;
            const rightWrap = document.createElement('span');
            rightWrap.style.cssText = 'display:flex; align-items:center; gap:6px;';

            const scoreValue = Math.max(0, Math.min(100, Math.round(Number(entry.score) || 0)));
            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = `${scoreValue}%`;
            scoreSpan.style.color = '#86efac';

            const playBtn = document.createElement('button');
            playBtn.textContent = entry.runId ? '▶' : '—';
            playBtn.style.cssText = `
                background: rgba(255,255,255,0.08);
                border: 2px solid #666;
                color: ${entry.runId ? '#fff' : '#555'};
                font-size: 10px;
                padding: 2px 6px;
                cursor: ${entry.runId ? 'pointer' : 'not-allowed'};
                border-radius: 4px;
            `;
            playBtn.title = entry.runId ? 'Play replay' : 'Replay not available';
            playBtn.disabled = !entry.runId;
            if (entry.runId) {
                playBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.handleAshTrailPlay(entry, playBtn);
                });
            }

            rightWrap.appendChild(scoreSpan);
            rightWrap.appendChild(playBtn);

            row.appendChild(left);
            row.appendChild(rightWrap);
            container.appendChild(row);
        });
    }

    async handleAshTrailPlay(entry, button) {
        if (!entry?.runId) {
            window.alert('Replay not available for this player yet.');
            return;
        }

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = '…';

        try {
            let run = this.ashTrailRunCache.get(entry.runId);
            // Cached runs from list API don't include trace - always fetch full run for replay
            const needsTrace = !run || !Array.isArray(run.trace) || run.trace.length === 0;
            if (needsTrace) {
                const payload = await getAshTrailRun(entry.runId);
                if (payload?.run) {
                    run = payload.run;
                    this.ashTrailRunCache.set(entry.runId, run);
                }
            }

            if (!run || !Array.isArray(run.trace) || run.trace.length === 0) {
                window.alert('Replay data is not yet available. Please try again later.');
                return;
            }

            await showAshTrailReplay(run, {
                bookId: entry.bookId,
                playerName: entry.name,
                score: entry.score,
                rank: entry.rank
            });
        } catch (err) {
            console.error('[Leaderboard] Failed to open Ash Trail replay:', err);
            window.alert('Unable to load replay. Please try again.');
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    /**
     * Toggle minimize state
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        
        const entriesContainer = document.getElementById('leaderboard-entries');
        const yourCrypto = document.getElementById('leaderboard-your-crypto');
        const gamesEntries = document.getElementById('leaderboard-games-entries');
        const ashTrailEntries = document.getElementById('leaderboard-ashtrail-entries');
        const panelAshTrail = document.getElementById('leaderboard-panel-ashtrail');
        const minimizeBtn = document.getElementById('leaderboard-minimize-btn');
        
        const collapse = (el, maxH, pad) => {
            if (!el) return;
            el.style.maxHeight = this.isMinimized ? '0' : maxH;
            el.style.padding = this.isMinimized ? '0 10px' : pad;
            el.style.opacity = this.isMinimized ? '0' : '1';
        };
        if (entriesContainer) collapse(entriesContainer, '500px', '10px');
        if (gamesEntries) collapse(gamesEntries, '400px', '10px');
        if (ashTrailEntries) collapse(ashTrailEntries, '400px', '10px');
        if (panelAshTrail && panelAshTrail.querySelector('div')) {
            const first = panelAshTrail.firstElementChild;
            if (first) {
                first.style.maxHeight = this.isMinimized ? '0' : 'none';
                first.style.overflow = this.isMinimized ? 'hidden' : 'visible';
            }
        }
        
        if (yourCrypto) {
            yourCrypto.style.maxHeight = this.isMinimized ? '0' : '100px';
            yourCrypto.style.padding = this.isMinimized ? '0 10px' : '10px';
            yourCrypto.style.opacity = this.isMinimized ? '0' : '1';
            yourCrypto.style.borderTop = this.isMinimized ? 'none' : '3px solid #666666';
        }
        
        if (minimizeBtn) {
            minimizeBtn.innerHTML = this.isMinimized ? '+' : '−';
            minimizeBtn.title = this.isMinimized ? 'Expand' : 'Minimize';
        }
    }

    /**
     * Update leaderboard data from backend and refresh the display
     */
    async refresh(limit = 10) {
        console.log('[Leaderboard] Refreshing data...');
        
        const [newData, playerData] = await Promise.all([
            this.fetchLeaderboard(limit),
            this.fetchCurrentPlayer()
        ]);
        
        if (newData && newData.length > 0) {
            this.updateData(newData);
        }
        
        // Update YOUR CRYPTO section
        this.renderYourCrypto();

        // Refresh visible tab data
        if (this.currentTab === 'games') {
            this.gamesData = await this.fetchLeaderboardForGames(50);
            this.renderGamesPanel();
        } else if (this.currentTab === 'ashtrail') {
            this.ashTrailData = await this.fetchAshTrailLeaderboard(this.ashTrailBook, 10);
            this.renderAshTrailPanel();
        }
    }

    /**
     * Update leaderboard data
     */
    updateData(newData) {
        this.leaderboardData = newData;
        if (this.container) {
            const entriesContainer = document.getElementById('leaderboard-entries');
            if (entriesContainer) {
                entriesContainer.innerHTML = '';
                this.leaderboardData.forEach((entry, index) => {
                    const entryElement = this.createEntry(entry, index);
                    entriesContainer.appendChild(entryElement);
                });
            }
        }
    }

    /**
     * Start automatic refresh
     */
    startAutoRefresh(intervalMs = 30000) {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            this.refresh();
        }, intervalMs);
    }

    /**
     * Stop automatic refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    toggle() {
        this.isVisible = !this.isVisible;
        if (this.container) {
            this.container.style.display = this.isVisible ? 'block' : 'none';
        }
    }

    show() {
        this.isVisible = true;
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    hide() {
        this.isVisible = false;
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    destroy() {
        this.stopAutoRefresh();
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}

window.Leaderboard = Leaderboard;
export default Leaderboard;