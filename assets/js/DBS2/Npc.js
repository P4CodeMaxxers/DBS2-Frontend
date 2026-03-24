import GameEnv from "./GameEnv.js";
import Character from "./Character.js";
import Prompt from "./Prompt.js";
import { showAshTrailMinigame } from "./AshTrailMinigame.js";
import infiniteUserMinigame from "./InfiniteUserMinigame.js";
import cryptoMinerMinigame from "./cryptoMinerMinigame.js";
import { showLaundryMinigame } from "./LaundryGame.js";
import startCryptoChecker from "./cryptochecker.js";
import { showClosetShop } from "./ClosetShop.js";

class Npc extends Character {
    constructor(data = null) {
        super(data);
        this.alertTimeout = null;
        this.bindEventListeners();
    }

    update() {
        this.draw();
    }

    bindEventListeners() {
        addEventListener('keydown', this.handleKeyDown.bind(this));
        addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    closeAllDialogues() {
        const dialoguePopup = document.getElementById('dialoguePopup');
        if (dialoguePopup) {
            dialoguePopup.remove();
        }
        
        if (Prompt.isOpen) {
            Prompt.backgroundDim.remove();
        }
        
        const dimDiv = document.getElementById('dim');
        if (dimDiv) {
            dimDiv.remove();
        }
        
        const promptDropDown = document.querySelector('.promptDropDown');
        if (promptDropDown) {
            promptDropDown.style.display = 'none';
        }
        
        window.dialogueActive = false;
        Prompt.isOpen = false;
    }
    
    // ── SRP helpers for handleKeyDown ─────────────────────────────

    findCollidingPlayers() {
        return GameEnv.gameObjects.filter(
            obj => obj.state?.collisionEvents?.includes(this.spriteData.id)
        );
    }

    isPlayerInProximity(maxDist = 200) {
        const player = GameEnv.gameObjects.find(obj => obj.spriteData?.id === 'player');
        if (!player) return false;
        const dist = Math.sqrt(
            Math.pow(player.position.x - this.position.x, 2) +
            Math.pow(player.position.y - this.position.y, 2)
        );
        console.log(`Distance to ${this.spriteData.id}: ${dist}`);
        return dist < maxDist;
    }

    dispatchNpcInteraction(npcId) {
        const minigameMap = {
            'Bookshelf':  () => showAshTrailMinigame(),
            'Computer1':  () => infiniteUserMinigame(),
            'Computer2':  () => cryptoMinerMinigame(),
            'laundry':    () => showLaundryMinigame(),
            'Cards':      () => { console.log('✅ Cards interaction detected!'); this.launchCryptoChecker(); },
            'Closet':     () => { console.log('✅ Closet interaction detected!'); showClosetShop(); },
        };

        const action = minigameMap[npcId];
        if (action) {
            action();
        } else {
            Prompt.currentNpc = this;
            Prompt.openPromptPanel(this);
        }
    }

    // ── Orchestrator ────────────────────────────────────────────

    handleKeyDown({ key }) {
        if (key !== 'e') return;
        try {
            console.log('E key pressed. Checking collisions...');
            const players = this.findCollidingPlayers();
            console.log(`NPC ID: ${this.spriteData.id}, Players colliding: ${players.length}`);

            if (players.length === 0) {
                if (this.spriteData.id === 'Cards' && this.isPlayerInProximity()) {
                    this.launchCryptoChecker();
                }
                return;
            }

            this.closeAllDialogues();
            console.log(`Interacting with: ${this.spriteData.id}`);
            this.dispatchNpcInteraction(this.spriteData.id);
        } catch (err) {
            console.error('Error handling NPC interaction', err);
        }
    }

    async launchCryptoChecker() {
        try {
            console.log('🎮 Starting Crypto Checker minigame...');

            // Create fullscreen overlay
            const overlay = document.createElement('div');
            overlay.id = 'cryptochecker-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.95);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;
            document.body.appendChild(overlay);

            // Determine the correct base path for images
            let basePath = '/images/DBS2';
            if (this.spriteData?.src) {
                const srcParts = this.spriteData.src.split('/images/DBS2');
                if (srcParts.length > 1) {
                    basePath = srcParts[0] + '/images/DBS2';
                }
            }
            console.log('Using base path:', basePath);

            // Start the game
            await startCryptoChecker(overlay, basePath, () => {
                console.log('✅ Crypto Checker finished!');
                
                // Remove overlay
                if (overlay?.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            });
        } catch (error) {
            console.error('❌ Error launching Crypto Checker:', error);
            const overlay = document.getElementById('cryptochecker-overlay');
            if (overlay?.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            // Show error in a nice popup instead of alert
            Prompt.showDialoguePopup('Error', 'Could not start minigame: ' + error.message);
        }
    }

    handleKeyUp({ key }) {
        if (key === 'e' || key === 'u') {
            if (this.alertTimeout) {
                clearTimeout(this.alertTimeout);
                this.alertTimeout = null;
            }
        }
    }
}

export default Npc;