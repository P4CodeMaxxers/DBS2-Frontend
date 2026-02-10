// EasterEgg.js
// Pinpad NPC that floats near IShowGreen
// When player presses 'e', opens a PIN entry interface

import GameEnv from "./GameEnv.js";
import Character from "./Character.js";

class EasterEgg extends Character {
    constructor(data = null) {
        super(data);
        
        // Double the size of the sprite
        if (this.spriteData) {
            this.spriteData.scale = (this.spriteData.scale || 1) * 4;
        }
        
        this.bindEventListeners();
        
        // Floating animation properties
        this.baseY = this.position.y;
        this.floatAmplitude = 20; // pixels to move up/down
        this.floatSpeed = 0.02; // speed of floating
        this.floatOffset = 0;
        
        // PIN entry state
        this.isPinpadOpen = false;
        this.enteredPin = '';
        this.correctPin = '72561'; // 5-digit secret PIN
    }

    update() {
        // Floating animation
        if (!this.isPinpadOpen) {
            this.floatOffset += this.floatSpeed;
            this.position.y = this.baseY + Math.sin(this.floatOffset) * this.floatAmplitude;
        }
        
        this.draw();
    }

    bindEventListeners() {
        addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleKeyDown({ key }) {
        // Check if pinpad is already open
        if (this.isPinpadOpen) {
            this.handlePinInput(key);
            return;
        }

        // Open pinpad with 'e' key
        if (key === 'e') {
            const players = GameEnv.gameObjects.filter(
                obj => obj.state?.collisionEvents?.includes(this.spriteData.id)
            );
            
            // Fallback proximity check
            if (players.length === 0) {
                const player = GameEnv.gameObjects.find(obj => obj.spriteData?.id === 'player');
                if (player) {
                    const dist = Math.sqrt(
                        Math.pow(player.position.x - this.position.x, 2) + 
                        Math.pow(player.position.y - this.position.y, 2)
                    );
                    
                    if (dist < 150) {
                        this.openPinpad();
                    }
                }
            } else if (players.length > 0) {
                this.openPinpad();
            }
        }
    }

    openPinpad() {
        console.log('🔐 Opening pinpad...');
        this.isPinpadOpen = true;
        this.enteredPin = '';
        
        // Create fullscreen overlay
        const overlay = document.createElement('div');
        overlay.id = 'pinpad-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Courier New', monospace;
        `;

        // Title
        const title = document.createElement('div');
        title.style.cssText = `
            color: #f39c12;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 0 0 10px rgba(243, 156, 18, 0.5);
        `;
        title.textContent = '🔐 SECURITY PINPAD';
        overlay.appendChild(title);

        // PIN Display
        const pinDisplay = document.createElement('div');
        pinDisplay.id = 'pin-display';
        pinDisplay.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 3px solid #f39c12;
            border-radius: 10px;
            padding: 20px 40px;
            margin-bottom: 30px;
            min-width: 250px;
            text-align: center;
            font-size: 36px;
            color: #ecf0f1;
            letter-spacing: 10px;
            box-shadow: 0 0 20px rgba(243, 156, 18, 0.3);
        `;
        pinDisplay.textContent = '_____';
        overlay.appendChild(pinDisplay);

        // Pinpad Grid
        const pinpadContainer = document.createElement('div');
        pinpadContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 100px);
            grid-gap: 15px;
            margin-bottom: 20px;
        `;

        // Create number buttons 1-9
        for (let i = 1; i <= 9; i++) {
            const btn = this.createPinButton(i.toString());
            pinpadContainer.appendChild(btn);
        }

        // Add 0 button in center of bottom row
        const emptyLeft = document.createElement('div');
        pinpadContainer.appendChild(emptyLeft);
        
        const btn0 = this.createPinButton('0');
        pinpadContainer.appendChild(btn0);
        
        const emptyRight = document.createElement('div');
        pinpadContainer.appendChild(emptyRight);

        overlay.appendChild(pinpadContainer);

        // Action buttons
        const actionContainer = document.createElement('div');
        actionContainer.style.cssText = `
            display: flex;
            gap: 15px;
            margin-top: 20px;
        `;

        const clearBtn = this.createActionButton('CLEAR', '#e74c3c', () => {
            this.enteredPin = '';
            this.updatePinDisplay();
        });

        const closeBtn = this.createActionButton('CLOSE', '#95a5a6', () => {
            this.closePinpad();
        });

        actionContainer.appendChild(clearBtn);
        actionContainer.appendChild(closeBtn);
        overlay.appendChild(actionContainer);

        // Instructions
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            color: #95a5a6;
            font-size: 14px;
            margin-top: 30px;
            text-align: center;
        `;
        instructions.textContent = 'Enter the 5-digit secret PIN or press ESC to close';
        overlay.appendChild(instructions);

        document.body.appendChild(overlay);

        // Store reference for updates
        this.overlay = overlay;
        this.pinDisplay = pinDisplay;
    }

