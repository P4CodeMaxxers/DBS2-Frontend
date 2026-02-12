# DBS2: Decentralized Banking Simulator 2
## Skill C — N@tM Presentation

> **Team**: Evan, Maya, West, Cyrus, Aryan  
> **Period**: _____ | **Date**: _______________

---

# 🎯 PRIMARY TEAM OVERVIEW (1 Minute)

## Purpose & Scope
DBS2 is an **educational crypto-themed platformer** where players learn blockchain concepts by playing minigames and earning simulated cryptocurrency.

## The Superpower: "Learn by Earning"
Every gameplay mechanic teaches a real crypto concept:

| Minigame | Concept Taught | Currency Earned |
|----------|----------------|-----------------|
| Crypto Miner | Proof-of-Work | Satoshis |
| Infinite User | Wallet Security | Ethereum |
| Ash Trail | AMM Routing | Solana |
| Laundry Game | Transactions | Cardano |
| Border Control | Scam Detection | Dogecoin |

## Key Features & Goals
- **Multi-coin wallet** with live price tracking
- **Any-to-any conversion** between cryptocurrencies
- **Shop system** requiring different coins (forces diverse gameplay)
- **Persistent leaderboard** synced to backend
- **Character customization** with purchasable skins

## Optimal Demo Path
```
Login → Play Crypto Miner → Earn SATS → Check Wallet → 
Open Shop → View Code Scraps → Check Leaderboard → 
Convert Coins → Purchase Item
```

---

# 👤 INDIVIDUAL PRESENTATIONS

---

# 1️⃣ EVAN — Crypto Miner

## User Experience
Players interact with a mining terminal, pressing SPACE to generate hashes. Valid hashes (starting with "00") fill a progress bar. Complete 3 blocks with increasing difficulty to win.

## Superpower
**Why it matters:** Proof-of-Work is how Bitcoin secures $1+ trillion in value  
**What it does:** Simulates the hash-guessing process miners perform  
**How it works:** Random hash generation with prefix matching

## How It Was Made

### API — Backend Integration
```javascript
// On completion, two API calls fire:
await completeMinigame('crypto_miner');  
// PUT /api/dbs2/minigames { crypto_miner: true }

await rewardMinigame('crypto_miner', satoshiAmount);
// POST /api/dbs2/minigame/reward { minigame: 'crypto_miner', amount: 847 }
```

### Transactional Data — CRUD in Action
| Before Mining | After Mining |
|---------------|--------------|
| `completed_crypto_miner: false` | `completed_crypto_miner: true` |
| `satoshis: 0` | `satoshis: 847` |

### Code Logic
```javascript
function attemptMine() {
    const hash = generateHash();
    const isValid = hash.startsWith(targetPrefix); // "00", "000", "0000"
    
    if (isValid) {
        validHashes++;
        if (validHashes >= hashesPerBlock) {
            blocksCompleted++;
            targetPrefix += '0'; // Increase difficulty
        }
    }
}
```

## Feature Lifecycle
| Stage | Evidence |
|-------|----------|
| **Origin** | "We need a game that teaches mining" |
| **Early** | Simple spacebar counter, no visuals |
| **Iteration** | Added hash display, difficulty scaling |
| **Polished** | Live prices, boost multipliers, animations |

## Happy Moment 🎉
> "When the difficulty scaling clicked — watching players understand why Bitcoin mining gets harder over time, just from playing the game."

---

# 2️⃣ MAYA — Closet Shop & Characters

## User Experience
Players open a shop interface with tabs (Code Scraps / Characters / Cosmetics). Each item costs a different cryptocurrency. Purchased characters appear in a selector for equipping.

## Superpower
**Why it matters:** Forces players to earn ALL coin types, not just grind one  
**What it does:** Multi-currency marketplace with real pricing  
**How it works:** Backend validates balance, deducts coins, adds to inventory

## How It Was Made

### API — Purchase Flow
```javascript
// Frontend request
await purchaseShopItem('scrap_crypto_miner');
// POST /api/dbs2/shop/purchase { item_id: 'scrap_crypto_miner' }

// Backend response
{
    success: true,
    item: 'scrap_crypto_miner',
    wallet: { satoshis: 347, ethereum: 0.001, ... }
}
```

### Transactional Data — Purchase Record
| Field | Before | After |
|-------|--------|-------|
| `satoshis` | 847 | 347 |
| `scrap_crypto_miner` | false | true |
| `inventory` | [] | ['scrap_crypto_miner'] |

