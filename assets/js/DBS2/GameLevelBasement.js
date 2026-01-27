// GameLevelBasement.js
import GameEnv from './GameEnv.js';
import Background from './Background.js';
import Player from './Player.js';
import Npc from './Npc.js';
import startWhackGame from './whackarat.js';

/**
 * GameLevelBasement
 * - All asset paths use `${path}/images/DBS2/...`
 * - SodaCan NPC replaces ShellNpc1 and launches Whackarat minigame
 * - Cards NPC launches Crypto Checker minigame (positioned right beside SodaCan)
 */
class GameLevelBasement {
  constructor(path = '') {
    // path should be the base path for assets (e.g. '' or '/DBS2-Frontend' or location of site)
    this.path = path;

    // Responsive dimensions provided by GameEnv.create()
    let width = GameEnv.innerWidth;
    let height = GameEnv.innerHeight;

    /* ----------------------
       BACKGROUND
    ------------------------*/
    const image_data_basement = {
      name: 'basement',
      greeting: "IShowGreen has locked you in his discord mod basement. Earn enough Crypto to escape.",
      src: `${this.path}/images/DBS2/basement.png`,
      pixels: { height: 580, width: 1038 }
    };

    /* ----------------------
       PLAYER - CHILL GUY
    ------------------------*/
    const CHILLGUY_SCALE_FACTOR = 5;
    const sprite_data_chillguy = {
      id: 'player', // Note: GameLevel expects the player id to be "player" in some places
      greeting: "I am Chill Guy, the desert wanderer. I am looking for wisdom and adventure!",
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
       NPCs
    ------------------------*/
    const sprite_data_computer1 = {
      id: 'Computer1',
      greeting: "PASSWORD REQUIRED. DECRYPTION SEQUENCE: ACTIVATED.",
      src: `${this.path}/images/DBS2/computer1.png`,
      SCALE_FACTOR: 8,
      ANIMATION_RATE: 8,
      pixels: { height: 64, width: 1280 },
      INIT_POSITION: { x: width * 1 / 4, y: height * 0.07 },
      orientation: { rows: 1, columns: 20 },
      down: { row: 0, start: 0, columns: 20 },
      hitbox: { widthPercentage: 0.01, heightPercentage: 0.01 }
    };

    const sprite_data_computer2 = {
      id: 'Computer2',
      greeting: [
        "$list$",
        "Hi, I am Computer2! I am the GitHub code guardian.",
        "Wait, you're not IShowGreen? Finally, someone with proper sanitation!",
        "Psst! Don't tell him I keep deleting his NFTs...",
        "Finally, someone without Dorito dust on their fingers."
      ],
      src: `${this.path}/images/DBS2/computer2.png`,
      SCALE_FACTOR: 8,
      ANIMATION_RATE: 12,
      pixels: { height: 64, width: 832 },
      INIT_POSITION: { x: width * 7 / 12, y: height * 0.01 },
      orientation: { rows: 1, columns: 13 },
      down: { row: 0, start: 0, columns: 12 },
      hitbox: { widthPercentage: 0.01, heightPercentage: 0.01 }
    };

    const sprite_data_ishowgreen = {
      id: 'IShowGreen',
      greeting: [
        "$list$",
        "Crypto... bLOcKcHaIn...",
        "EW, WHAT IS THAT SMELL? ... SHAMPOO?!",
        "Get out of my room unless you're buying my meme coin!",
        "Don't give me water... I HATE the taste!"
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
       SODA CAN (NPC) - Launches Whackarat
    ------------------------*/
    const sprite_data_sodacan = {
      id: 'SodaCan',
      greeting: 'Whack some rats! DONT EVEN THINK OF TOUCHING MY CANS!!!',
      src: `${this.path}/images/DBS2/sodacan.png`,
      SCALE_FACTOR: 8,
      ANIMATION_RATE: 0,
      pixels: { height: 1000, width: 750 },
      INIT_POSITION: { x: width * 1 / 12, y: height * 0.6 },
      orientation: { rows: 1, columns: 1 },
      down: { row: 0, start: 0, columns: 1 },
      hitbox: { widthPercentage: 0.3, heightPercentage: 0.3 },
      stationary: true
    };

    /* ----------------------
       CARDS (NPC) - Launches Crypto Checker
       Positioned to the RIGHT of the soda can (further away to avoid overlap)
    ------------------------*/
    const sprite_data_cards = {
      id: 'Cards',
      greeting: 'Test your crypto knowledge! Approve legit coins, reject scams!',
      src: `${this.path}/images/DBS2/cards.png`,
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 0,
      pixels: { height: 600, width: 600 },
      INIT_POSITION: { x: width * 1 / 12 + width * 0.15, y: height * 0.62 }, // Moved further right
      orientation: { rows: 1, columns: 1 },
      down: { row: 0, start: 0, columns: 1 },
      hitbox: { widthPercentage: 0.3, heightPercentage: 0.3 },
      stationary: true
    };

    /* ----------------------
       TRADING TERMINAL (NPC) - Launches Buy or Hold
       Positioned near the computers
    ------------------------*/
    const sprite_data_trading_terminal = {
      id: 'TradingTerminal',
      greeting: 'Test your trading skills! Can you beat the market?',
      src: `${this.path}/images/DBS2/terminal.png`, // You'll need to add this image
      SCALE_FACTOR: 8,
      ANIMATION_RATE: 0,
      pixels: { height: 600, width: 600 }, // Adjust based on your actual image
      INIT_POSITION: { x: width * 1 / 12 + width * 0.30, y: height * 0.62 }, // Positioned to the right of Cards
      orientation: { rows: 1, columns: 1 },
      down: { row: 0, start: 0, columns: 1 },
      hitbox: { widthPercentage: 0.3, heightPercentage: 0.3 },
      stationary: true
    };

    const sprite_data_shell2 = {
      id: 'laundry',
      greeting: 'Fix the laundry machine!',
      src: `${this.path}/images/DBS2/broken-washing-machine-jpeg.jpg`,
      SCALE_FACTOR: 5,
      ANIMATION_RATE: 0,
      pixels: { height: 423, width: 414 },
      INIT_POSITION: { x: width * 8 / 21, y: height * 0.75 },
      orientation: { rows: 1, columns: 1 },
      down: { row: 0, start: 0, columns: 1 },
      hitbox: { widthPercentage: 0.01, heightPercentage: 0.01 },
      stationary: true
    };

    const sprite_data_bookshelf = {
      id: 'Bookshelf',
      greeting: 'A bookshelf filled with coding books and references.',
      src: `${this.path}/images/DBS2/Tracethepage.png`,
      SCALE_FACTOR: 3,
      ANIMATION_RATE: 0,
      pixels: { height: 592, width: 592 },
      INIT_POSITION: { x: width * 19 / 22, y: height * 3 / 5 },
      orientation: { rows: 1, columns: 1 },
      down: { row: 0, start: 0, columns: 1 },
      hitbox: { widthPercentage: 0.01, heightPercentage: 0.01 },
      stationary: true
    };

    const sprite_data_closet = {
      id: 'Closet',
      greeting: 'Browse and purchase items from the closet shop!',
      src: `${this.path}/images/DBS2/closet.png`,
      SCALE_FACTOR: 8,
      ANIMATION_RATE: 0,
      pixels: { height: 1439, width: 1338 },
      INIT_POSITION: { x: width * 8 / 21, y: height * 0.45 },
      orientation: { rows: 1, columns: 1 },
      down: { row: 0, start: 0, columns: 1 },
      hitbox: { widthPercentage: 0.3, heightPercentage: 0.3 },
      stationary: true
    };

    // All objects in the basement level
    this.objects = [
      { class: Background, data: image_data_basement },
      { class: Player, data: sprite_data_chillguy },
      { class: Npc, data: sprite_data_computer1 },
      { class: Npc, data: sprite_data_computer2 },
      { class: Npc, data: sprite_data_ishowgreen },
      { class: Npc, data: sprite_data_sodacan }, // Monster can - launches Whackarat
      { class: Npc, data: sprite_data_cards },   // Cards - launches Crypto Checker (RIGHT BESIDE soda can)
      { class: Npc, data: sprite_data_trading_terminal }, 
      { class: Npc, data: sprite_data_shell2 },
      { class: Npc, data: sprite_data_bookshelf },
      { class: Npc, data: sprite_data_closet },
    ];
  }
}

export default GameLevelBasement;