    createPinButton(number) {
        const btn = document.createElement('button');
        btn.textContent = number;
        btn.style.cssText = `
            width: 100px;
            height: 100px;
            background: linear-gradient(145deg, #f39c12, #e67e22);
            border: none;
            border-radius: 15px;
            color: white;
            font-size: 32px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            font-family: 'Courier New', monospace;
        `;

        btn.onmouseover = () => {
            btn.style.transform = 'translateY(-3px)';
            btn.style.boxShadow = '0 8px 20px rgba(243, 156, 18, 0.4)';
        };

        btn.onmouseout = () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        };

        btn.onclick = () => {
            this.addToPin(number);
        };

        return btn;
    }

    createActionButton(text, color, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            padding: 15px 40px;
            background: ${color};
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            font-family: 'Courier New', monospace;
        `;

        btn.onmouseover = () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)';
        };

        btn.onmouseout = () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 3px 10px rgba(0,0,0,0.3)';
        };

        btn.onclick = onClick;

        return btn;
    }

    handlePinInput(key) {
        // Number keys
        if (key >= '0' && key <= '9') {
            this.addToPin(key);
        }
        // Backspace
        else if (key === 'Backspace') {
            this.enteredPin = this.enteredPin.slice(0, -1);
            this.updatePinDisplay();
        }
        // Escape to close
        else if (key === 'Escape') {
            this.closePinpad();
        }
        // Enter to submit
        else if (key === 'Enter') {
            this.checkPin();
        }
    }

    addToPin(digit) {
        if (this.enteredPin.length < 5) {
            this.enteredPin += digit;
            this.updatePinDisplay();
            
            // Auto-check when 5 digits entered
            if (this.enteredPin.length === 5) {
                setTimeout(() => this.checkPin(), 300);
            }
        }
    }

    updatePinDisplay() {
        if (this.pinDisplay) {
            const display = this.enteredPin.padEnd(5, '_');
            this.pinDisplay.textContent = display.split('').join(' ');
        }
    }

    checkPin() {
        if (this.enteredPin === this.correctPin) {
            this.showSuccess();
        } else if (this.enteredPin.length === 5) {
            this.showError();
        }
    }

    showSuccess() {
        if (this.pinDisplay) {
            this.pinDisplay.style.color = '#2ecc71';
            this.pinDisplay.style.borderColor = '#2ecc71';
            this.pinDisplay.textContent = '✓ ✓ ✓ ✓ ✓';
        }

        // Show success message
        setTimeout(() => {
            if (this.overlay) {
                const successMsg = document.createElement('div');
                successMsg.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(46, 204, 113, 0.95);
                    color: white;
                    padding: 40px 60px;
                    border-radius: 20px;
                    font-size: 28px;
                    font-weight: bold;
                    text-align: center;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    animation: fadeIn 0.3s;
                `;
                successMsg.innerHTML = `
                    🎉 ACCESS GRANTED 🎉<br>
                    <div style="font-size: 16px; margin-top: 15px; opacity: 0.9;">
                        Secret unlocked! The Green Machine approves.<br>
                        <span style="color: #f1c40f; font-size: 20px; margin-top: 10px; display: block;">💰 +100,000 CRYPTO! 💰</span>
                    </div>
                `;
                this.overlay.appendChild(successMsg);

                // Award crypto bonus - 5,000,000 crypto
                const player = GameEnv.gameObjects.find(obj => obj.spriteData?.id === 'player');
                if (player && player.spriteData) {
                    player.spriteData.crypto = (player.spriteData.crypto || 0) + 5000000;
                    console.log('🎁 Bonus awarded: 100,000 crypto!');
                }

                setTimeout(() => this.closePinpad(), 3000);
            }
        }, 500);
    }

    showError() {
        if (this.pinDisplay) {
            this.pinDisplay.style.color = '#e74c3c';
            this.pinDisplay.style.borderColor = '#e74c3c';
            this.pinDisplay.textContent = 'X X X X X';
        }

        setTimeout(() => {
            this.enteredPin = '';
            this.updatePinDisplay();
            if (this.pinDisplay) {
                this.pinDisplay.style.color = '#ecf0f1';
                this.pinDisplay.style.borderColor = '#f39c12';
            }
        }, 1000);
    }

    closePinpad() {
        const overlay = document.getElementById('pinpad-overlay');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        
        this.isPinpadOpen = false;
        this.enteredPin = '';
        this.overlay = null;
        this.pinDisplay = null;
    }
}

export default EasterEgg;