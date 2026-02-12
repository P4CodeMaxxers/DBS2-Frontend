# DBS2 Game — N@tM Presentation Guide

> **Team Project**: DBS2 (Decentralized Banking Simulator 2)  
> **Presentation Date**: 02/12/2026  
> **Team Members**: Evan S, Maya D, Cyrus Z, West S, Aryan S.

---

## PRIMARY TEAM OVERVIEW (1 Minute)

### Opening Hook (10 seconds)
> "What if learning about cryptocurrency wasn't just reading articles — but actually *playing* through it?"

### Purpose & Scope (15 seconds)
DBS2 is an **educational crypto-themed RPG game** where players:
- Navigate a pixel-art basement environment
- Complete **5 unique minigames** that teach blockchain concepts
- Earn **real cryptocurrency tokens** (simulated multi-coin wallet)
- Collect **code scraps** to build "The Green Machine" — the ultimate goal

### The Superpower (15 seconds)
> **"Learn by Earning"** — Every game mechanic teaches a crypto concept:
> - Mining → Crypto Miner minigame → Earns Satoshis
> - Transaction validation → Laundry Game → Earns Cardano (ADA)
> - Security/scam detection → Whack-a-Rat → Earns Dogecoin
> - Blockchain verification → Ash Trail → Earns Solana
> - Authentication → Infinite User → Earns Ethereum

### Key Features (15 seconds)
- **Multi-coin wallet** with live price tracking (CoinGecko API)
- **Coin conversion system** (any-to-any with 5% fee)
- **Persistent leaderboard** tracking completions and earnings
- **Shop system** to purchase code scraps with earned crypto
- **JWT authentication** with cross-origin support

### Demo Path (5 seconds)
> "Let me show you the fastest path through our game..."

**Suggested Demo Flow:**
1. Login → Show wallet (0 balance)
2. Play Crypto Miner → Earn Satoshis → Show wallet update
3. Open Shop → Show code scrap available
4. Show Leaderboard → Point out completion icons

---

## 📸 SCREENSHOTS & TOOLS CHECKLIST

### For Live Demo
| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Browser DevTools (Network tab)** | Show API calls in real-time | During any game action |
| **Browser DevTools (Console)** | Show `[StatsManager]` logs | After minigame completion |
| **Postman** | Demo raw API endpoints | Backend logic section |
| **SQLite Viewer (VSCode)** | Show database records | Transactional data section |
| **Docker Desktop / `docker logs`** | Show backend container output | Deployment section |
| **Admin Panel (`/dbs2admin.html`)** | Modify player data live | CRUD demonstration |

### Screenshots to Prepare
- [ ] Game start screen (character in basement)
- [ ] Each minigame in action (5 screenshots)
- [ ] Wallet panel expanded (showing all coins)
- [ ] Conversion modal (any-to-any)
- [ ] Shop/Closet with code scraps
- [ ] Leaderboard with completion icons glowing
- [ ] Admin panel showing player data
- [ ] Postman collection with key endpoints
- [ ] Network tab showing successful API call
- [ ] Database table in SQLite viewer

---

## 👤 INDIVIDUAL PRESENTATIONS (1 Minute Each)

> **Instructions**: Each team member fills out ONE section below. Pick your strongest area.

---

### INDIVIDUAL 1: _______________ 
**Focus Area**: [ ] UI/UX  [ ] API  [ ] Deployment  [ ] Data  [ ] Debugging

#### What I'm Presenting
_Describe your specific contribution in 2-3 sentences:_
```
[FILL IN]
```

