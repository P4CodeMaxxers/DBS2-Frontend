---
title: "Aryan Collegeboard Requirements"
layout: page
permalink: /aryan-collegeboard-requirements/
---

# Whack-a-Rat (DBS2) — Component A: Program Code Requirements

This document maps each **AP CSP "Component A: Program Code Requirements"** item for the Whack-a-Rat minigame.

## Instructions for input 

Whack-a-Rat reads **mouse input** (position and clicks) to track the cursor and hit targets.

```119:132:DBS2-Frontend/assets/js/DBS2/whackarat.js
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
```

## Use of at least one list (collection type) to manage complexity

### List #1: `entities` (spawned targets)

Whack-a-Rat uses an array to store all active game entities (rats and soda cans), each with properties for type, position, size, and time-to-live.

```javascript
let entities: [];    // array of spawned entities {type, x, y, w, h, alive, ttl}
```

Each entity contains:
- `type`: 'rat' or 'soda' (determines scoring)
- `x, y, w, h`: position and dimensions
- `alive`: whether entity is still active
- `ttl`: time-to-live countdown

### List #2: `manifest` (asset loading)

The program uses an array to manage multiple image assets that need to be loaded before the game starts.

```33:47:DBS2-Frontend/assets/js/DBS2/whackarat.js
async function loadAssets(basePath) {
  console.log('[Whackarat] Loading assets from:', basePath);
  
  const manifest = [
    ['basement', `${basePath}/closet.jpg`],
    ['pipes', `${basePath}/pipes.png`],
    ['hammer', `${basePath}/hammer.png`],
    ['rat', `${basePath}/movingrat.gif`],
    ['soda', `${basePath}/sodacan.png`]
  ];

  const promises = manifest.map(m => loadImage(m[0], m[1]));
  const assets = await Promise.all(promises);
  assets.forEach(a => Whack.images[a.name] = a.img);
}
```

