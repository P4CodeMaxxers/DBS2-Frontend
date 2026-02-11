// cryptochecker.js
// Crypto Border Control minigame - Rewards DOGECOIN
// Theme: Security Education - identify legitimate crypto vs scams

import { rewardMinigame, isMinigameCompleted, completeMinigame } from './StatsManager.js';

// Use 'whackarat' as MINIGAME_NAME because backend maps whackarat -> dogecoin
// The game is called CryptoChecker/Crypto Border Control but uses legacy backend name
const MINIGAME_NAME = 'whackarat';
const COIN_NAME = 'Dogecoin';
const COIN_SYMBOL = 'DOGE';

// Legitimate crypto terms with explanations
const legitTerms = [
    { term: 'Blockchain', hint: 'Distributed ledger technology' },
    { term: 'Bitcoin', hint: 'First cryptocurrency, created 2009' },
    { term: 'Ethereum', hint: 'Smart contract platform' },
    { term: 'Cold Wallet', hint: 'Offline storage for crypto' },
    { term: 'Smart Contracts', hint: 'Self-executing code on blockchain' },
    { term: 'DeFi', hint: 'Decentralized Finance applications' },
    { term: 'Mining', hint: 'Validating transactions for rewards' },
    { term: 'Staking', hint: 'Locking crypto to earn rewards' },
    { term: 'Hash Rate', hint: 'Mining computational power' },
    { term: 'Public Key', hint: 'Your wallet address (safe to share)' },
    { term: 'Private Key', hint: 'Secret key (NEVER share!)' },
    { term: 'Proof of Work', hint: 'Mining consensus mechanism' },
    { term: 'Proof of Stake', hint: 'Staking consensus mechanism' },
    { term: 'Layer 2', hint: 'Scaling solutions like Lightning' },
    { term: 'Gas Fees', hint: 'Transaction costs on Ethereum' },
    { term: 'DEX', hint: 'Decentralized Exchange' },
    { term: 'HODL', hint: 'Hold On for Dear Life - long term holding' }
];

// Scam terms with explanations
const scamTerms = [
    { term: 'Guaranteed Returns', hint: 'NO investment is guaranteed!' },
    { term: 'Rug Pull', hint: 'Devs abandon project with your money' },
    { term: 'Ponzi Scheme', hint: 'Pays old investors with new money' },
    { term: 'Pump & Dump', hint: 'Artificially inflate then sell' },
    { term: 'Phishing Link', hint: 'Fake sites that steal credentials' },
    { term: 'Fake ICO', hint: 'Fraudulent token offerings' },
    { term: 'Exit Scam', hint: 'Exchange disappears with funds' },
    { term: 'Crypto Doubler', hint: '"Send 1 get 2" is ALWAYS fake' },
    { term: 'Pig Butchering', hint: 'Romance scam + fake investments' },
    { term: 'Honeypot', hint: 'Token you can buy but never sell' },
    { term: 'Celebrity Giveaway', hint: 'Fake Elon/celeb crypto giveaways' },
    { term: 'Recovery Scam', hint: 'Fake help to "recover" lost crypto' },
    { term: 'Cloud Mining Scam', hint: 'Fake remote mining services' },
    { term: 'Airdrop Scam', hint: 'Free tokens that drain your wallet' }
];