#### Live Demo Steps
1. [FILL IN - What will you show?]
2. [FILL IN - What tool will you use?]
3. [FILL IN - What's the expected outcome?]

#### Code Highlight
_Paste a key code snippet (10-15 lines max) that shows your work:_
```javascript
// [FILL IN]
```

#### Screenshot/Visual
_Describe or attach the visual you'll show:_
```
[FILL IN - e.g., "Network tab showing POST to /api/dbs2/minigames returning 200"]
```

#### Happy Moment 🎉
_What was your eureka moment?_
```
[FILL IN]
```

---

### INDIVIDUAL 2: _______________
**Focus Area**: [ ] UI/UX  [ ] API  [ ] Deployment  [ ] Data  [ ] Debugging

#### What I'm Presenting
_Describe your specific contribution in 2-3 sentences:_
```
[FILL IN]
```

#### Live Demo Steps
1. [FILL IN]
2. [FILL IN]
3. [FILL IN]

#### Code Highlight
```javascript
// [FILL IN]
```

#### Screenshot/Visual
```
[FILL IN]
```

#### Happy Moment 🎉
```
[FILL IN]
```

---

### INDIVIDUAL 3: _______________
**Focus Area**: [ ] UI/UX  [ ] API  [ ] Deployment  [ ] Data  [ ] Debugging

#### What I'm Presenting
_Describe your specific contribution in 2-3 sentences:_
```
[FILL IN]
```

#### Live Demo Steps
1. [FILL IN]
2. [FILL IN]
3. [FILL IN]

#### Code Highlight
```javascript
// [FILL IN]
```

#### Screenshot/Visual
```
[FILL IN]
```

#### Happy Moment 🎉
```
[FILL IN]
```

---

### INDIVIDUAL 4: _______________
**Focus Area**: [ ] UI/UX  [ ] API  [ ] Deployment  [ ] Data  [ ] Debugging

#### What I'm Presenting
_Describe your specific contribution in 2-3 sentences:_
```
[FILL IN]
```

#### Live Demo Steps
1. [FILL IN]
2. [FILL IN]
3. [FILL IN]

#### Code Highlight
```javascript
// [FILL IN]
```

#### Screenshot/Visual
```
[FILL IN]
```

#### Happy Moment 🎉
```
[FILL IN]
```

---

### INDIVIDUAL 5: _______________
**Focus Area**: [ ] UI/UX  [ ] API  [ ] Deployment  [ ] Data  [ ] Debugging

#### What I'm Presenting
_Describe your specific contribution in 2-3 sentences:_
```
[FILL IN]
```

#### Live Demo Steps
1. [FILL IN]
2. [FILL IN]
3. [FILL IN]

#### Code Highlight
```javascript
// [FILL IN]
```

#### Screenshot/Visual
```
[FILL IN]
```

#### Happy Moment 🎉
```
[FILL IN]
```

---

## 🔧 PRESENTATION TOPIC IDEAS BY CATEGORY

### UI/UX Walkthrough
- **Wallet Display**: Show coin icons, live prices, 24h change indicators, conversion modal
- **Leaderboard**: Tabs (Satoshis/Games/Ash Trail), green glow on completed games
- **Shop/Closet**: Code scrap cards, ownership status, purchase flow
- **Minigame UI**: Any of the 5 games — controls, feedback, reward animation

### API / Backend Logic
**Postman Endpoints to Demo:**
```
GET  /api/dbs2/player          → Player data with wallet, scraps, completions
PUT  /api/dbs2/minigames       → Mark minigame complete
POST /api/dbs2/minigame/reward → Award coins to wallet
POST /api/dbs2/wallet/convert  → Any-to-any coin conversion
POST /api/dbs2/shop/purchase   → Buy code scrap
GET  /api/dbs2/leaderboard     → Ranked players by crypto
GET  /api/dbs2/prices          → Live coin prices from CoinGecko
```

**Show in DevTools:**
- Network tab → Filter by `dbs2` → Show request/response
- Console → Filter by `[StatsManager]` → Show completion logs

### Deployment & Data Flow
```
┌─────────────────┐     HTTPS      ┌─────────────────┐     SQLite     ┌─────────────┐
│  GitHub Pages   │ ──────────────▶│  AWS/Docker     │ ──────────────▶│  Database   │
│  (Frontend)     │   + JWT Auth   │  (Flask API)    │   ORM Queries  │  (.db file) │
└─────────────────┘                └─────────────────┘                └─────────────┘
     p4codemaxxers.github.io         dbs2.opencodingsociety.com          dbs2_players
```

**Docker Commands to Show:**
```bash
docker logs <container_id> --tail 50    # Recent API requests
docker exec -it <container> bash        # Enter container
sqlite3 instance/volumes/user_data.db   # Query database directly
```

### Transactional Data (CRUD)
**Scenario**: Complete a minigame and watch the data change

| Step | Action | Where to Show |
|------|--------|---------------|
| 1 | Open Admin Panel | `dbs2admin.html` — find your player |
| 2 | Note: `completed_crypto_miner: false` | Admin toggle is OFF |
| 3 | Play Crypto Miner in game | Game window |
| 4 | Refresh Admin Panel | Toggle now ON, crypto increased |
| 5 | (Optional) Show in SQLite | `SELECT * FROM dbs2_players WHERE user_id = X` |

### Bulk Data / Database Reset
**Scripts to Show:**
```bash
# Destroy and rebuild database
cd backend
rm instance/volumes/user_data.db
python scripts/db_init.py

# What db_init.py does:
# - Creates all tables (users, dbs2_players, ashtrail_runs)
# - Seeds initial data if configured
# - Runs migrations for new columns (scrap_* fields)
```

**Live Demo**: Delete DB → Run init → Show empty leaderboard → Create account → Play game → Show data populated

### Debugging Session
**Scenario**: "Why isn't my minigame completion saving?"

1. **Frontend**: Add `console.log` in `completeMinigame()` — is it called?
2. **Network Tab**: Is the PUT request sent? What's the response?
3. **Backend Logs**: `docker logs` — is the endpoint hit? Any errors?
4. **Database**: Is `_completed_X` field actually updated?

**Code to Highlight:**
```javascript
// StatsManager.js - completeMinigame()
export async function completeMinigame(minigameName) {
    try {
        const response = await fetch(`${pythonURI}/api/dbs2/minigames`, {
            method: 'PUT',
            headers: getHeaders(),  // ← Auth token here
            credentials: 'include',
            body: JSON.stringify({ [minigameName]: true })
        });
        if (response.ok) {
            const result = await response.json();
            console.log('[StatsManager] Minigame completed on backend:', minigameName, result);
            return result.minigames_completed || {};
        }
        console.warn('[StatsManager] completeMinigame response:', response.status);
    } catch (e) {
        console.log('API completeMinigame failed, using local:', e);
    }
    // ... local fallback
}
```

### Feature Lifecycle Example
**Feature**: Any-to-Any Coin Conversion

| Stage | Evidence |
|-------|----------|
| **Origin** | User feedback: "I can only convert to satoshis, not other coins" |
| **Issue Created** | GitHub Issue #XX or team discussion |
| **Early Implementation** | `convertToSats()` function — hardcoded target |
| **Iteration** | Added target dropdown, renamed to `convertCoins()` |
| **Polished** | Full modal with preview, fee display, error handling |
| **Completion** | PR merged, tested on deployed site |

---

## ✅ PRE-PRESENTATION CHECKLIST

### Technical Setup
- [ ] Backend running (localhost:8403 or deployed)
- [ ] Frontend running (localhost:4600 or GitHub Pages)
- [ ] Logged in as test user with some data
- [ ] Admin panel open in separate tab
- [ ] Postman collection loaded
- [ ] DevTools open (Network + Console)
- [ ] SQLite viewer ready (if showing database)

### Backup Plans
- [ ] Screenshots saved locally (in case live demo fails)
- [ ] Screen recording of full demo flow
- [ ] Offline copy of code snippets to show

### Timing Practice
- [ ] Team overview rehearsed (under 1 minute)
- [ ] Each individual section rehearsed (under 1 minute)
- [ ] Transition phrases prepared between sections

---

## TEAM HAPPY MOMENTS

_Fill in 2-3 breakthrough moments your team experienced:_

1. **[FILL IN]** — _e.g., "When the leaderboard finally updated after fixing StatsManager to call the backend directly instead of the nonexistent DBS2API methods"_

2. **[FILL IN]** — _e.g., "Realizing our JWT auth wasn't working cross-origin and implementing the Authorization header solution"_

3. **[FILL IN]** — _e.g., "The moment all 5 minigames connected to different coins and the wallet showed real balances"_

---

## QUICK REFERENCE: KEY FILES

| File | Purpose |
|------|---------|
| `StatsManager.js` | Central API bridge — all backend calls |
| `dbs2_api.py` | Flask backend — all endpoints |
| `dbs2_player.py` | SQLAlchemy model — database schema |
| `Inventory.js` | Wallet UI + conversion |
| `Leaderboard.js` | Leaderboard tabs + game icons |
| `config.js` | API URL + auth token handling |
| `WalletDisplay.js` | Floating wallet + conversion modal |
| `ClosetShop.js` (DBS2API.js) | Shop UI for code scraps |

---
