import GameEnv from './GameEnv.js';
import Character from './Character.js';
import Inventory from './Inventory.js';
import { getEquippedCharacter as getEquippedFromBackend } from './StatsManager.js';

// Define non-mutable constants as defaults
const SCALE_FACTOR = 25;
const STEP_FACTOR = 100;
const ANIMATION_RATE = 1;
const INIT_POSITION = { x: 0, y: 0 };

/**
 * Helper function to check if any minigame or dialogue is active
 */
function isMinigameOrDialogueActive() {
    return window.minigameActive || 
           window.ashTrailActive || 
           window.cryptoMinerActive || 
           window.laundryMinigameActive ||
           window.infiniteUserActive ||
           window.dialogueActive;
}

/**
 * Player is a dynamic class that manages the data and events for objects like a player 
 */
class Player extends Character {
    /**
     * The constructor method is called when a new Player object is created.
     * 
     * @param {Object|null} data - The sprite data for the object. If null, a default red square is used.
     */
    constructor(data = null) {
        // Load equipped character before initializing
        const characterData = Player.loadEquippedCharacter(data);
        
        super(characterData);
        this.keypress = data?.keypress || {up: 87, left: 65, down: 83, right: 68};
        this.characterId = characterData.characterId || 'chillguy';
        this.bindEventListeners();
        
        // Link this player to the global Inventory
        try {
            Inventory.setOwner(this);
            this.inventory = Inventory.getItems();
        } catch (e) {
            console.error('Could not attach Inventory to Player', e);
            this.inventory = this.inventory || [];
        }
    }

    /**
     * Load the equipped character sprite data
     */
    static loadEquippedCharacter(baseData) {
        const baseurl = document.body.getAttribute('data-baseurl') || '';
        
        // Get equipped character from localStorage
        const equippedId = localStorage.getItem('equippedCharacter') || 'chillguy';
        
        // Character sprite definitions
        const CHARACTER_SPRITES = {
            chillguy: {
                src: `${baseurl}/images/DBS2/chillguy.png`,
                pixels: { height: 128, width: 128 },
                SCALE_FACTOR: 5
            },
            'character_pink_princess': {
                src: `${baseurl}/images/DBS2/pink-princess.png`,
                pixels: { height: 128, width: 128 },
                SCALE_FACTOR: 5
            },
            'character_yellow_princess': {
                src: `${baseurl}/images/DBS2/yellow-princess.png`,
                pixels: { height: 128, width: 128 },
                SCALE_FACTOR: 5
            }
        };
        
        // Get the equipped character sprite or default to chillguy
        const equippedSprite = CHARACTER_SPRITES[equippedId] || CHARACTER_SPRITES.chillguy;
        
        // Merge equipped sprite data with base data
        const characterData = {
            ...baseData,
            src: equippedSprite.src,
            pixels: equippedSprite.pixels,
            SCALE_FACTOR: equippedSprite.SCALE_FACTOR,
            characterId: equippedId
        };
        
        console.log('[Player] Loaded equipped character:', equippedId);
        
        return characterData;
    }

    /**
     * Change the player's character sprite
     */
    changeCharacter(characterId) {
        const baseurl = document.body.getAttribute('data-baseurl') || '';
        
        const CHARACTER_SPRITES = {
            chillguy: {
                src: `${baseurl}/images/DBS2/chillguy.png`,
                pixels: { height: 128, width: 128 },
                SCALE_FACTOR: 5
            },
            'character_pink_princess': {
                src: `${baseurl}/images/DBS2/pink-princess.png`,
                pixels: { height: 128, width: 128 },
                SCALE_FACTOR: 5
            },
            'character_yellow_princess': {
                src: `${baseurl}/images/DBS2/yellow-princess.png`,
                pixels: { height: 128, width: 128 },
                SCALE_FACTOR: 5
            }
        };
        
        const newSprite = CHARACTER_SPRITES[characterId];
        if (!newSprite) {
            console.error('[Player] Invalid character ID:', characterId);
            return false;
        }
        
        // Update sprite sheet
        this.spriteSheet.src = newSprite.src;
        this.characterId = characterId;
        
        // Store in localStorage
        localStorage.setItem('equippedCharacter', characterId);
        
        console.log('[Player] Character changed to:', characterId);
        
        return true;
    }

    /**
     * Binds key event listeners to handle object movement.
     */
    bindEventListeners() {
        addEventListener('keydown', this.handleKeyDown.bind(this));
        addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleKeyDown(event) {
        // Disable movement while any minigame or dialogue is active
        if (isMinigameOrDialogueActive()) return;
        
        const keyCode = event.keyCode || event.which;
        if (!keyCode) return;
        
        switch (keyCode) {
            case this.keypress.up:
                this.velocity.y = -5;
                this.direction = 'up';
                break;
            case this.keypress.left:
                this.velocity.x = -5;
                this.direction = 'left';
                break;
            case this.keypress.down:
                this.velocity.y = 5;
                this.direction = 'down';
                break;
            case this.keypress.right:
                this.velocity.x = 5;
                this.direction = 'right';
                break;
        }
    }

    /**
     * Handles key up events to stop the player's velocity.
     */
    handleKeyUp(event) {
        // Disable movement while any minigame or dialogue is active
        if (isMinigameOrDialogueActive()) return;
        
        const keyCode = event.keyCode || event.which;
        if (!keyCode) return;
        
        switch (keyCode) {
            case this.keypress.up:
                this.velocity.y = 0;
                break;
            case this.keypress.left:
                this.velocity.x = 0;
                break;
            case this.keypress.down: 
                this.velocity.y = 0;
                break;
            case this.keypress.right: 
                this.velocity.x = 0;
                break;
        }
    }
}

export default Player;