export default function startCryptoChecker(containerElement, basePath = '/images/DBS2', onComplete = null) {
    return new Promise(async (resolve) => {
        console.log('[CryptoChecker] Starting game... Rewards:', COIN_NAME);
        
        window.cryptoCheckerActive = true;
        window.minigameActive = true;
        
        let isFirstCompletion = false;
        try {
            isFirstCompletion = !(await isMinigameCompleted(MINIGAME_NAME));
            console.log('[CryptoChecker] First completion:', isFirstCompletion);
        } catch (e) {
            console.log('[CryptoChecker] Could not check completion status:', e);
        }

        let gameState = {
            active: false,
            score: 0,
            correct: 0,
            total: 0,
            timeLeft: 30,
            baseSpawnInterval: 2500,
            maxTermsOnScreen: 4,  // Start with max 4 terms
            activeTerms: [],
            timerInterval: null,
            spawnTimeout: null
        };

        let keydownHandler = null;
        let styleEl = null;

        // Create game HTML with intro screen
        const gameHTML = `
            <div id="cryptoCheckerGame" style="
                width: 900px; 
                max-width: 95vw;
                height: 650px; 
                max-height: 88vh;
                background: linear-gradient(135deg, #0f3460 0%, #16213e 100%); 
                border: 3px solid #c2a633; 
                border-radius: 12px; 
                position: relative; 
                box-shadow: 0 0 30px rgba(194, 166, 51, 0.3); 
                font-family: 'Courier New', monospace;
                display: flex;
                flex-direction: column;
            ">
                <!-- Header -->
                <div id="ccHeader" style="
                    background: rgba(0,0,0,0.4); 
                    padding: 12px 15px; 
                    border-bottom: 2px solid #c2a633; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    flex-shrink: 0;
                ">
                    <div style="font-size: 20px; font-weight: bold; color: #c2a633; text-transform: uppercase;">
                        🛡️ Crypto Border Control
                    </div>
                    <div style="display: flex; gap: 20px; font-size: 14px;">
                        <div style="text-align: center;">
                            <div style="font-size: 10px; color: #888;">TIME</div>
                            <div style="font-size: 18px; font-weight: bold; color: #fff;" id="ccTimer">40</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 10px; color: #888;">SCORE</div>
                            <div style="font-size: 18px; font-weight: bold; color: #c2a633;" id="ccScore">0</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 10px; color: #888;">ACCURACY</div>
                            <div style="font-size: 18px; font-weight: bold; color: #0f0;" id="ccAccuracy">100%</div>
                        </div>
                    </div>
                    <button id="ccExitBtn" style="
                        background: #600;
                        color: #ccc;
                        border: 1px solid #800;
                        padding: 6px 15px;
                        cursor: pointer;
                        font-size: 14px;
                        font-family: 'Courier New', monospace;
                        border-radius: 4px;
                    ">EXIT</button>
                </div>
                
                <!-- Game Area -->
                <div id="ccGameArea" style="flex: 1; position: relative; overflow: hidden;"></div>
                
                <!-- Hint Bar -->
                <div id="ccHintBar" style="
                    background: rgba(0,0,0,0.6);
                    padding: 10px 15px;
                    border-top: 1px solid #333;
                    min-height: 24px;
                    font-size: 14px;
                    color: #888;
                    text-align: center;
                    flex-shrink: 0;
                ">
                    <span id="ccHintText">Hover over terms or use arrow keys to select</span>
                </div>
                
                <!-- Controls -->
                <div id="ccControls" style="
                    background: rgba(0,0,0,0.4); 
                    padding: 12px; 
                    border-top: 2px solid #c2a633; 
                    display: flex; 
                    justify-content: center; 
                    gap: 40px; 
                    font-size: 14px; 
                    color: #ccc;
                    flex-shrink: 0;
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="background: #0a5; padding: 6px 12px; border-radius: 4px; color: #fff; font-weight: bold;">SPACE</span>
                        <span style="color: #0f0;">✓ Legit Tech</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="background: #a00; padding: 6px 12px; border-radius: 4px; color: #fff; font-weight: bold;">BACKSPACE</span>
                        <span style="color: #f66;">✗ Scam/Fraud</span>
                    </div>
                </div>
                
                <!-- Intro Overlay -->
                <div id="ccOverlay" style="
                    position: absolute; 
                    top: 0; left: 0; 
                    width: 100%; height: 100%; 
                    background: rgba(0, 0, 0, 0.95); 
                    display: flex; 
                    flex-direction: column; 
                    justify-content: flex-start; 
                    align-items: center; 
                    z-index: 100; 
                    color: #eee;
                    padding: 20px;
                    box-sizing: border-box;
                    overflow-y: auto;
                ">
                    <h2 style="color: #c2a633; margin-bottom: 15px; font-size: 26px;">
                        🛡️ THE GREEN MACHINE: SECURITY MODULE
                    </h2>
                    
                    <div style="background: rgba(194,166,51,0.15); padding: 12px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #52410a; max-width: 550px;">
                        <p style="margin: 0; color: #c2a633; font-style: italic; text-align: center;">
                            "Know your enemy. Scammers prey on the uninformed. Learn to spot them." - IShowGreen
                        </p>
                    </div>
                    
                    <!-- Two column layout for legit vs scam -->
                    <div style="display: flex; gap: 15px; margin-bottom: 15px; max-width: 700px; width: 100%;">
                        <div style="flex: 1; background: rgba(0,100,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid #0a5;">
                            <h3 style="color: #0f0; margin: 0 0 8px 0; font-size: 14px; text-align: center;">✓ LEGITIMATE (SPACE)</h3>
                            <ul style="margin: 0; padding-left: 18px; color: #aaa; font-size: 12px; line-height: 1.6;">
                                <li><strong style="color: #0f0;">Blockchain</strong> - Real technology</li>
                                <li><strong style="color: #0f0;">Bitcoin/Ethereum</strong> - Established coins</li>
                                <li><strong style="color: #0f0;">Cold Wallet</strong> - Secure storage</li>
                                <li><strong style="color: #0f0;">Smart Contracts</strong> - Programmable transactions</li>
                                <li><strong style="color: #0f0;">DeFi/Staking</strong> - Real protocols</li>
                            </ul>
                        </div>
                        <div style="flex: 1; background: rgba(100,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid #800;">
                            <h3 style="color: #f66; margin: 0 0 8px 0; font-size: 14px; text-align: center;">✗ SCAMS (BACKSPACE)</h3>
                            <ul style="margin: 0; padding-left: 18px; color: #aaa; font-size: 12px; line-height: 1.6;">
                                <li><strong style="color: #f66;">Guaranteed Returns</strong> - NEVER real</li>
                                <li><strong style="color: #f66;">Send 1 Get 2</strong> - Always fake</li>
                                <li><strong style="color: #f66;">Rug Pull</strong> - Devs steal funds</li>
                                <li><strong style="color: #f66;">Celebrity Giveaway</strong> - Impersonators</li>
                                <li><strong style="color: #f66;">Pump & Dump</strong> - Price manipulation</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; margin-bottom: 15px; max-width: 550px;">
                        <h3 style="color: #c2a633; margin: 0 0 8px 0; font-size: 14px;">How To Play</h3>
                        <p style="margin: 0; line-height: 1.6; color: #ccc; font-size: 13px;">
                            Terms appear on screen. The <span style="color: #ff0; font-weight: bold;">SELECTED term</span> has a glowing yellow border.<br>
                            Press <span style="color: #0f0; font-weight: bold;">SPACE</span> if it's legitimate crypto tech.<br>
                            Press <span style="color: #f66; font-weight: bold;">BACKSPACE</span> if it's a scam.<br>
                            One wrong answer = game over!
                        </p>
                    </div>
                    
                    <div style="background: rgba(194,166,51,0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #52410a; max-width: 550px; text-align: center;">
                        <p style="margin: 0; color: #c2a633; font-size: 13px;">
                            💰 Earn <strong>${COIN_NAME} (${COIN_SYMBOL})</strong> to buy the Security Protocol scrap!
                        </p>
                    </div>
                    
                    <button id="ccStartButton" style="
                        background: linear-gradient(135deg, #c2a633 0%, #8b7320 100%);
                        color: #000;
                        border: none;
                        padding: 14px 35px;
                        font-size: 16px;
                        font-weight: bold;
                        border-radius: 8px;
                        cursor: pointer;
                        font-family: 'Courier New', monospace;
                    ">START SECURITY TRAINING</button>
                </div>
            </div>
        `;

        containerElement.innerHTML = gameHTML;

        const gameArea = document.getElementById('ccGameArea');
        const overlay = document.getElementById('ccOverlay');
        const startButton = document.getElementById('ccStartButton');
        const exitBtn = document.getElementById('ccExitBtn');
        const timerEl = document.getElementById('ccTimer');
        const scoreEl = document.getElementById('ccScore');
        const accuracyEl = document.getElementById('ccAccuracy');
        const hintText = document.getElementById('ccHintText');

        // Add CSS for animations
        styleEl = document.createElement('style');
        styleEl.textContent = `
            .cc-term {
                position: absolute;
                padding: 10px 18px;
                border-radius: 8px;
                font-size: 15px;
                font-weight: bold;
                border: 3px solid #7b1fa2;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
                animation: ccSlideIn 0.3s ease-out;
                background: linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%);
                color: #e1bee7;
                user-select: none;
                transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
            }
            .cc-term:hover {
                transform: scale(1.05);
            }
            .cc-term.selected {
                border-color: #ff0 !important;
                box-shadow: 0 0 20px #ff0, 0 0 40px rgba(255,255,0,0.5) !important;
                transform: scale(1.08);
                z-index: 10;
            }
            @keyframes ccSlideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .cc-term.approved {
                animation: ccApproveAnim 0.4s ease-out forwards;
                border-color: #0f0 !important;
                background: #0a5 !important;
            }
            .cc-term.rejected {
                animation: ccRejectAnim 0.4s ease-out forwards;
                border-color: #f00 !important;
                background: #a00 !important;
            }
            .cc-term.wrong {
                animation: ccWrongAnim 0.5s ease-out;
                border-color: #f00 !important;
                background: #600 !important;
            }
            @keyframes ccApproveAnim {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); box-shadow: 0 0 30px #0f0; }
                100% { transform: scale(0); opacity: 0; }
            }
            @keyframes ccRejectAnim {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); box-shadow: 0 0 30px #f00; }
                100% { transform: scale(0); opacity: 0; }
            }
            @keyframes ccWrongAnim {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-10px); }
                40%, 80% { transform: translateX(10px); }
            }
            @keyframes ccPulse {
                0%, 100% { box-shadow: 0 0 20px #ff0, 0 0 40px rgba(255,255,0,0.5); }
                50% { box-shadow: 0 0 30px #ff0, 0 0 60px rgba(255,255,0,0.7); }
            }
            .cc-term.selected {
                animation: ccPulse 1s infinite;
            }
            #ccExitBtn:hover {
                background: #800;
            }
        `;
        document.head.appendChild(styleEl);

        function cleanup() {
            window.cryptoCheckerActive = false;
            window.minigameActive = false;
            
            if (keydownHandler) {
                document.removeEventListener('keydown', keydownHandler);
                keydownHandler = null;
            }
            if (styleEl && styleEl.parentNode) {
                styleEl.remove();
            }
            if (gameState.timerInterval) {
                clearInterval(gameState.timerInterval);
            }
            if (gameState.spawnTimeout) {
                clearTimeout(gameState.spawnTimeout);
            }
            
            // Refresh leaderboard
            try {
                if (window.Leaderboard && typeof window.Leaderboard.refresh === 'function') {
                    window.Leaderboard.refresh();
                }
            } catch(e) {}
        }

        function exitGame() {
            cleanup();
            containerElement.innerHTML = '';
            if (containerElement.parentNode) {
                containerElement.parentNode.removeChild(containerElement);
            }
            if (onComplete) onComplete({ won: false, score: 0, cryptoEarned: 0 });
            resolve({ won: false, score: 0, cryptoEarned: 0 });
        }

        function updateSelectedTerm() {
            // Remove selected class from all terms
            gameState.activeTerms.forEach(t => t.el.classList.remove('selected'));
            
            // Add selected class to first term
            if (gameState.activeTerms.length > 0) {
                const selected = gameState.activeTerms[0];
                selected.el.classList.add('selected');
                
                // Update hint text
                const typeLabel = selected.isLegit ? 
                    '<span style="color:#0f0">LEGITIMATE</span>' : 
                    '<span style="color:#f66">SCAM</span>';
                hintText.innerHTML = `<strong style="color:#ff0">${selected.term}</strong>: ${selected.hint}`;
            } else {
                hintText.innerHTML = 'Waiting for next term...';
            }
        }

        function startGame() {
            overlay.style.display = 'none';
            gameState = {
                active: true,
                score: 0,
                correct: 0,
                total: 0,
                timeLeft: 30,
                baseSpawnInterval: 2500,
                maxTermsOnScreen: 4,
                activeTerms: [],
                timerInterval: null,
                spawnTimeout: null
            };

            gameArea.innerHTML = '';
            updateUI();
            hintText.innerHTML = 'Get ready...';

            gameState.timerInterval = setInterval(() => {
                gameState.timeLeft--;
                updateUI();

                // Gradually increase difficulty but keep it manageable
                if (gameState.timeLeft === 30) {
                    gameState.maxTermsOnScreen = 5;
                    gameState.baseSpawnInterval = 2200;
                } else if (gameState.timeLeft === 20) {
                    gameState.maxTermsOnScreen = 6;
                    gameState.baseSpawnInterval = 2000;
                } else if (gameState.timeLeft === 10) {
                    gameState.maxTermsOnScreen = 7;
                    gameState.baseSpawnInterval = 1800;
                }

                if (gameState.timeLeft <= 0) {
                    endGame(true);
                }
            }, 1000);

            // Initial spawn after short delay
            setTimeout(() => spawnTerm(), 500);
        }

        function spawnTerm() {
            if (!gameState.active) return;

            // Only spawn if we're under the max terms limit
            if (gameState.activeTerms.length >= gameState.maxTermsOnScreen) {
                // Try again soon
                gameState.spawnTimeout = setTimeout(() => spawnTerm(), 500);
                return;
            }

            const isLegit = Math.random() > 0.5;
            const termList = isLegit ? legitTerms : scamTerms;
            const termData = termList[Math.floor(Math.random() * termList.length)];

            const termEl = document.createElement('div');
            termEl.className = 'cc-term';
            termEl.textContent = termData.term;

            // Find a position that doesn't overlap too much
            const maxAttempts = 10;
            let x, y;
            const termWidth = 180;
            const termHeight = 50;
            
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                x = 20 + Math.random() * (gameArea.clientWidth - termWidth - 40);
                y = 20 + Math.random() * (gameArea.clientHeight - termHeight - 40);
                
                // Check overlap with existing terms
                let overlaps = false;
                for (const existing of gameState.activeTerms) {
                    const ex = parseFloat(existing.el.style.left);
                    const ey = parseFloat(existing.el.style.top);
                    if (Math.abs(x - ex) < termWidth && Math.abs(y - ey) < termHeight) {
                        overlaps = true;
                        break;
                    }
                }
                
                if (!overlaps) break;
            }

            termEl.style.left = x + 'px';
            termEl.style.top = y + 'px';

            // Add hover event to show hint
            termEl.addEventListener('mouseenter', () => {
                hintText.innerHTML = `<strong style="color:#ff0">${termData.term}</strong>: ${termData.hint}`;
            });

            gameArea.appendChild(termEl);
            
            const termObj = {
                el: termEl,
                term: termData.term,
                hint: termData.hint,
                isLegit: isLegit
            };
            
            gameState.activeTerms.push(termObj);
            updateSelectedTerm();

            // Schedule next spawn
            const nextSpawn = gameState.baseSpawnInterval * (0.9 + Math.random() * 0.2);
            gameState.spawnTimeout = setTimeout(() => spawnTerm(), nextSpawn);
        }

        function handleAction(action) {
            if (!gameState.active || gameState.activeTerms.length === 0) return;

            const termObj = gameState.activeTerms[0];
            const isCorrect = (action === 'approve' && termObj.isLegit) || (action === 'reject' && !termObj.isLegit);

            gameState.total++;
            
            if (isCorrect) {
                gameState.correct++;
                gameState.score += 10;
                termObj.el.classList.remove('selected');
                termObj.el.classList.add(action === 'approve' ? 'approved' : 'rejected');
                
                setTimeout(() => {
                    if (termObj.el.parentNode) termObj.el.remove();
                }, 400);
                
                gameState.activeTerms.shift();
                updateSelectedTerm();
            } else {
                // Wrong answer - show what it actually was
                termObj.el.classList.remove('selected');
                termObj.el.classList.add('wrong');
                
                const correctAction = termObj.isLegit ? 'LEGITIMATE (should APPROVE)' : 'SCAM (should REJECT)';
                hintText.innerHTML = `<span style="color:#f00">WRONG!</span> "${termObj.term}" was ${correctAction}`;
                
                setTimeout(() => {
                    endGame(false);
                }, 1000);
                return;
            }

            updateUI();
        }

        function updateUI() {
            timerEl.textContent = gameState.timeLeft;
            scoreEl.textContent = gameState.score;
            const accuracy = gameState.total === 0 ? 100 : Math.round((gameState.correct / gameState.total) * 100);
            accuracyEl.textContent = accuracy + '%';
        }

        async function endGame(won) {
            gameState.active = false;
            clearInterval(gameState.timerInterval);
            clearTimeout(gameState.spawnTimeout);

            const accuracy = gameState.total === 0 ? 100 : Math.round((gameState.correct / gameState.total) * 100);
            
            // Calculate DOGE earned
            let dogeEarned = 0;
            if (won) {
                dogeEarned = Math.floor(gameState.score / 5);
                if (isFirstCompletion) {
                    dogeEarned += 20;
                }
            }

            // Award crypto
            if (dogeEarned > 0) {
                try {
                    await rewardMinigame(MINIGAME_NAME, dogeEarned);
                    
                    if (isFirstCompletion) {
                        await completeMinigame(MINIGAME_NAME);
                    }
                } catch (e) {
                    console.error('[CryptoChecker] Failed to award crypto:', e);
                }
            }

            // Clear remaining terms
            gameState.activeTerms.forEach(t => {
                if (t.el.parentNode) t.el.remove();
            });
            gameState.activeTerms = [];

            // Show results
            showResults(won, dogeEarned, accuracy);
        }

        function showResults(won, dogeEarned, accuracy) {
            const resultHTML = `
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
                    border: 2px solid ${won ? '#c2a633' : '#800'};
                    border-radius: 12px;
                    padding: 25px;
                    text-align: center;
                    max-width: 450px;
                    z-index: 200;
                ">
                    <h2 style="color: ${won ? '#c2a633' : '#f66'}; margin: 0 0 15px 0;">
                        ${won ? '🛡️ SECURITY TRAINING COMPLETE!' : '❌ SECURITY BREACH!'}
                    </h2>
                    
                    <p style="color: #888; margin-bottom: 15px; font-size: 14px;">
                        ${won 
                            ? `You identified ${gameState.correct} threats correctly in 30 seconds!` 
                            : 'Study the difference between legit tech and scams!'}
                    </p>
                    
                    <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 15px;">
                        <div style="text-align: center;">
                            <div style="color: #888; font-size: 11px;">SCORE</div>
                            <div style="color: #c2a633; font-size: 22px; font-weight: bold;">${gameState.score}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #888; font-size: 11px;">CORRECT</div>
                            <div style="color: #0f0; font-size: 22px; font-weight: bold;">${gameState.correct}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #888; font-size: 11px;">ACCURACY</div>
                            <div style="color: #0f0; font-size: 22px; font-weight: bold;">${accuracy}%</div>
                        </div>
                    </div>
                    
                    ${won && dogeEarned > 0 ? `
                        <div style="background: rgba(194,166,51,0.2); padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #52410a;">
                            <div style="font-size: 24px;">Ð</div>
                            <div style="color: #c2a633; font-size: 18px; font-weight: bold;">+${dogeEarned} ${COIN_SYMBOL}</div>
                            ${isFirstCompletion ? '<div style="color: #0f0; font-size: 12px;">+20 first completion bonus!</div>' : ''}
                        </div>
                        
                        <div style="background: rgba(0,255,0,0.1); padding: 10px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #0a5; text-align: left;">
                            <strong style="color: #0f0; font-size: 13px;">📚 Key Takeaways:</strong><br>
                            <span style="color: #ccc; font-size: 12px;">
                                • If it promises guaranteed returns, it's a SCAM<br>
                                • Real crypto tech doesn't ask you to "send to double"<br>
                                • Celebrity giveaways are always fake
                            </span>
                        </div>
                        
                        <div style="color: #888; font-size: 12px; margin-bottom: 12px;">
                            💡 Visit the Closet to buy the Security Protocol scrap!
                        </div>
                    ` : `
                        <div style="background: rgba(255,0,0,0.1); padding: 10px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #800; text-align: left;">
                            <strong style="color: #f66; font-size: 13px;">💡 Remember:</strong><br>
                            <span style="color: #ccc; font-size: 12px;">
                                • Blockchain, Bitcoin, Ethereum = REAL tech<br>
                                • "Guaranteed returns", "Send 1 get 2" = SCAMS<br>
                                • When in doubt, it's probably a scam!
                            </span>
                        </div>
                    `}
                    
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="ccPlayAgain" style="
                            background: linear-gradient(135deg, #c2a633 0%, #8b7320 100%);
                            color: #000;
                            border: none;
                            padding: 10px 22px;
                            font-size: 14px;
                            font-weight: bold;
                            border-radius: 6px;
                            cursor: pointer;
                            font-family: 'Courier New', monospace;
                        ">PLAY AGAIN</button>
                        <button id="ccClose" style="
                            background: #333;
                            color: #ccc;
                            border: 1px solid #555;
                            padding: 10px 22px;
                            font-size: 14px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-family: 'Courier New', monospace;
                        ">CONTINUE</button>
                    </div>
                </div>
            `;
            
            gameArea.innerHTML = resultHTML;
            
            document.getElementById('ccPlayAgain').onclick = () => {
                gameArea.innerHTML = '';
                startGame();
            };
            
            document.getElementById('ccClose').onclick = () => {
                cleanup();
                containerElement.innerHTML = '';
                if (containerElement.parentNode) {
                    containerElement.parentNode.removeChild(containerElement);
                }
                if (onComplete) onComplete({ won, score: gameState.score, cryptoEarned: dogeEarned });
                resolve({ won, score: gameState.score, cryptoEarned: dogeEarned });
            };
        }

        // Event handlers
        keydownHandler = function(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                if (gameState.active) handleAction('approve');
            } else if (e.code === 'Backspace') {
                e.preventDefault();
                if (gameState.active) handleAction('reject');
            } else if (e.code === 'Escape') {
                e.preventDefault();
                exitGame();
            }
        };

        startButton.addEventListener('click', startGame);
        exitBtn.addEventListener('click', exitGame);
        document.addEventListener('keydown', keydownHandler);
    });
}

export function stopCryptoChecker() {
    window.cryptoCheckerActive = false;
    window.minigameActive = false;
}