### Code Logic — Multi-Currency Pricing
```javascript
const SHOP_ITEMS = {
    scrap_crypto_miner: { price: { coin: 'satoshis', amount: 500 } },
    scrap_laundry:      { price: { coin: 'cardano', amount: 5 } },
    scrap_ash_trail:    { price: { coin: 'solana', amount: 0.05 } },
    character_pink:     { price: { coin: 'dogecoin', amount: 500 } }
};
```

## Feature Lifecycle
| Stage | Evidence |
|-------|----------|
| **Origin** | "Players need a reason to collect all coins" |
| **Early** | Single currency shop, basic list |
| **Iteration** | Multi-currency, tab navigation |
| **Polished** | Character selector, sprite switching, owned badges |

## Happy Moment 🎉
> "Buying Pink Princess with Dogecoin, opening Character Selector, equipping it, and seeing my avatar actually change in the game world."

---

# 3️⃣ WEST — Infinite User

## User Experience
Players see a cipher code (letters converted to numbers). They must decode and type the correct password. Success earns Ethereum; creating new passwords rotates the database.

## Superpower
**Why it matters:** Wallet security is #1 cause of crypto loss  
**What it does:** Teaches authentication and password concepts  
**How it works:** Cipher encoding + backend password rotation

## How It Was Made

### API — Password Endpoints
```javascript
// Fetch current passwords
GET /api/DBS2/passwords
→ { data: ["ishowgreen", "cryptoking", "basement", ...] }

// Rotate in new password
POST /api/DBS2/passwords/rotate
{ old: "basement", new: "mynewpass123" }
→ { data: ["ishowgreen", "cryptoking", "mynewpass123", ...] }
```

### Transactional Data — Password Rotation
| Before | After |
|--------|-------|
| `["pass1", "pass2", "pass3", "pass4", "pass5"]` | `["pass1", "pass2", "pass3", "pass4", "newpass"]` |

### Code Logic — The Cipher
```javascript
function convertToAlphaNumeric(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
        result += str.charCodeAt(i) - 96; // a=1, b=2, c=3
        result += "/";
    }
    return result;
}
// "hello" → "8/5/12/12/15/"
```

## Feature Lifecycle
| Stage | Evidence |
|-------|----------|
| **Origin** | "Teach why strong passwords matter" |
| **Early** | Hardcoded password list, no backend |
| **Iteration** | Backend sync, rotation system |
| **Polished** | Content filter, educational hints, ETH rewards |

## Happy Moment 🎉
> "When passwords players created started appearing for other players — the game felt alive and shared."

---

# 4️⃣ CYRUS — Ash Trail

## User Experience
Players select a "book" (difficulty level), then use WASD to trace a glowing path. Accuracy determines score and Solana reward. Paths represent token swap routes.

## Superpower
**Why it matters:** AMM routing determines if you lose money to slippage  
**What it does:** Visualizes swap paths as traceable routes  
**How it works:** Mathematical curve generation + accuracy scoring

## How It Was Made

### API — Run Submission
```javascript
// Submit completed run with trace data
POST /api/dbs2/ash-trail/runs
{
    book_id: "defi_grimoire",
    score: 87,
    trace: [[12.5, 8.2], [12.7, 8.4], ...] // Player's path
}

// Fetch leaderboard runs
GET /api/dbs2/ash-trail/runs?book_id=defi_grimoire&limit=10
```

### Transactional Data — Run Storage
| Field | Value |
|-------|-------|
| `book_id` | "defi_grimoire" |
| `score` | 87 |
| `solana_earned` | 0.043 |
| `trace_points` | 847 |
| `timestamp` | 2025-02-11T... |

### Code Logic — Path Generation
```javascript
// Easy: Sine wave (Direct Swap)
function buildWavePath() {
    for (let i = 0; i <= 72; i++) {
        const t = i / 72;
        pts.push({
            x: minX + (maxX - minX) * t,
            y: midY + Math.sin(t * Math.PI * 2) * amplitude
        });
    }
}

// Hard: Heart curve (Multi-Pool)
function buildHeartPath() {
    const xh = 16 * Math.pow(Math.sin(t), 3);
    const yh = 13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t);
}
```

## Feature Lifecycle
| Stage | Evidence |
|-------|----------|
| **Origin** | "Visualize how DEX routing works" |
| **Early** | Static path, click-based movement |
| **Iteration** | WASD controls, multiple difficulties |
| **Polished** | Parametric curves, trace recording, replay system |

## Happy Moment 🎉
> "The heart-shaped path for hard mode — it's mathematically beautiful AND teaches complex routing concepts."