These lists make the code scalable (adding new entity types or assets doesn't require rewriting core game logic).

## A student-developed procedure (name + parameters + contributes to program purpose)

### Procedure: `update(dt)`

This procedure updates the game state each frame, managing timer countdown, spawn rate, entity spawning, and hit detection.

```148:181:DBS2-Frontend/assets/js/DBS2/whackarat.js
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
```

**Parameter**: `dt` (delta time in milliseconds) - time elapsed since last frame

**Purpose**: This procedure is the core game loop logic that handles all game state updates, making the game interactive and progressively challenging.

## Algorithm includes sequencing, selection, and iteration (inside the procedure)

The `update(dt)` procedure contains:

- **Sequencing**: 
  1. Decrease timer by delta time
  2. Check if game should end (timer expired)
  3. Decrease spawn interval to increase difficulty
  4. Check if time to spawn new target
  5. Process all entities for hits and time-to-live expiration

- **Selection**: 
  - `if (Whack.timer <= 0)` - end game condition
  - `if (performance.now() - Whack.lastSpawn > Whack.spawnInterval)` - spawn timing check
  - `if (Whack.mouse.down && ...)` - hit detection with boundary checking
  - `if (e.type === 'rat')` vs `else` - scoring logic based on target type
  - `return e.ttl > 0` - entity removal condition in filter

- **Iteration**: 
  - `Whack.entities = Whack.entities.filter(e => {...})` - loops through all entities to update time-to-live and check for player hits

## Calls to student-developed procedure

The game calls `update(dt)` every frame from the main game loop:

```220:233:DBS2-Frontend/assets/js/DBS2/whackarat.js
function loop(ts) {
  if (!Whack.running) return;
  const dt = ts - Whack.lastFrame;
  Whack.lastFrame = ts;

  update(dt);
  draw();

  if (Whack.running) requestAnimationFrame(loop);
  else endGame();
}
```

## Instructions for output 

Whack-a-Rat displays output both visually (canvas rendering) and textually (HUD and results popup).

### Example: Visual output (game rendering)

```183:218:DBS2-Frontend/assets/js/DBS2/whackarat.js
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
```

### Example: Text output (results popup)

```289:300:DBS2-Frontend/assets/js/DBS2/whackarat.js
function showResultsPopup(score, baseReward, bonus, totalReward) {
  // Creates styled popup with final score and crypto earned
  const popup = document.createElement('div');
  popup.innerHTML = `
    <h2>EXTERMINATION COMPLETE</h2>
    <div>Final Score: ${score}</div>
    <div>+${totalReward} Crypto</div>
    <button>CONTINUE</button>
  `;
  root.appendChild(popup);
}
```

## Online data stream (backend) + persistence of progress

Whack-a-Rat saves progress and awards crypto via backend API calls.

### Save crypto reward to backend

```235:268:DBS2-Frontend/assets/js/DBS2/whackarat.js
async function endGame() {
  Whack.running = false;
  
  // Calculate crypto reward proportional to score
  const baseReward = Math.max(0, Math.floor(Whack.score / 20));
  const bonus = Whack.isFirstCompletion ? 25 : 0;
  const totalReward = baseReward + bonus;
  
  // Award crypto through backend
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
      
      await addInventoryItem({
        name: 'Code Scrap: Whack-a-Rat',
        found_at: 'whackarat',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.log('[Whackarat] Could not save completion:', e);
    }
  }
}
```

### Backend API calls (from StatsManager.js)

```203:238:DBS2-Frontend/assets/js/DBS2/StatsManager.js
// Update crypto balance
export async function updateCrypto(amount) {
  try {
    if (DBS2API && DBS2API.updateCrypto) {
      const result = await DBS2API.updateCrypto(amount);
      return result.crypto || 0;
    }
  } catch (e) {
    console.log('API updateCrypto failed:', e);
  }
}

// Mark minigame as completed
export async function completeMinigame(gameId) {
  try {
    if (DBS2API && DBS2API.completeMinigame) {
      return await DBS2API.completeMinigame(gameId);
    }
  } catch (e) {
    console.log('API completeMinigame failed:', e);
  }
}

// Add item to inventory
export async function addInventoryItem(item) {
  try {
    if (DBS2API && DBS2API.addInventoryItem) {
      return await DBS2API.addInventoryItem(item);
    }
  } catch (e) {
    console.log('API addInventoryItem failed:', e);
  }
}
```

### Backend persistence (similar structure to Ash Trail)

The backend stores player data in the `DBS2Player` model with:
- Crypto balance
- Completed minigames list  
- Inventory items
- Scores for leaderboards

```7:64:DBS2-Backend/model/dbs2_player.py
class DBS2Player(db.Model):
  _crypto = db.Column(db.Integer, default=0)
  _completed_minigames = db.Column(db.Text, default='[]')
  _inventory = db.Column(db.Text, default='[]')
  _scores = db.Column(db.Text, default='{}')

  @property
  def crypto(self):
    return self._crypto

  @property
  def completed_minigames(self):
    try:
      return json.loads(self._completed_minigames)
    except:
      return []

  @property
  def inventory(self):
    try:
      return json.loads(self._inventory)
    except:
      return []
```

Data persists across sessions through database storage, allowing players to resume progress and compete on leaderboards.

## Extra (difficulty scaling) — algorithmic game balancing

The game implements dynamic difficulty by progressively decreasing spawn intervals:

```155:155:DBS2-Frontend/assets/js/DBS2/whackarat.js
Whack.spawnInterval = Math.max(400, Whack.spawnInterval - dt * 0.002);
```

This creates an adaptive challenge where targets appear faster as the game progresses, requiring quicker player reactions. The minimum spawn interval of 400ms prevents impossible difficulty while maintaining engagement throughout the 45-second timer.

---

## Full Process of Step-by-Step Integration Flow (Whackarat → Backend Integration)

### Step 1: Player Initiates Minigame

1. Player walks ChillGuy character to the SodaCan NPC in the basement
2. Player presses the **E key** when within collision range
3. `Npc.js` detects the collision and keypress event
4. System calls `launchWhackARat()` method

### Step 2: Minigame Execution

1. Fullscreen overlay is created and displayed
2. `whackarat.js` module is loaded
3. Game initializes
4. Player must click rats to score points during 45-second timer

### Step 3: Game Completion

When player completes the game (timer expires):

1. Game sets `running = false`
2. Game calculates reward:
   - Base reward: `Math.floor(score / 20)` crypto
   - First-time bonus: +25 crypto
   - Total reward calculated
3. `endGame()` function is triggered
4. Overlay displays results with score and crypto earned

### Step 4: Local State Update

1. Callback receives crypto reward amount
2. System finds player object in `GameEnv.gameObjects` array
3. Player's local crypto value is updated via `updateCrypto(amount)`
4. Updated value is logged to console for debugging

### Step 5: Backend API Call

System prepares API request with:

- User ID from authentication system
- Updated total crypto amount
- Minigame completion status
- Inventory item (code scrap) for first completion
- Timestamp of transaction
- JWT authentication token

POST request sent to backend endpoints:

- `/api/player/updateCrypto` - Updates crypto balance
- `/api/player/completeMinigame` - Marks minigame as completed
- `/api/player/addInventoryItem` - Adds code scrap reward

Request includes proper authentication headers.

### Step 6: Backend Processing

Backend receives POST request:

1. JWT token is validated for authentication
2. User ID is verified against database
3. Backend checks:
   - Valid user session
   - Crypto amount is reasonable (anti-cheat)
   - Request hasn't been duplicated
4. Database transaction begins

### Step 7: Database Update

Backend updates player record in database:

1. Updates `_crypto` field with new total
2. Adds minigame ID to `_completed_minigames` list
3. Adds code scrap to `_inventory` array
4. Creates transaction log entry with:
   - User ID
   - Amount earned
   - Source (`whackarat`)
   - Timestamp
   - Previous balance
   - New balance
5. Database transaction commits
6. Backend returns success response with updated player data

### Step 8: Frontend Confirmation

1. Frontend receives API response
2. Success message logged to console
3. Styled results popup displays:
   - Final score
   - Crypto earned breakdown
   - Code scrap notification (first time only)
   - "CONTINUE" button
4. Leaderboard refreshes with new scores
5. Game overlay closes when player clicks continue
6. Player returns to basement gameplay
7. UI crypto display updates automatically