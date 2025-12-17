/// whackarat.js
// Whack-a-rat minigame with proper backend sync for code scrap rewards
import { updateCrypto, isMinigameCompleted, completeMinigame, addInventoryItem } from './StatsManager.js';

const Whack = {
  canvas: null,
  ctx: null,
  width: 800,
  height: 600,
  images: {},
  mouse: { x: 0, y: 0, down: false },
  score: 0,
  timer: 15000,
  spawnInterval: 1000,
  lastSpawn: 0,
  entities: [],
  running: false,
  lastFrame: 0,
  onComplete: null,
  isFirstCompletion: false,
  overlay: null,
  baseurl: ''
};

function loadImage(name, src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log(`[Whackarat] Loaded: ${name}`);
      resolve({ name, img });
    };
    img.onerror = (e) => {
      console.error(`[Whackarat] Failed to load: ${name} from ${src}`);
      reject(new Error('Failed to load ' + src));
    };
    img.src = src;
  });
}

async function loadAssets(basePath) {
  console.log('[Whackarat] Loading assets from:', basePath);
  
  const manifest = [
    ['basement', `${basePath}/closet.jpg`],
    ['pipes', `${basePath}/pipes.png`],
    ['hammer', `${basePath}/hammer.png`],
    ['rat', `${basePath}/movingrat.gif`],
    ['soda', `${basePath}/sodacan.png`]
  ];

  try {
    const promises = manifest.map(m => loadImage(m[0], m[1]));
    const assets = await Promise.all(promises);
    assets.forEach(a => Whack.images[a.name] = a.img);
    console.log('[Whackarat] All assets loaded');
  } catch (error) {
    console.error('[Whackarat] Asset loading failed:', error);
    throw error;
  }
}

