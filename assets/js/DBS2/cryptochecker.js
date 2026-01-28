// cryptochecker.js
// Crypto Border Control minigame

const legitTerms = [
    'Blockchain', 'Bitcoin', 'Ethereum', 'Digital Wallet', 'Cold Wallet', 
    'Smart Contracts', 'Altcoins', 'DeFi', 'NFT', 'Mining', 'Staking',
    'Consensus', 'Hash Rate', 'Public Key', 'Private Key'
];

const scamTerms = [
    'Ponzi Schemes', 'Rug Pulls', 'Phishing Links', 'Fake ICOs', 
    'Exit Scams', 'Pump & Dumps', 'Crypto Doubler', 'Guaranteed Returns',
    'Pig Butchering', 'Honeypot', 'Fake Wallet', 'Scam Exchange'
];

function startCryptoChecker(containerElement, onComplete) {
    return new Promise((resolve) => {
        let gameState = {
            active: false,
            score: 0,
            correct: 0,
            total: 0,
            timeLeft: 40,
            spawnInterval: 2000,
            activeTerms: [],
            timerInterval: null,
            spawnTimeout: null
        };

        let keydownHandler = null;

        // Create game HTML
        const gameHTML = `
            <div id="cryptoCheckerGame" style="width: 900px; height: 600px; background: #0f3460; border: 4px solid #e94560; border-radius: 10px; position: relative; box-shadow: 0 0 30px rgba(233, 69, 96, 0.5); font-family: 'Courier New', monospace;">
                <div id="ccHeader" style="background: #16213e; padding: 15px; border-bottom: 3px solid #e94560; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #e94560; text-transform: uppercase;">Crypto Border Control</div>
                    <div style="display: flex; gap: 20px; font-size: 14px;">
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <div style="font-size: 10px; color: #aaa; margin-bottom: 3px;">TIME</div>
                            <div style="font-size: 18px; font-weight: bold; color: white;" id="ccTimer">40</div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <div style="font-size: 10px; color: #aaa; margin-bottom: 3px;">SCORE</div>
                            <div style="font-size: 18px; font-weight: bold; color: white;" id="ccScore">0</div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <div style="font-size: 10px; color: #aaa; margin-bottom: 3px;">ACCURACY</div>
                            <div style="font-size: 18px; font-weight: bold; color: white;" id="ccAccuracy">100%</div>
                        </div>
                    </div>
                </div>
                <div id="ccGameArea" style="height: 456px; position: relative; overflow: hidden;"></div>
                <div id="ccControls" style="background: #16213e; padding: 15px; border-top: 3px solid #e94560; display: flex; justify-content: center; gap: 30px; font-size: 14px; color: white;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="background: #0f3460; padding: 8px 15px; border-radius: 5px; border: 2px solid #e94560; font-weight: bold;">SPACEBAR</span>
                        <span>Approve (Legitimate)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="background: #0f3460; padding: 8px 15px; border-radius: 5px; border: 2px solid #e94560; font-weight: bold;">BACKSPACE</span>
                        <span>Reject (Scam)</span>
                    </div>
                </div>
                <div id="ccOverlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px; z-index: 1000; color: white;">
                    <div style="font-size: 48px; color: #e94560; text-transform: uppercase; margin-bottom: 10px;">Crypto Border Control</div>
                    <div style="font-size: 20px; text-align: center; max-width: 600px; line-height: 1.6;">
                        All crypto concepts appear in <span style="color: #b388ff;">PURPLE</span>.<br>
                        You must decide which are legitimate and which are scams!<br><br>
                        <strong>SPACEBAR</strong> = Approve (for legitimate concepts)<br>
                        <strong>BACKSPACE</strong> = Reject (for scams)<br><br>
                        Survive 40 seconds without making mistakes!<br>
                        Terms will appear faster and in multiple waves.
                    </div>
                    <button id="ccStartButton" style="background: #e94560; color: #fff; border: none; padding: 15px 40px; font-size: 20px; font-weight: bold; border-radius: 8px; cursor: pointer; text-transform: uppercase; transition: all 0.3s; margin-top: 20px;">START GAME</button>
                    <div style="font-size: 14px; color: #aaa; margin-top: 10px;">Press ESC to exit</div>
                </div>
            </div>
        `;

        containerElement.innerHTML = gameHTML;

        const gameArea = document.getElementById('ccGameArea');
        const overlay = document.getElementById('ccOverlay');
        const startButton = document.getElementById('ccStartButton');
        const timerEl = document.getElementById('ccTimer');
        const scoreEl = document.getElementById('ccScore');
        const accuracyEl = document.getElementById('ccAccuracy');

        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            .cc-term {
                position: absolute;
                padding: 15px 25px;
                border-radius: 8px;
                font-size: 18px;
                font-weight: bold;
                border: 3px solid #7b1fa2;
                cursor: pointer;
                transition: transform 0.1s;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                animation: ccSlideIn 0.3s ease-out;
                background: #4a148c;
                color: #e1bee7;
            }
            @keyframes ccSlideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .cc-term.approved {
                animation: ccApproveAnim 0.4s ease-out forwards;
            }
            .cc-term.rejected {
                animation: ccRejectAnim 0.4s ease-out forwards;
            }
            @keyframes ccApproveAnim {
                0% { transform: scale(1); }
                50% { transform: scale(1.2) rotate(5deg); }
                100% { transform: scale(0) rotate(15deg); opacity: 0; }
            }
            @keyframes ccRejectAnim {
                0% { transform: scale(1); }
                50% { transform: scale(1.2) rotate(-5deg); }
                100% { transform: scale(0) rotate(-15deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        function startGame() {
            overlay.style.display = 'none';
            gameState = {
                active: true,
                score: 0,
                correct: 0,
                total: 0,
                timeLeft: 40,
                spawnInterval: 2000,
                activeTerms: [],
                timerInterval: null,
                spawnTimeout: null
            };

            gameArea.innerHTML = '';
            updateUI();

            gameState.timerInterval = setInterval(() => {
                gameState.timeLeft--;
                updateUI();

                if (gameState.timeLeft % 10 === 0 && gameState.timeLeft > 0) {
                    gameState.spawnInterval = Math.max(800, gameState.spawnInterval - 300);
                }

                if (gameState.timeLeft <= 0) {
                    endGame(true);
                }
            }, 1000);

            spawnTerm();
        }

        function spawnTerm() {
            if (!gameState.active) return;

            const isLegit = Math.random() > 0.5;
            const terms = isLegit ? legitTerms : scamTerms;
            const term = terms[Math.floor(Math.random() * terms.length)];

            const termEl = document.createElement('div');
            termEl.className = 'cc-term';
            termEl.textContent = term;
            termEl.dataset.type = isLegit ? 'legitimate' : 'scam';

            const maxX = gameArea.clientWidth - 250;
            const x = Math.random() * maxX;
            const maxY = gameArea.clientHeight - 60;
            const y = Math.random() * maxY;

            termEl.style.left = x + 'px';
            termEl.style.top = y + 'px';

            gameArea.appendChild(termEl);
            gameState.activeTerms.push(termEl);

            const nextSpawn = gameState.spawnInterval * (0.8 + Math.random() * 0.4);
            gameState.spawnTimeout = setTimeout(() => spawnTerm(), nextSpawn);

            if (gameState.timeLeft < 30 && Math.random() > 0.6) {
                setTimeout(() => spawnTerm(), 300);
            }
        }

        function handleAction(action) {
            if (!gameState.active || gameState.activeTerms.length === 0) return;

            const termEl = gameState.activeTerms[0];
            const isLegit = termEl.dataset.type === 'legitimate';
            const isCorrect = (action === 'approve' && isLegit) || (action === 'reject' && !isLegit);

            gameState.total++;
            if (isCorrect) {
                gameState.correct++;
                gameState.score += 10;
                termEl.classList.add(action === 'approve' ? 'approved' : 'rejected');
            } else {
                gameState.score = Math.max(0, gameState.score - 20);
                endGame(false);
                return;
            }

            setTimeout(() => {
                if (termEl.parentNode) {
                    termEl.remove();
                }
            }, 400);

            gameState.activeTerms.shift();
            updateUI();
        }

        function updateUI() {
            timerEl.textContent = gameState.timeLeft;
            scoreEl.textContent = gameState.score;
            const accuracy = gameState.total === 0 ? 100 : Math.round((gameState.correct / gameState.total) * 100);
            accuracyEl.textContent = accuracy + '%';
        }

        function endGame(won) {
            gameState.active = false;
            clearInterval(gameState.timerInterval);
            clearTimeout(gameState.spawnTimeout);

            const accuracy = gameState.total === 0 ? 100 : Math.round((gameState.correct / gameState.total) * 100);
            
            // Calculate crypto earned based on score
            const cryptoEarned = won ? Math.floor(gameState.score / 10) : 0;

            gameState.activeTerms.forEach(term => term.remove());
            gameState.activeTerms = [];

            // Cleanup
            if (keydownHandler) {
                document.removeEventListener('keydown', keydownHandler);
            }
            style.remove();

            const result = {
                won,
                score: gameState.score,
                accuracy,
                cryptoEarned
            };

            if (onComplete) {
                onComplete(result);
            }

            resolve(result);
        }

        keydownHandler = function(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                handleAction('approve');
            } else if (e.code === 'Backspace') {
                e.preventDefault();
                handleAction('reject');
            } else if (e.code === 'Escape') {
                e.preventDefault();
                endGame(false);
            }
        };

        startButton.addEventListener('click', startGame);
        document.addEventListener('keydown', keydownHandler);
    });
}

// Export as default
export default startCryptoChecker;