---

# 5️⃣ ARYAN — Crypto Border Control

## User Experience
Terms float on screen with a yellow-highlighted selection. Press SPACE for legitimate crypto terms, BACKSPACE for scams. One wrong answer = game over. 30-second timer.

## Superpower
**Why it matters:** Crypto scams cost billions annually; education prevents loss  
**What it does:** Rapid-fire identification of real vs fake crypto concepts  
**How it works:** Curated term database with educational hints

## How It Was Made

### API — Score Submission
```javascript
// On game complete
await completeMinigame('whackarat'); // Legacy backend name
// PUT /api/dbs2/minigames { whackarat: true }

await rewardMinigame('whackarat', dogeAmount);
// POST /api/dbs2/minigame/reward { minigame: 'whackarat', amount: 15 }
```

### Transactional Data — Completion
| Field | Before | After |
|-------|--------|-------|
| `completed_whackarat` | false | true |
| `dogecoin` | 0 | 15 |

### Code Logic — Term Database
```javascript
const legitTerms = [
    { term: 'Blockchain', hint: 'Distributed ledger technology' },
    { term: 'Cold Wallet', hint: 'Offline storage for crypto' },
    { term: 'DeFi', hint: 'Decentralized Finance applications' }
];

const scamTerms = [
    { term: 'Guaranteed Returns', hint: 'NO investment is guaranteed!' },
    { term: 'Rug Pull', hint: 'Devs abandon project with your money' },
    { term: 'Crypto Doubler', hint: '"Send 1 get 2" is ALWAYS fake' }
];
```

## Debugging Example
**Issue:** Game marked scams as correct  
**Debug Steps:**
1. Console log showed `isScam` always false
2. Found: checking wrong array index
3. Fix: `scamTerms.some(s => s.term === selected.term)`

## Feature Lifecycle
| Stage | Evidence |
|-------|----------|
| **Origin** | "Teach scam detection through gameplay" |
| **Early** | Whack-a-mole with rats (too violent) |
| **Iteration** | Pivoted to term identification |
| **Polished** | Hints, animations, educational intro screen |

## Happy Moment 🎉
> "When testers recognized 'Celebrity Giveaway' from real scams they'd seen — the education was actually working."

---

# 🔧 TECHNICAL DEEP DIVE

## Deployment Architecture
```
┌──────────────────┐      HTTPS + JWT       ┌──────────────────┐
│  GitHub Pages    │ ◄────────────────────► │  AWS Docker      │
│  (Static Site)   │                        │  (Flask API)     │
│                  │  Authorization: Bearer │                  │
│  /index.html     │  credentials: include  │  /api/dbs2/*     │
└──────────────────┘                        └────────┬─────────┘
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │  SQLite + ORM    │
                                            │  dbs2_players    │
                                            │  ashtrail_runs   │
                                            └──────────────────┘
```

## Bulk Data — Database Reset
```bash
# Destroy and rebuild
rm instance/volumes/user_data.db
python scripts/db_init.py

# db_init.py creates:
# - User accounts table
# - DBS2 player data (wallet, completions, inventory)
# - Ash Trail runs table
```

## StatsManager.js — Central API Bridge
Every game action flows through one file:
```javascript
// All API calls use consistent auth
import { pythonURI, getHeaders } from '../api/config.js';

export async function completeMinigame(name) {
    return fetch(`${pythonURI}/api/dbs2/minigames`, {
        method: 'PUT',
        headers: getHeaders(), // JWT token
        credentials: 'include',
        body: JSON.stringify({ [name]: true })
    });
}
```

---

# 📊 SUMMARY

## What We Built
| Component | Tech | Purpose |
|-----------|------|---------|
| Frontend | JavaScript + HTML5 Canvas | Game UI & minigames |
| Backend | Flask + SQLAlchemy | API & data persistence |
| Auth | JWT in headers | Cross-origin authentication |
| Prices | CoinGecko API | Live crypto prices |
| Deploy | GitHub Pages + AWS | Static site + API server |

## Challenges → Solutions
| Challenge | Solution |
|-----------|----------|
| Cross-origin cookies blocked | JWT in Authorization header |
| Leaderboard not updating | Fixed StatsManager API calls |
| Only convert to satoshis | Added target coin dropdown |
| Characters not switching | localStorage + page reload |

## Team Happy Moments
1. **"The leaderboard finally updated"**
2. **"All 5 coins working"**
3. **"Admin panel Finally interacting with code scraps properly"**

---
