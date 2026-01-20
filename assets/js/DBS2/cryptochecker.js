// Crypto Border Control Game
// Save this as game.js and include it in your HTML file

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

// DOM Elements
let gameArea, overlay, startButton, timerEl, scoreEl, accuracyEl;

// Initialize the game when DOM is loaded
function init() {
    gameArea = document.getElementById('gameArea');
    overlay = document.getElementById('overlay');
    startButton = document.getElementById('startButton');
    timerEl = document.getElementById('timer');
    scoreEl = document.getElementById('score');
    accuracyEl = document.getElementById('accuracy');

    startButton.addEventListener('click', startGame);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleAction('approve');
        } else if (e.code === 'Backspace') {
            e.preventDefault();
            handleAction('reject');
        } else if (e.code === 'Enter') {
            e.preventDefault();
            if (!gameState.active) {
                startGame();
            }
        }
    });
}

function startGame() {
    overlay.classList.add('hidden');
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

        // Increase difficulty every 10 seconds
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
    termEl.className = 'term';
    termEl.textContent = term;
    termEl.dataset.type = isLegit ? 'legitimate' : 'scam';
    termEl.dataset.id = Date.now() + Math.random();

    // Random horizontal position
    const maxX = gameArea.clientWidth - 250;
    const x = Math.random() * maxX;
    
    // Random vertical position
    const maxY = gameArea.clientHeight - 60;
    const y = Math.random() * maxY;

    termEl.style.left = x + 'px';
    termEl.style.top = y + 'px';

    gameArea.appendChild(termEl);
    gameState.activeTerms.push(termEl);

    // Spawn next term
    const nextSpawn = gameState.spawnInterval * (0.8 + Math.random() * 0.4);
    gameState.spawnTimeout = setTimeout(() => spawnTerm(), nextSpawn);

    // Spawn multiple terms at later stages
    if (gameState.timeLeft < 30 && Math.random() > 0.6) {
        setTimeout(() => spawnTerm(), 300);
    }
}

function handleAction(action) {
    if (!gameState.active || gameState.activeTerms.length === 0) return;

    // Get oldest term
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

    overlay.classList.remove('hidden');
    document.getElementById('overlayTitle').textContent = won ? 'VICTORY!' : 'GAME OVER';
    
    if (won) {
        document.getElementById('overlayMessage').innerHTML = `
            <div id="finalStats">
                <div class="final-stat">
                    <div class="final-stat-label">Final Score</div>
                    <div class="final-stat-value">${gameState.score}</div>
                </div>
                <div class="final-stat">
                    <div class="final-stat-label">Accuracy</div>
                    <div class="final-stat-value">${accuracy}%</div>
                </div>
                <div class="final-stat">
                    <div class="final-stat-label">Correct</div>
                    <div class="final-stat-value">${gameState.correct}</div>
                </div>
                <div class="final-stat">
                    <div class="final-stat-label">Total</div>
                    <div class="final-stat-value">${gameState.total}</div>
                </div>
            </div>
            <p style="margin-top: 20px;">You successfully protected the crypto border!</p>
        `;
    } else {
        document.getElementById('overlayMessage').innerHTML = `
            <div id="finalStats">
                <div class="final-stat">
                    <div class="final-stat-label">Final Score</div>
                    <div class="final-stat-value">${gameState.score}</div>
                </div>
                <div class="final-stat">
                    <div class="final-stat-label">Accuracy</div>
                    <div class="final-stat-value">${accuracy}%</div>
                </div>
                <div class="final-stat">
                    <div class="final-stat-label">Survived</div>
                    <div class="final-stat-value">${40 - gameState.timeLeft}s</div>
                </div>
                <div class="final-stat">
                    <div class="final-stat-label">Correct</div>
                    <div class="final-stat-value">${gameState.correct}/${gameState.total}</div>
                </div>
            </div>
            <p style="margin-top: 20px; color: #dc2f02;">You let a suspicious transaction through!</p>
        `;
    }

    startButton.textContent = 'PLAY AGAIN';

    // Clear all active terms
    gameState.activeTerms.forEach(term => term.remove());
    gameState.activeTerms = [];
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}