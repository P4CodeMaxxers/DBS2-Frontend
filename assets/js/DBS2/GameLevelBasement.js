// GameLevelBasement.js
// Story: The Green Machine - IShowGreen's ethical crypto mining program
// Player learns blockchain concepts through minigames, earns crypto, buys code scraps

import GameEnv from './GameEnv.js';
import Background from './Background.js';
import Player from './Player.js';
import Npc from './Npc.js';
import EasterEgg from './EasterEgg.js';

/**
 * GameLevelBasement
 * - All asset paths use `${path}/images/DBS2/...`
 * - Cards NPC launches Crypto Checker minigame (security training)
 * - Each NPC teaches a different aspect of blockchain/crypto
 * - Pinpad EasterEgg floats near IShowGreen with secret PIN entry
 */
class GameLevelBasement {
  constructor(path = '') {
    // path should be the base path for assets (e.g. '' or '/DBS2-Frontend')
    this.path = path;

    // Responsive dimensions provided by GameEnv.create()
    let width = GameEnv.innerWidth;
    let height = GameEnv.innerHeight;

    /* ----------------------
       BACKGROUND
    ------------------------*/
    const image_data_basement = {
      name: 'basement',
      greeting: "IShowGreen's basement workshop. Screens flicker with blockchain data. Learn, earn, and build The Green Machine.",
      src: `${this.path}/images/DBS2/basement.png`,
      pixels: { height: 580, width: 1038 }
    };

    /* ----------------------
       PLAYER - CHILL GUY
    ------------------------*/
    const CHILLGUY_SCALE_FACTOR = 5;
    const sprite_data_chillguy = {
      id: 'player',
      greeting: "I'm here to learn about ethical crypto mining and help build The Green Machine!",
      src: `${this.path}/images/DBS2/chillguy.png`,
      SCALE_FACTOR: CHILLGUY_SCALE_FACTOR,
      STEP_FACTOR: 1000,
      ANIMATION_RATE: 30,
      INIT_POSITION: { x: 0, y: height - height / CHILLGUY_SCALE_FACTOR },
      pixels: { height: 128, width: 128 },
      orientation: { rows: 4, columns: 4 },
      down: { row: 0, start: 0, columns: 4 },
      left: { row: 2, start: 0, columns: 4 },
      right: { row: 1, start: 0, columns: 4 },
      up: { row: 3, start: 0, columns: 4 },
      hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
      keypress: { up: 87, left: 65, down: 83, right: 68 },
      inventory: [],
      crypto: 0
    };

    /* ----------------------
       NPCs - Each teaches a blockchain concept
    ------------------------*/
    
    // Computer1 - Password Terminal (Infinite User minigame)
    // Teaches: Wallet security and authentication
    const sprite_data_computer1 = {
      id: 'Computer1',
      greeting: "AUTHENTICATION TERMINAL. Learn how password encryption protects crypto wallets.",
      src: `${this.path}/images/DBS2/computer1.png`,
      SCALE_FACTOR: 8,
      ANIMATION_RATE: 8,
      pixels: { height: 64, width: 1280 },
      INIT_POSITION: { x: width * 1 / 4, y: height * 0.07 },
      orientation: { rows: 1, columns: 20 },
      down: { row: 0, start: 0, columns: 20 },
      hitbox: { widthPercentage: 0.01, heightPercentage: 0.01 }
    };

    // Computer2 - Mining Terminal (Crypto Miner minigame)
    // Teaches: Proof of Work and hash functions
    const sprite_data_computer2 = {
      id: 'Computer2',
      greeting: "MINING TERMINAL. Learn how proof-of-work consensus actually works.",
      src: `${this.path}/images/DBS2/computer2.png`,
      SCALE_FACTOR: 8,
      ANIMATION_RATE: 12,
      pixels: { height: 64, width: 832 },
      INIT_POSITION: { x: width * 7 / 12, y: height * 0.01 },
      orientation: { rows: 1, columns: 13 },
      down: { row: 0, start: 0, columns: 12 },
      hitbox: { widthPercentage: 0.01, heightPercentage: 0.01 }
    };

    // IShowGreen - The mentor NPC
    const sprite_data_ishowgreen = {
      id: 'IShowGreen',
      greeting: [
        "$list$",
        "Welcome! I am IShowGreen. I want to mine crypto the RIGHT way.",
        "Complete the minigames to learn about blockchain technology.",
        "Earn crypto and buy code scraps from the CLOSET.",
        "Together, we'll build The Green Machine - ethical crypto mining!"
      ],
      src: `${this.path}/images/DBS2/ishowgreen.png`,
      SCALE_FACTOR: 4,
      ANIMATION_RATE: 18,
      pixels: { height: 128, width: 896 },
      INIT_POSITION: { x: width * 17 / 22, y: height * 1 / 4 },
      orientation: { rows: 1, columns: 7 },
      down: { row: 0, start: 0, columns: 6 },
      hitbox: { widthPercentage: 0.01, heightPercentage: 0.01 }
    };

    /* ----------------------
       PINPAD EASTER EGG - Secret PIN entry
       Floats near IShowGreen
    ------------------------*/
    const sprite_data_pinpad = {
      id: 'Pinpad',
      greeting: 'SECRET SECURITY TERMINAL. Can you crack the code?',
      src: `${this.path}/images/DBS2/pinpad.png`,
      SCALE_FACTOR: 6,
      ANIMATION_RATE: 0,
      pixels: { height: 512, width: 512 },
      INIT_POSITION: { x: width * 19 / 24, y: height * 0.35 },
      orientation: { rows: 1, columns: 1 },
      down: { row: 0, start: 0, columns: 1 },
      hitbox: { widthPercentage: 0.5, heightPercentage: 0.5 },
      stationary: false // Will float up and down
    };

    /* ----------------------
       CARDS (NPC) - Launches Crypto Checker minigame
       Teaches: Identifying scams vs legitimate crypto
       Sprite: 213x237 with 4 frames = 852 total width
    ------------------------*/
    const sprite_data_cards = {
      id: 'Cards',
      greeting: 'SECURITY CHECKPOINT. Learn to identify crypto scams vs legitimate technology!',
      src: `${this.path}/images/DBS2/cards.png`,
      SCALE_FACTOR: 8,
      ANIMATION_RATE: 24,
      pixels: { height: 237, width: 213 },  // 213*4 = 852
      INIT_POSITION: { x: width * 1 / 12, y: height * 0.6 },
      orientation: { rows: 2, columns: 2 },
      down: { row: 0, start: 0, columns: 2 },
      hitbox: { widthPercentage: 0.3, heightPercentage: 0.3 },
      stationary: true
    };

    // Laundry Machine - Transaction Validator minigame
    // Teaches: Transaction validation and verification
    const sprite_data_laundry = {
      id: 'laundry',
      greeting: 'TRANSACTION VALIDATOR. Learn how transactions are cleaned and verified!',
      src: `${this.path}/images/DBS2/computer3.png`,
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 20,
      pixels: { height: 1628, width: 7649 / 5 },
      INIT_POSITION: { x: width * 8 / 21, y: height * 0.75 },
      orientation: { rows: 1, columns: 1 },
      down: { row: 0, start: 0, columns: 5 },
      hitbox: { widthPercentage: 0.3, heightPercentage: 0.3 },
      stationary: true
    };

    // Bookshelf - Ash Trail minigame
    // Teaches: Blockchain verification and audit trails
    const sprite_data_bookshelf = {
      id: 'Bookshelf',
      greeting: 'BLOCKCHAIN ARCHIVE. Trace the transaction trails and verify the chain!',
      src: `${this.path}/images/DBS2/computer4_static.png`,
      SCALE_FACTOR: 8,
      ANIMATION_RATE: 0,
      pixels: { height: 1592, width: 1592 },
      INIT_POSITION: { x: width * 19 / 22, y: height * 3 / 5 },
      orientation: { rows: 1, columns: 1 },
      down: { row: 0, start: 0, columns: 1 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.1 },
      stationary: true
    };

    // Closet - Shop to buy code scraps
    const sprite_data_closet = {
      id: 'Closet',
      greeting: 'THE CLOSET SHOP. Buy code scraps with your earned crypto to build The Green Machine!',
      src: `${this.path}/images/DBS2/closetsheet.png`,
      SCALE_FACTOR: 4,
      ANIMATION_RATE: 80,
      pixels: { height: 2000, width: 16000 },
      INIT_POSITION: { x: width * 8 / 21, y: height * 0.35 },
      orientation: { rows: 1, columns: 13 },
      down: { row: 0, start: 0, columns: 8 },
      hitbox: { widthPercentage: 0.001, heightPercentage: 0.5 },
      stationary: true
    };

    // All objects in the basement level
    this.objects = [
      { class: Background, data: image_data_basement },
      { class: Player, data: sprite_data_chillguy },
      { class: Npc, data: sprite_data_computer1 },
      { class: Npc, data: sprite_data_computer2 },
      { class: Npc, data: sprite_data_ishowgreen },
      { class: EasterEgg, data: sprite_data_pinpad },  // Pinpad Easter Egg
      { class: Npc, data: sprite_data_cards },         // Cards - launches Crypto Checker
      { class: Npc, data: sprite_data_laundry },
      { class: Npc, data: sprite_data_bookshelf },
      { class: Npc, data: sprite_data_closet },
    ];
  }
}

export default GameLevelBasement;