function createCanvasInOverlay(overlay) {
  const existing = overlay.querySelector('#whack-root');
  if (existing) existing.remove();

  const root = document.createElement('div');
  root.id = 'whack-root';
  root.style.cssText = `
    position: relative;
    width: 900px;
    max-width: 95%;
    height: 700px;
    background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
    border: 2px solid #0a5;
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Courier New', monospace;
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'EXIT';
  closeBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    font-size: 12px;
    background: #600;
    border: 1px solid #800;
    color: #ccc;
    padding: 6px 15px;
    cursor: pointer;
    font-family: 'Courier New', monospace;
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = '#800';
  closeBtn.onmouseout = () => closeBtn.style.background = '#600';

  closeBtn.addEventListener('click', () => {
    stopGame();
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  });

  root.appendChild(closeBtn);

  const canvas = document.createElement('canvas');
  canvas.id = 'whack-canvas';
  canvas.width = Whack.width;
  canvas.height = Whack.height;
  canvas.style.cssText = `
    border: 2px solid #052;
    border-radius: 6px;
  `;
  root.appendChild(canvas);

  overlay.appendChild(root);
  return canvas;
}

function initGameListeners(canvas) {
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    Whack.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    Whack.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  });

  canvas.addEventListener('mousedown', () => Whack.mouse.down = true);
  canvas.addEventListener('mouseup', () => Whack.mouse.down = false);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
}

function spawnTarget() {
  const slotsX = [120, 290, 460, 630];
  const slotsY = [240, 340];
  const x = slotsX[Math.floor(Math.random() * slotsX.length)];
  const y = slotsY[Math.floor(Math.random() * slotsY.length)];

  const isRat = Math.random() < 0.6;
  Whack.entities.push({
    type: isRat ? 'rat' : 'soda',
    x: x - 30,
    y: y - 30,
    w: 60,
    h: 60,
    alive: true,
    ttl: 800 + Math.random() * 900
  });
}

function update(dt) {
  Whack.timer -= dt;
  if (Whack.timer <= 0) {
    Whack.running = false;
  }

  Whack.spawnInterval = Math.max(400, Whack.spawnInterval - dt * 0.002);

  if (performance.now() - Whack.lastSpawn > Whack.spawnInterval) {
    spawnTarget();
    Whack.lastSpawn = performance.now();
  }

  Whack.entities = Whack.entities.filter(e => {
    e.ttl -= dt;
    if (Whack.mouse.down &&
        Whack.mouse.x > e.x &&
        Whack.mouse.x < e.x + e.w &&
        Whack.mouse.y > e.y &&
        Whack.mouse.y < e.y + e.h) {

      Whack.mouse.down = false;

      if (e.type === 'rat') Whack.score += 100;
      else Whack.score -= 50;

      return false;
    }
    return e.ttl > 0;
  });
}

function draw() {
  const ctx = Whack.ctx;
  ctx.clearRect(0, 0, Whack.width, Whack.height);

  const bg = Whack.images.basement;
  if (bg) ctx.drawImage(bg, 0, 0, Whack.width, Whack.height);

  const pipes = Whack.images.pipes;
  if (pipes) ctx.drawImage(pipes, (Whack.width - pipes.width)/2, 150);

  Whack.entities.forEach(e => {
    const img = Whack.images[e.type];
    if (img) ctx.drawImage(img, e.x, e.y, e.w, e.h);
    else {
      ctx.fillStyle = e.type === 'rat' ? 'brown' : 'cyan';
      ctx.fillRect(e.x, e.y, e.w, e.h);
    }
  });

  // HUD
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(10, 10, 150, 50);
  ctx.fillRect(Whack.width - 160, 10, 150, 50);
  
  ctx.fillStyle = "#0a5";
  ctx.font = "18px 'Courier New', monospace";
  ctx.fillText("Time: " + Math.ceil(Whack.timer / 1000) + "s", 20, 42);
  ctx.fillText("Score: " + Whack.score, Whack.width - 150, 42);

  const hammer = Whack.images.hammer;
  if (hammer) ctx.drawImage(hammer, Whack.mouse.x - 24, Whack.mouse.y - 24, 48, 48);
}

function loop(ts) {
  if (!Whack.running) return;
  const dt = ts - Whack.lastFrame;
  Whack.lastFrame = ts;

  update(dt);
  draw();

  if (Whack.running) requestAnimationFrame(loop);
  else endGame();
}

async function endGame() {
  Whack.running = false;
  
  // Calculate crypto reward - proportional to score
  // Score of 500 = 25 crypto, Score of 1000 = 50 crypto, etc.
  const baseReward = Math.max(0, Math.floor(Whack.score / 20));
  const bonus = Whack.isFirstCompletion ? 25 : 0;
  const totalReward = baseReward + bonus;
  
  // Award crypto
  if (totalReward > 0) {
    try {
      await updateCrypto(totalReward);
      console.log('[Whackarat] Awarded crypto:', totalReward);
    } catch (e) {
      console.log('[Whackarat] Could not award crypto:', e);
    }
  }
  
  // Mark complete and add code scrap on first completion
  if (Whack.isFirstCompletion) {
    try {
      await completeMinigame('whackarat');
      console.log('[Whackarat] Marked as complete');
      
      await addInventoryItem({
        name: 'Code Scrap: Whack-a-Rat',
        found_at: 'whackarat',
        timestamp: new Date().toISOString()
      });
      console.log('[Whackarat] Code scrap added to inventory');
    } catch (e) {
      console.log('[Whackarat] Could not save completion:', e);
    }
  }
  
  // Refresh leaderboard
  try {
    if (window.Leaderboard && typeof window.Leaderboard.refresh === 'function') {
      window.Leaderboard.refresh();
    }
    if (window.GameControl && window.GameControl.leaderboard) {
      window.GameControl.leaderboard.refresh();
    }
  } catch(e) { 
    console.log('[Whackarat] Could not refresh leaderboard'); 
  }
  
  // Show styled results popup
  showResultsPopup(Whack.score, baseReward, bonus, totalReward);
  
  if (Whack.onComplete) {
    Whack.onComplete(totalReward);
  }
}

function showResultsPopup(score, baseReward, bonus, totalReward) {
  const root = Whack.overlay?.querySelector('#whack-root');
  if (!root) return;
  
  // Dim the canvas
  if (Whack.ctx) {
    Whack.ctx.fillStyle = "rgba(0,0,0,0.7)";
    Whack.ctx.fillRect(0, 0, Whack.width, Whack.height);
  }
  
  const popup = document.createElement('div');
  popup.id = 'whack-results-popup';
  popup.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
    border: 2px solid #0a5;
    border-radius: 15px;
    padding: 30px;
    text-align: center;
    z-index: 100;
    min-width: 350px;
    max-width: 450px;
    font-family: 'Courier New', monospace;
    box-shadow: 0 0 30px rgba(0, 170, 85, 0.3);
  `;
  
  // Different content based on first completion
  let contentHtml = '';
  
  if (Whack.isFirstCompletion && score > 0) {
    contentHtml = `
      <h2 style="color: #0a5; margin: 0 0 15px 0; font-size: 20px; letter-spacing: 2px;">
        CODE FRAGMENT RECOVERED
      </h2>
      <p style="color: #888; font-size: 13px; margin-bottom: 15px;">
        Found a piece of paper behind the pipes. The rats were using it as bedding.
      </p>
      <div style="background: rgba(0,170,85,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #052;">
        <img src="${Whack.baseurl}/images/DBS2/codescrapWhackarat.png" 
             style="max-width: 100px; margin: 10px auto; display: block; border: 2px solid #0a5; border-radius: 6px;" 
             onerror="this.outerHTML='<div style=\\'font-size:48px;\\'>📜</div>'">
        <p style="color: #0a5; font-size: 12px; margin: 10px 0 0 0;">Code fragment added to inventory</p>
      </div>
      <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; margin-bottom: 15px;">
        <div style="color: #888; font-size: 12px;">Final Score</div>
        <div style="color: #0a5; font-size: 28px; font-weight: bold;">${score}</div>
      </div>
      <div style="color: #0a5; font-size: 16px; margin-bottom: 5px;">
        +${baseReward} Crypto (from score)
      </div>
      <div style="color: #ffd700; font-size: 14px; margin-bottom: 15px;">
        +${bonus} Crypto (first completion bonus!)
      </div>
      <div style="color: #0f0; font-size: 18px; font-weight: bold; margin-bottom: 20px;">
        Total: +${totalReward} Crypto
      </div>
    `;
  } else if (score > 0) {
    contentHtml = `
      <h2 style="color: #0a5; margin: 0 0 15px 0; font-size: 20px; letter-spacing: 2px;">
        EXTERMINATION COMPLETE
      </h2>
      <p style="color: #888; font-size: 13px; margin-bottom: 15px;">
        The rats scatter back into the walls. For now.
      </p>
      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <div style="color: #888; font-size: 12px;">Final Score</div>
        <div style="color: #0a5; font-size: 32px; font-weight: bold;">${score}</div>
      </div>
      <div style="color: #0a5; font-size: 18px; margin-bottom: 20px;">
        +${totalReward} Crypto
      </div>
    `;
  } else {
    contentHtml = `
      <h2 style="color: #800; margin: 0 0 15px 0; font-size: 20px; letter-spacing: 2px;">
        THE RATS WIN
      </h2>
      <p style="color: #888; font-size: 13px; margin-bottom: 15px;">
        You hit more soda cans than rats. The basement remains infested.
      </p>
      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <div style="color: #888; font-size: 12px;">Final Score</div>
        <div style="color: #800; font-size: 32px; font-weight: bold;">${score}</div>
      </div>
      <div style="color: #666; font-size: 14px; margin-bottom: 20px;">
        No crypto earned. Try again!
      </div>
    `;
  }
  
  popup.innerHTML = contentHtml + `
    <button id="whack-continue-btn" style="
      background: #052;
      color: #0a5;
      border: 1px solid #0a5;
      padding: 12px 30px;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      transition: all 0.2s;
    ">CONTINUE</button>
  `;
  
  root.appendChild(popup);
  
  const continueBtn = document.getElementById('whack-continue-btn');
  if (continueBtn) {
    continueBtn.onmouseover = () => {
      continueBtn.style.background = '#0a5';
      continueBtn.style.color = '#000';
    };
    continueBtn.onmouseout = () => {
      continueBtn.style.background = '#052';
      continueBtn.style.color = '#0a5';
    };
    continueBtn.onclick = () => {
      if (Whack.overlay && Whack.overlay.parentNode) {
        Whack.overlay.parentNode.removeChild(Whack.overlay);
      }
      window.whackaratActive = false;
      window.minigameActive = false;
    };
  }
}

