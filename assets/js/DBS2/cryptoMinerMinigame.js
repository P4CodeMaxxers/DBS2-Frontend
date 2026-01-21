// cryptoMinerMinigame.js - Rewards SATOSHIS
// Change: Replace updateCrypto() with rewardMinigame()

import { rewardMinigame, completeMinigame, isMinigameCompleted, addInventoryItem, getCoinPrice } from './StatsManager.js';
import Prompt from './Prompt.js';

const MINIGAME_NAME = 'crypto_miner';
const COIN_NAME = 'Satoshis';
const COIN_SYMBOL = 'SATS';

// Supported cryptocurrencies (for display rotation)
const CRYPTO_COINS = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: '#f7931a' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: '#627eea' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', color: '#00ffa3' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', color: '#0033ad' },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', color: '#c2a633' }
];

// Function to be called by Computer2 - Educational Proof of Work Mining
function cryptoMinerMinigame() {
    if (window.cryptoMinerActive) return;
    window.cryptoMinerActive = true;
    window.minigameActive = true;
    
    const baseurl = document.body.getAttribute('data-baseurl') || '';
    
    // Game state
    let currentCoin = null;
    let coinPrice = 0;
    let coinChange24h = 0;
    let boostMultiplier = 1.0;
    let isFirstCompletion = false;
    let gameStarted = false;
    
    // Proof of Work state
    let currentHash = '';
    let targetPrefix = '00';
    let validHashes = 0;
    let totalAttempts = 0;
    let blocksCompleted = 0;
    const hashesPerBlock = 12;
    const totalBlocks = 3;
    
    // Timing
    let coinRotationInterval = null;
    let lastAttemptTime = Date.now();
    let recentAttempts = [];
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'crypto-miner-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Courier New', monospace;
    `;
    document.body.appendChild(overlay);
    
    showEducationalIntro();
    
    function showEducationalIntro() {
        const intro = document.createElement('div');
        intro.id = 'mining-intro';
        intro.style.cssText = `
            background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
            border: 2px solid #0f0;
            border-radius: 15px;
            padding: 30px;
            max-width: 600px;
            color: #eee;
            text-align: left;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        intro.innerHTML = `
            <h2 style="color: #f7931a; text-align: center; margin-bottom: 20px;">
                ⛏️ HOW CRYPTO MINING WORKS
            </h2>
            
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="color: #0f0; margin: 0 0 10px 0;">What is Mining?</h3>
                <p style="margin: 0; line-height: 1.6; color: #ccc;">
                    Crypto miners compete to add new transactions to the blockchain. 
                    They do this by solving a computational puzzle called <span style="color: #0f0;">Proof of Work</span>.
                </p>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="color: #0f0; margin: 0 0 10px 0;">What is a Hash?</h3>
                <p style="margin: 0; line-height: 1.6; color: #ccc;">
                    A <span style="color: #0f0;">hash</span> is a scrambled fingerprint of data. 
                    Any input produces a unique, fixed-length output:
                </p>
                <div style="background: #000; padding: 10px; margin-top: 10px; border-radius: 4px; font-size: 15px;">
                    <div>"hello" → <span style="color: #f7931a;">2cf24dba5fb0a30e...</span></div>
                    <div>"hello!" → <span style="color: #f7931a;">9b71d224bd62f378...</span></div>
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="color: #0f0; margin: 0 0 10px 0;">The Challenge</h3>
                <p style="margin: 0; line-height: 1.6; color: #ccc;">
                    Miners must find a hash that starts with zeros (like <span style="color: #0f0;">0000...</span>).
                    They guess random numbers until they find one. Most attempts fail!
                </p>
            </div>
            
            <div style="background: rgba(247,147,26,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f7931a;">
                <h3 style="color: #f7931a; margin: 0 0 10px 0;">Your Mission</h3>
                <p style="margin: 0; line-height: 1.6; color: #ccc;">
                    Press <span style="color: #0f0; font-weight: bold;">SPACE</span> to generate hashes. 
                    Find hashes starting with zeros to mine blocks!
                    <br><br>
                    💰 <strong>Earn ${COIN_NAME}</strong> based on blocks mined!
                </p>
            </div>
            
            <button id="start-mining-btn" style="
                width: 100%;
                padding: 15px;
                font-size: 18px;
                background: linear-gradient(135deg, #0f0 0%, #050 100%);
                border: none;
                border-radius: 8px;
                color: #000;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-weight: bold;
            ">START MINING</button>
        `;
        
        overlay.appendChild(intro);
        
        document.getElementById('start-mining-btn').onclick = () => {
            intro.remove();
            startMiningGame();
        };
    }
    
    async function startMiningGame() {
        gameStarted = true;
        
        try {
            isFirstCompletion = !(await isMinigameCompleted(MINIGAME_NAME));
            console.log('[CryptoMiner] First completion:', isFirstCompletion);
        } catch (e) {
            isFirstCompletion = true;
        }
        
        await selectRandomCoin();
        
        coinRotationInterval = setInterval(async () => {
            await selectRandomCoin();
            updateCoinDisplay();
        }, 60000);
        
        createMiningUI();
        setupKeyboardHandler();
    }
    
    async function selectRandomCoin() {
        currentCoin = CRYPTO_COINS[Math.floor(Math.random() * CRYPTO_COINS.length)];
        await fetchCoinPrice();
    }
    
    async function fetchCoinPrice() {
        try {
            const data = await getCoinPrice(currentCoin.id);
            coinPrice = data.price_usd || 0;
            coinChange24h = data.change_24h || 0;
            boostMultiplier = data.boost_multiplier || 1.0;
            return;
        } catch (e) {
            console.log('Coin price fetch failed, using simulation');
        }
        
        const simulated = {
            'bitcoin': 95000,
            'ethereum': 3500,
            'solana': 150,
            'cardano': 0.5,
            'dogecoin': 0.1
        };
        coinPrice = simulated[currentCoin.id] || 100;
        coinChange24h = (Math.random() * 20) - 10;
        calculateBoost();
    }
    
    function calculateBoost() {
        if (coinChange24h >= 5) boostMultiplier = 1.5;
        else if (coinChange24h >= 2) boostMultiplier = 1.25;
        else if (coinChange24h >= 0) boostMultiplier = 1.0;
        else if (coinChange24h >= -2) boostMultiplier = 0.85;
        else boostMultiplier = 0.7;
    }
    
    function createMiningUI() {
        const ui = document.createElement('div');
        ui.id = 'mining-ui';
        ui.style.cssText = `
            background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
            border: 2px solid #f7931a;
            border-radius: 15px;
            padding: 25px;
            width: 700px;
            max-width: 95%;
            color: #eee;
        `;
        
        ui.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: #f7931a; margin: 0;">⛏️ MINING TERMINAL</h2>
                <button id="exit-mining" style="background: #600; color: #ccc; border: 1px solid #800; padding: 8px 15px; cursor: pointer; font-family: monospace;">EXIT</button>
            </div>
            
            <div id="coin-display" style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="color: #888;">Currently Mining:</span>
                    <span id="coin-name" style="color: ${currentCoin?.color || '#f7931a'}; font-weight: bold; margin-left: 10px;">${currentCoin?.name || 'Bitcoin'}</span>
                </div>
                <div style="text-align: right;">
                    <div style="color: #888; font-size: 15px;">Price: $<span id="coin-price">${coinPrice.toLocaleString()}</span></div>
                    <div style="font-size: 15px;"><span id="coin-change" style="color: ${coinChange24h >= 0 ? '#0f0' : '#f00'};">${coinChange24h >= 0 ? '+' : ''}${coinChange24h.toFixed(2)}%</span> (24h)</div>
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.4); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="color: #888; font-size: 15px; margin-bottom: 5px;">Current Hash:</div>
                <div id="hash-display" style="font-family: monospace; font-size: 17px; color: #0f0; word-break: break-all;">Press SPACE to mine...</div>
                <div id="hash-result" style="margin-top: 10px; font-size: 16px; color: #888;"></div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">
                <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="color: #888; font-size: 17px;">Block Progress</div>
                    <div style="font-size: 18px; color: #f7931a;"><span id="valid-count">0</span>/${hashesPerBlock}</div>
                    <div style="background: #333; height: 6px; border-radius: 3px; margin-top: 5px;">
                        <div id="block-progress" style="background: #f7931a; height: 100%; border-radius: 3px; width: 0%; transition: width 0.3s;"></div>
                    </div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="color: #888; font-size: 17px;">Blocks Mined</div>
                    <div style="font-size: 18px; color: #0f0;"><span id="current-block">1</span>/${totalBlocks}</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="color: #888; font-size: 17px;">Est. ${COIN_SYMBOL}</div>
                    <div style="font-size: 18px; color: #f7931a;"><span id="est-reward">0</span></div>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; color: #666; font-size: 17px;">
                <span>Attempts: <span id="total-attempts">0</span></span>
                <span>Hash Rate: <span id="hash-rate">0</span>/sec</span>
                <span>Difficulty: "${targetPrefix}..."</span>
                <span>Boost: <span id="boost-mult">${boostMultiplier.toFixed(2)}x</span></span>
            </div>
        `;
        
        overlay.appendChild(ui);
        
        document.getElementById('exit-mining').onclick = exitMiner;
    }
    
    function updateCoinDisplay() {
        const nameEl = document.getElementById('coin-name');
        const priceEl = document.getElementById('coin-price');
        const changeEl = document.getElementById('coin-change');
        const boostEl = document.getElementById('boost-mult');
        
        if (nameEl) {
            nameEl.textContent = currentCoin?.name || 'Bitcoin';
            nameEl.style.color = currentCoin?.color || '#f7931a';
        }
        if (priceEl) priceEl.textContent = coinPrice.toLocaleString();
        if (changeEl) {
            changeEl.textContent = `${coinChange24h >= 0 ? '+' : ''}${coinChange24h.toFixed(2)}%`;
            changeEl.style.color = coinChange24h >= 0 ? '#0f0' : '#f00';
        }
        if (boostEl) boostEl.textContent = `${boostMultiplier.toFixed(2)}x`;
    }
    
    function generateHash() {
        const chars = '0123456789abcdef';
        let hash = '';
        for (let i = 0; i < 64; i++) {
            hash += chars[Math.floor(Math.random() * chars.length)];
        }
        return hash;
    }
    
    function attemptMine() {
        const now = Date.now();
        recentAttempts = recentAttempts.filter(t => now - t < 1000);
        recentAttempts.push(now);
        
        totalAttempts++;
        const hash = generateHash();
        currentHash = hash;
        
        const isValid = hash.startsWith(targetPrefix);
        
        const hashDisplay = document.getElementById('hash-display');
        const hashResult = document.getElementById('hash-result');
        const attemptsEl = document.getElementById('total-attempts');
        const hashRateEl = document.getElementById('hash-rate');
        
        if (hashDisplay) {
            if (isValid) {
                hashDisplay.innerHTML = `<span style="color: #0f0; font-weight: bold;">${targetPrefix}</span>${hash.slice(targetPrefix.length)}`;
            } else {
                hashDisplay.innerHTML = `<span style="color: #f00;">${hash.slice(0, targetPrefix.length)}</span>${hash.slice(targetPrefix.length)}`;
            }
        }
        
        if (hashResult) {
            if (isValid) {
                hashResult.innerHTML = `<span style="color: #0f0;">✓ VALID HASH! Starts with "${targetPrefix}"</span>`;
                validHashes++;
                updateBlockProgress();
            } else {
                hashResult.innerHTML = `<span style="color: #f66;">✗ Invalid - doesn't start with "${targetPrefix}"</span>`;
            }
        }
        
        if (attemptsEl) attemptsEl.textContent = totalAttempts;
        if (hashRateEl) hashRateEl.textContent = recentAttempts.length;
        
        lastAttemptTime = now;
    }
    
    function updateBlockProgress() {
        const progressEl = document.getElementById('block-progress');
        const validEl = document.getElementById('valid-count');
        const blockEl = document.getElementById('current-block');
        
        const progress = (validHashes % hashesPerBlock) / hashesPerBlock * 100;
        if (progressEl) progressEl.style.width = `${progress}%`;
        if (validEl) validEl.textContent = validHashes % hashesPerBlock || (validHashes > 0 ? hashesPerBlock : 0);
        
        if (validHashes > 0 && validHashes % hashesPerBlock === 0) {
            blocksCompleted++;
            
            if (blocksCompleted >= totalBlocks) {
                completeMining();
            } else {
                targetPrefix += '0';
                if (blockEl) blockEl.textContent = blocksCompleted + 1;
                showBlockComplete();
            }
        }
        
        updateEstReward();
    }
    
    function updateEstReward() {
        const rewardEl = document.getElementById('est-reward');
        if (rewardEl) {
            const baseReward = blocksCompleted * 100 + Math.floor((validHashes % hashesPerBlock) * 8);
            const boostedReward = Math.floor(baseReward * boostMultiplier);
            rewardEl.textContent = boostedReward;
        }
    }
    
    function showBlockComplete() {
        const hashResult = document.getElementById('hash-result');
        if (hashResult) {
            hashResult.innerHTML = `
                <span style="color: #f7931a; font-weight: bold;">
                    🎉 BLOCK ${blocksCompleted} MINED! Difficulty increased to "${targetPrefix}..."
                </span>
            `;
        }
    }
    
    async function completeMining() {
        gameStarted = false;
        if (coinRotationInterval) clearInterval(coinRotationInterval);
        
        // Calculate rewards
        const baseReward = totalBlocks * 100;
        let satoshiReward = Math.floor(baseReward * boostMultiplier);
        
        if (isFirstCompletion) {
            satoshiReward += 250;
        }
        
        // *** KEY CHANGE: Use rewardMinigame instead of updateCrypto ***
        try {
            await rewardMinigame(MINIGAME_NAME, satoshiReward);
            await completeMinigame(MINIGAME_NAME);
            
            if (isFirstCompletion) {
                await addInventoryItem({
                    name: 'Code Scrap: Crypto Miner',
                    found_at: MINIGAME_NAME,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (e) {
            console.log('Could not save progress:', e);
        }
        
        showCompletionScreen(satoshiReward);
    }
    
    function showCompletionScreen(satoshiReward) {
        const ui = document.getElementById('mining-ui');
        if (ui) ui.remove();
        
        const complete = document.createElement('div');
        complete.style.cssText = `
            background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
            border: 2px solid #f7931a;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            max-width: 450px;
        `;
        
        let html = `
            <h2 style="color: #f7931a; margin: 0 0 20px 0;">⛏️ MINING COMPLETE!</h2>
            <p style="color: #888; margin-bottom: 20px;">You successfully mined ${totalBlocks} blocks!</p>
            
            <div style="background: rgba(0,0,0,0.4); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="font-size: 17px; color: #888;">${COIN_NAME} Earned</div>
                <div style="font-size: 32px; color: #f7931a; font-weight: bold;">${satoshiReward} ${COIN_SYMBOL}</div>
                ${isFirstCompletion ? '<div style="color: #0f0; font-size: 15px;">+250 first completion bonus!</div>' : ''}
            </div>
            
            <div style="background: rgba(0,255,0,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left; font-size: 16px; color: #aaa;">
                <strong style="color: #0f0;">📚 What you learned:</strong><br>
                • Miners guess random numbers (nonces) to find valid hashes<br>
                • Valid hashes must start with zeros (difficulty)<br>
                • More zeros = harder to find = more secure blockchain
            </div>
        `;
        
        if (isFirstCompletion) {
            html += `
                <div style="background: rgba(247,147,26,0.2); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f7931a;">
                    <div style="font-size: 17px; color: #f7931a;">🧩 CODE SCRAP FOUND!</div>
                    <div style="font-size: 15px; color: #888; margin-top: 5px;">Added to inventory</div>
                </div>
            `;
        }
        
        html += `<button id="close-complete" style="
            background: linear-gradient(135deg, #0f0 0%, #050 100%);
            border: none;
            padding: 15px 40px;
            color: #000;
            font-size: 16px;
            cursor: pointer;
            border-radius: 8px;
            font-family: monospace;
            font-weight: bold;
        ">CONTINUE</button>`;
        
        complete.innerHTML = html;
        overlay.appendChild(complete);
        
        document.getElementById('close-complete').onclick = exitMiner;
    }
    
    function setupKeyboardHandler() {
        window.miningKeyHandler = (e) => {
            if (!gameStarted) return;
            
            if (e.code === 'Space') {
                e.preventDefault();
                attemptMine();
            } else if (e.key === 'Escape') {
                exitMiner();
            }
        };
        
        window.addEventListener('keydown', window.miningKeyHandler);
    }
    
    function exitMiner() {
        gameStarted = false;
        window.cryptoMinerActive = false;
        window.minigameActive = false;
        
        if (coinRotationInterval) clearInterval(coinRotationInterval);
        if (window.miningKeyHandler) {
            window.removeEventListener('keydown', window.miningKeyHandler);
            delete window.miningKeyHandler;
        }
        
        if (overlay && overlay.parentNode) {
            overlay.remove();
        }
        
        try {
            if (window.Leaderboard && typeof window.Leaderboard.refresh === 'function') {
                window.Leaderboard.refresh();
            }
        } catch (e) {}
    }
}

export default cryptoMinerMinigame;