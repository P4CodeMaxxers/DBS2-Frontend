import GameEnv from './GameEnv.js';
import GameLevelBasement from './GameLevelBasement.js';
import Inventory from './Inventory.js';
import Prompt from './Prompt.js';
import Leaderboard from './Leaderboard.js';
import AshTrailLeaderboardWidget from './AshTrailLeaderboardWidget.js';

// Import StatsManager for user-specific data initialization
let initializeStatsManager = null;
try {
    const statsModule = await import('./StatsManager.js');
    initializeStatsManager = statsModule.initializeForUser;
    console.log('[GameControl] StatsManager loaded');
} catch (e) {
    console.log('[GameControl] StatsManager not available:', e);
}

console.log("GameControl.js loaded!");


/**
 * The GameControl object manages the game.
 */
const GameControl = {
    intervalId: null,
    localStorageTimeKey: "localTimes",
    currentPass: 0,
    currentLevelIndex: 0,
    levelClasses: [],
    path: '',
    leaderboard: null,
    ashTrailWidget: null,
    cryptoWinTriggered: false,
    scrapWinTriggered: false,
    introStarted: false,
    introCheckDone: false,
    playerHasProgress: false,

    start: function(path) {
        console.log("GameControl.start() called with path:", path);
        
        // Initialize StatsManager first to sync user data with backend
        if (initializeStatsManager) {
            initializeStatsManager().then(success => {
                console.log('[GameControl] StatsManager initialized:', success ? 'synced with backend' : 'using local fallback');
            }).catch(e => {
                console.log('[GameControl] StatsManager init error:', e);
            });
        }
        
        try {
            console.log("GameControl: Creating GameEnv...");
            GameEnv.create();
            console.log("GameControl: GameEnv created successfully");
            console.log("GameControl: Canvas dimensions:", GameEnv.innerWidth, "x", GameEnv.innerHeight);
        } catch (error) {
            console.error("GameControl: Failed to create GameEnv:", error);
            throw error;
        }
        // Initialize inventory UI
        try { Inventory.init(); } catch (e) { console.error('Inventory init failed', e); }
        
        // Initialize win condition listeners
        this.initWinConditionListeners();
        
        // Check if player has progress (for intro skip)
        this.checkPlayerProgress();
        
        this.levelClasses = [GameLevelBasement];
        this.currentLevelIndex = 0;
        this.path = path;
        this.addExitKeyListener();
        console.log("GameControl: Loading level...");
        this.loadLevel();
        console.log("GameControl: Level loaded");
    },
    
    // Check backend for player progress to determine if intro should show
    async checkPlayerProgress() {
        // Get current username for per-user intro tracking
        let username = 'guest';
        try {
            const userEl = document.querySelector('.nav-link[href*="profile"], .navbar-text, [class*="user"]');
            if (userEl) username = userEl.textContent.trim().toLowerCase().replace(/\s+/g, '_');
        } catch(e) {}
        
        // Check localStorage for this specific user
        const introKey = `dbs2_intro_seen_${username}`;
        const introSeen = localStorage.getItem(introKey) === 'true';
        
        if (introSeen) {
            this.playerHasProgress = true;
            this.introCheckDone = true;
            console.log('[GameControl] Intro already seen for user:', username);
            return;
        }
        
        // Store the key name for later use when marking intro as seen
        this.introSeenKey = introKey;
        
        // Then try to check backend for additional progress indicators
        try {
            if (window.DBS2API && window.DBS2API.getPlayer) {
                const player = await window.DBS2API.getPlayer();
                if (player) {
                    const hasCrypto = player.crypto && player.crypto > 0;
                    const hasInventory = player.inventory && player.inventory.length > 0;
                    const hasCompletedMinigames = player.minigames_completed && 
                        Object.values(player.minigames_completed).some(v => v === true);
                    const hasWallet = (player.wallet_btc || 0) > 0 || (player.wallet_eth || 0) > 0 || 
                        (player.wallet_sol || 0) > 0 || (player.wallet_ada || 0) > 0 || (player.wallet_doge || 0) > 0;
                    
                    this.playerHasProgress = hasCrypto || hasInventory || hasCompletedMinigames || hasWallet;
                    console.log('[GameControl] Player progress check:', { hasCrypto, hasInventory, hasCompletedMinigames, hasWallet, hasProgress: this.playerHasProgress });
                }
            }
        } catch (e) {
            console.log('[GameControl] Could not check player progress from backend:', e);
        }
        
        this.introCheckDone = true;
    },
    
    loadLevel: function() {
        if (this.currentLevelIndex >= this.levelClasses.length) {
            this.stopTimer();
            return;
        }
        GameEnv.continueLevel = true;
        GameEnv.gameObjects = [];
        this.currentPass = 0;
        const LevelClass = this.levelClasses[this.currentLevelIndex];
        const levelInstance = new LevelClass(this.path);
        this.loadLevelObjects(levelInstance);
    },
    
    loadLevelObjects: function(gameInstance) {
        console.log("GameControl: Initializing stats UI and leaderboard...");
        this.initStatsUI();
        this.initLeaderboard();
        this.initAshTrailLeaderboard();
        console.log("GameControl: Creating game objects, count:", gameInstance.objects.length);
        // Instantiate the game objects
        for (let object of gameInstance.objects) {
            if (!object.data) object.data = {};
            try {
                console.log("GameControl: Creating object:", object.class.name, "with data:", object.data);
                new object.class(object.data);
            } catch (error) {
                console.error("GameControl: Error creating object:", error, object);
            }
        }
        console.log("GameControl: Game objects created, total:", GameEnv.gameObjects.length);
        // Start the game loop
        console.log("GameControl: Starting game loop...");
        this.gameLoop();
    },

    gameLoop: function() {
        // Base case: leave the game loop 
        if (!GameEnv.continueLevel) {
            this.handleLevelEnd();
            return;
        }
        // Nominal case: update the game objects 
        if (!GameEnv.ctx) {
            console.error("GameControl: GameEnv.ctx is null, cannot render!");
            return;
        }
        GameEnv.clear();
        for (let object of GameEnv.gameObjects) {
            try {
                object.update();  // Update the game objects
            } catch (error) {
                console.error("GameControl: Error updating game object:", error, object);
            }
        }
        this.handleLevelStart();
        // Recursively call this function at animation frame rate
        requestAnimationFrame(this.gameLoop.bind(this));
    },

    handleLevelStart: function() {
        // Wait for intro check to complete
        if (!this.introCheckDone && this.currentPass < 50) {
            this.currentPass++;
            return;
        }
        
        if (this.currentLevelIndex === 0) {
            // Story intro sequence - only shows for new players (no backend progress)
            if (!this.playerHasProgress && !this.introStarted && this.currentPass >= 10) {
                this.introStarted = true;
                this.playIntroSequence();
            }
            
            // Controls message - shows for returning players
            if (this.playerHasProgress && this.currentPass === 10) {
                try { 
                    Prompt.showDialoguePopup('Welcome Back', 'WASD to move. E to interact. Continue collecting code scraps to build The Green Machine!'); 
                } catch(e){ console.warn('Prompt not available', e); }
            }
        }
        
        this.currentPass++;
    },

    playIntroSequence: function() {
        // Mark intro as seen for this user
        try {
            const key = this.introSeenKey || 'dbs2_intro_seen_guest';
            localStorage.setItem(key, 'true');
        } catch(e) {}
        
        const dialogues = [
            { speaker: '???', text: 'You find yourself in a basement. A figure emerges from the shadows.', duration: 3500 },
            { speaker: 'IShowGreen', text: 'Finally. Someone who can help. I am IShowGreen.', duration: 3500 },
            { speaker: 'IShowGreen', text: 'I want to mine cryptocurrency. But I need to do it RIGHT. Effectively. Ethically.', duration: 4500 },
            { speaker: 'IShowGreen', text: 'I wrote the blueprints for a green mining program. Five code fragments, scattered around this basement.', duration: 5000 },
            { speaker: 'IShowGreen', text: 'Complete my challenges. Learn about blockchain, security, and crypto. Then help me build The Green Machine.', duration: 5500 },
        ];
        
        let index = 0;
        
        const showNext = () => {
            if (index < dialogues.length) {
                const d = dialogues[index];
                try {
                    Prompt.showIntroDialogue(d.speaker, d.text, d.duration, () => {
                        index++;
                        showNext();
                    });
                } catch(e) {
                    console.warn('Could not show intro dialogue', e);
                    index++;
                    showNext();
                }
            } else {
                // Show final controls message with close button
                try {
                    Prompt.showDialoguePopup('IShowGreen', 'Play minigames to earn crypto and learn. Then visit the CLOSET to buy code scraps. WASD to move. E to interact.');
                } catch(e) {
                    console.warn('Could not show controls', e);
                }
            }
        };
        
        // Start after a brief delay
        setTimeout(showNext, 500);
    },

    showWinScreen: function(winType) {
        const overlay = document.createElement('div');
        overlay.id = 'win-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 20000;
            font-family: 'Courier New', monospace;
            color: #0a5;
        `;
        
        let title, subtitle, hint;
        
        if (winType === 'crypto') {
            title = 'CRYPTO MASTER';
            subtitle = 'You earned 500+ crypto! You\'ve mastered the basics of blockchain technology. The Green Machine awaits...';
            hint = '<p style="color: #0a5; margin-top: 30px; font-style: italic;">Keep collecting code scraps to complete The Green Machine!</p>';
        } else if (winType === 'scraps') {
            title = 'THE GREEN MACHINE COMPLETE';
            subtitle = 'You gave IShowGreen all five code fragments. Together, you built The Green Machine - ethical, efficient cryptocurrency mining for a better future.';
            hint = '<p style="color: #0a5; margin-top: 30px; font-style: italic;">Congratulations! You\'ve learned the fundamentals of blockchain and helped create something revolutionary.</p>';
        } else if (winType === 'alternate') {
            title = 'A DIFFERENT PATH';
            subtitle = 'You kept the code fragments for yourself. The Green Machine could have changed crypto mining forever... but now it will never be built.';
            hint = '<p style="color: #640; margin-top: 30px; font-style: italic;">Was this the right choice? Play again to see the other ending.</p>';
        } else {
            title = 'JOURNEY COMPLETE';
            subtitle = 'You\'ve learned the fundamentals of cryptocurrency and blockchain technology.';
            hint = '';
        }
        
        overlay.innerHTML = `
            <h1 style="font-size: 32px; margin-bottom: 20px; letter-spacing: 3px;">${title}</h1>
            <p style="color: #888; font-size: 13px; max-width: 500px; text-align: center; line-height: 1.6;">${subtitle}</p>
            ${hint}
            <button onclick="location.reload()" style="
                margin-top: 40px;
                background: #052;
                color: #0a5;
                border: 1px solid #0a5;
                padding: 12px 30px;
                font-size: 13px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
            ">PLAY AGAIN</button>
        `;
        
        document.body.appendChild(overlay);
        GameEnv.continueLevel = false;
    },

    initWinConditionListeners: function() {
        // Listen for code scrap collection event
        window.addEventListener('allCodeScrapsCollected', () => {
            if (!this.scrapWinTriggered) {
                // Don't auto-trigger - player must present to IShowGreen
                try {
                    Prompt.showDialoguePopup('System', 'All five code fragments collected! Talk to IShowGreen to build The Green Machine.');
                } catch(e) {}
            }
        });
    },

    handleLevelEnd: function() {
        // More levels to play 
        if (this.currentLevelIndex < this.levelClasses.length - 1) {
            try { Prompt.showDialoguePopup('System', 'Level ended.'); } catch(e){ console.warn('Prompt not available', e); }
        } else { // All levels completed
            try { Prompt.showDialoguePopup('System', 'Game over. All levels completed.'); } catch(e){ console.warn('Prompt not available', e); }
        }
        // Tear down the game environment
        for (let index = GameEnv.gameObjects.length - 1; index >= 0; index--) {
            GameEnv.gameObjects[index].destroy();
        }
        // Move to the next level
        this.currentLevelIndex++;
        // Go back to the loadLevel function
        this.loadLevel();
    },
    
    resize: function() {
        // Resize the game environment
        GameEnv.resize();
        // Resize the game objects
        for (let object of GameEnv.gameObjects) {
            object.resize(); // Resize the game objects
        }
    },

    addExitKeyListener: function() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'NumLock') {
                GameEnv.continueLevel = false;
            }
        });
    },

    getAllTimes() {
        let timeTable = null;

        try {
            timeTable = localStorage.getItem(this.localStorageTimeKey);
        }
        catch (e) {
            return null;
        }

        if (!timeTable) {
            return null;
        }

        try {
            return JSON.parse(timeTable);
        } catch (e) {
            return null;
        }
    },
    
    updateTimer() {
        const time = GameEnv.time

        if (GameEnv.timerActive) {
            const newTime = time + GameEnv.timerInterval
            GameEnv.time = newTime                
            if (document.getElementById('timeScore')) {
                document.getElementById('timeScore').textContent = (newTime/1000).toFixed(2) 
            }
            return newTime
        }
        if (document.getElementById('timeScore')) {
            document.getElementById('timeScore').textContent = (time/1000).toFixed(2) 
        }
    },   

    startTimer() {
        if (GameEnv.timerActive) {
            console.warn("TIMER ACTIVE: TRUE, TIMER NOT STARTED")
            return;
        }
        
        this.intervalId = setInterval(() => this.updateTimer(), GameEnv.timerInterval);
        GameEnv.timerActive = true;
    },

    stopTimer() {   
        if (!GameEnv.timerActive) return;
        
        this.saveTime(GameEnv.time, GameEnv.coinScore)

        GameEnv.timerActive = false
        GameEnv.time = 0;
        GameEnv.coinScore = 0;
        this.updateCoinDisplay()
        clearInterval(this.intervalId)
    },

    saveTime(time, score) {
        if (time == 0) return;
        const userID = GameEnv.userID || 'anonymous';
        const oldTable = this.getAllTimes()

        const data = {
            userID: userID,
            time: time,
            score: score || GameEnv.coinScore || 0
        }

        if (!oldTable || !Array.isArray(oldTable)) {
            localStorage.setItem(this.localStorageTimeKey, JSON.stringify([data]))
            return;
        }

        oldTable.push(data)
        localStorage.setItem(this.localStorageTimeKey, JSON.stringify(oldTable))
    },
    
    updateCoinDisplay() {
        const coins = GameEnv.coinScore || 0;
        const coinDisplay = document.getElementById('coinScore');
        if (coinDisplay) {
            coinDisplay.textContent = coins;
        }
    },  

    // Initialize UI for game stats
    initStatsUI: function() {
        const statsContainer = document.createElement('div');
        statsContainer.id = 'stats-container';
        statsContainer.style.position = 'fixed';
        statsContainer.style.top = '75px'; 
        statsContainer.style.right = '10px';
        statsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        statsContainer.style.color = 'white';
        statsContainer.style.padding = '10px';
        statsContainer.style.borderRadius = '5px';
        statsContainer.innerHTML = `
            <div>Money Bucks: <span id="balance">0</span></div>
            <div>Chat Score: <span id="chatScore">0</span></div>
            <div>Questions Answered: <span id="questionsAnswered">0</span></div>
        `;
        document.body.appendChild(statsContainer);
    },

    // Initialize leaderboard UI
    initLeaderboard: function() {
        if (!this.leaderboard) {
            this.leaderboard = new Leaderboard();
        }
        this.leaderboard.init();
        // Make leaderboard globally accessible for refresh
        window.Leaderboard = this.leaderboard;
    },

    // Small Ash Trail leaderboard near the bookshelf (main game overlay)
    initAshTrailLeaderboard: function() {
        try {
            if (!this.ashTrailWidget) {
                this.ashTrailWidget = new AshTrailLeaderboardWidget();
            }
            this.ashTrailWidget.init(true, 3000);
        } catch (e) {
            console.error("AshTrailLeaderboardWidget init failed", e);
        }
    },

};

// Make GameControl globally accessible
window.GameControl = GameControl;

// Detect window resize events and call the resize function.
window.addEventListener('resize', GameControl.resize.bind(GameControl));


// Auto-start the game when the module loads
function initGame() {
    console.log("GameControl: initGame() called");
    // Compute the base path for assets (strip trailing slash if present)
    let baseurl = document.body?.getAttribute('data-baseurl') || '';
    if (baseurl.endsWith('/')) baseurl = baseurl.slice(0, -1);
    console.log("GameControl: Starting game with baseurl:", baseurl);
    try {
        GameControl.start(baseurl);
        console.log("GameControl: Game started successfully");
    } catch (error) {
        console.error("GameControl: Error starting game:", error);
    }
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    // DOM is already loaded, initialize immediately
    console.log("GameControl: DOM already loaded, initializing immediately");
    initGame();
}

export default GameControl;