function stopGame() {
  Whack.running = false;
  window.whackaratActive = false;
  window.minigameActive = false;
  
  // Refresh leaderboard on exit
  try {
    if (window.Leaderboard && typeof window.Leaderboard.refresh === 'function') {
      window.Leaderboard.refresh();
    }
  } catch(e) {}
  
  if (Whack.canvas && Whack.canvas.parentNode) {
    Whack.canvas.parentNode.removeChild(Whack.canvas);
  }
  Whack.canvas = null;
  Whack.ctx = null;
  Whack.overlay = null;
}

// PUBLIC: startWhackGame(overlayElement, basePath, onComplete)
export default async function startWhackGame(overlayElement, basePath = '/images/DBS2', onComplete = null) {
  console.log('[Whackarat] Starting game...');
  
  window.whackaratActive = true;
  window.minigameActive = true;
  
  // Store overlay and base URL
  Whack.overlay = overlayElement;
  Whack.baseurl = document.body.getAttribute('data-baseurl') || '';
  Whack.onComplete = onComplete;
  
  // Check if first completion BEFORE starting
  try {
    Whack.isFirstCompletion = !(await isMinigameCompleted('whackarat'));
    console.log('[Whackarat] First completion:', Whack.isFirstCompletion);
  } catch (e) {
    console.log('[Whackarat] Could not check completion status:', e);
    Whack.isFirstCompletion = false;
  }
  
  // Reset state
  Whack.score = 0;
  Whack.timer = 45000;
  Whack.spawnInterval = 800 + Math.random() * 400;
  Whack.entities = [];
  Whack.running = true;
  Whack.lastSpawn = 0;
  Whack.lastFrame = performance.now();

  // Build canvas
  const canvas = createCanvasInOverlay(overlayElement);
  Whack.canvas = canvas;
  Whack.ctx = canvas.getContext('2d');

  // Show loading message
  Whack.ctx.fillStyle = '#0d0d1a';
  Whack.ctx.fillRect(0, 0, Whack.width, Whack.height);
  Whack.ctx.fillStyle = '#0a5';
  Whack.ctx.font = '24px "Courier New", monospace';
  Whack.ctx.textAlign = 'center';
  Whack.ctx.fillText('Loading...', Whack.width / 2, Whack.height / 2);
  Whack.ctx.textAlign = 'left';

  try {
    await loadAssets(basePath);
    initGameListeners(canvas);
    requestAnimationFrame(loop);
  } catch (error) {
    console.error('[Whackarat] Failed to load:', error);
    Whack.ctx.fillStyle = '#800';
    Whack.ctx.textAlign = 'center';
    Whack.ctx.fillText('Error loading assets!', Whack.width / 2, Whack.height / 2);
    Whack.ctx.font = '14px monospace';
    Whack.ctx.fillStyle = '#666';
    Whack.ctx.fillText('Check console for details', Whack.width / 2, Whack.height / 2 + 30);
    Whack.ctx.textAlign = 'left';
  }
}

export function stopWhackGame() {
  stopGame();
}