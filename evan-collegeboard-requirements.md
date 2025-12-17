---
title: "Evan Collegeboard Requirements"
layout: page
permalink: /evan-collegeboard-requirements/
---
# Discord Basement Simulator 2 — AP CSP Create Performance Task

**Student Contributions:** Crypto Miner Minigame, Backend API System, Player Data Management

This document maps my contributions to the **AP CSP Component A: Program Code Requirements**.

---

## Program Purpose and Function

Discord Basement Simulator 2 is a browser-based adventure game where players are trapped in a basement and must earn cryptocurrency or collect code fragments to escape. My primary contributions include:

1. **Crypto Miner Minigame** — A timing-based mining game with real Bitcoin price integration
2. **Backend API System** — RESTful Flask API for player data, scores, inventory, and leaderboards
3. **Player Data Model** — SQLAlchemy model for persistent player state

---

## Instructions for Input

The Crypto Miner minigame reads **keyboard and mouse input** to control mining operations.

### Keyboard Input: Starting the Mining Process

```javascript
// cryptoMinerMinigame.js
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !miningActive) {
        startMining();
    }
    if (e.key === 'Escape') {
        closeMiner();
    }
});
```

### Mouse Input: Clicking to Mine at the Right Moment

```javascript
// Player clicks the mine button when the indicator is in the target zone
mineButton.addEventListener('click', () => {
    if (!miningActive) return;
    
    const indicatorPos = getIndicatorPosition();
    const inTargetZone = indicatorPos >= targetStart && indicatorPos <= targetEnd;
    
    if (inTargetZone) {
        successfulMine();
    } else {
        failedMine();
    }
});
```

---

## Use of at Least One List (Collection Type)

### List #1: `miningHistory` — Tracks Mining Attempts

The program uses an array to store the history of mining attempts, enabling score calculation and performance tracking.

```javascript
// cryptoMinerMinigame.js
let miningHistory = [];  // Array of { success: boolean, timestamp: number, reward: number }

function recordMiningAttempt(success, reward) {
    miningHistory.push({
        success: success,
        timestamp: Date.now(),
        reward: reward
    });
}

// Calculate success rate from history
function getSuccessRate() {
    if (miningHistory.length === 0) return 0;
    const successes = miningHistory.filter(attempt => attempt.success).length;
    return (successes / miningHistory.length) * 100;
}
```

### List #2: Backend `inventory` — Player's Collected Items

The backend stores player inventory as a JSON array, managing code scraps and collectibles.

```python
# dbs2_player.py
class DBS2Player(db.Model):
    _inventory = db.Column(db.Text, default='[]')
    
    @property
    def inventory(self):
        try:
            return json.loads(self._inventory)
        except:
            return []
    
    def add_inventory_item(self, item):
        """Add item to inventory list"""
        inv = self.inventory
        inv.append(item)  # Append to list
        self._inventory = json.dumps(inv)
        db.session.commit()
        return inv
```

These lists manage complexity by:
- Allowing dynamic tracking of unlimited mining attempts without hardcoding
- Enabling inventory to grow/shrink without schema changes
- Supporting iteration for calculations (success rate, item searches)

---

## Student-Developed Procedure with Parameters

### Procedure: `calculate_boosted_reward(base_amount, btc_change_24h)`

This procedure calculates cryptocurrency rewards with a dynamic multiplier based on real Bitcoin market data.

```python
# dbs2_api.py
def calculate_boosted_reward(base_amount, btc_change_24h):
    """
    Calculate crypto reward with Bitcoin-based boost multiplier.
    
    Parameters:
        base_amount (int): Base crypto reward before boost
        btc_change_24h (float): Bitcoin's 24-hour price change percentage
    
    Returns:
        dict: Contains boosted_amount, multiplier, and message
    """
    # SEQUENCING: First, determine the boost multiplier from BTC change
    if btc_change_24h >= 5:
        multiplier = 1.5
        message = "Bitcoin is surging! 1.5x boost!"
    elif btc_change_24h >= 2:
        multiplier = 1.25
        message = "Bitcoin is up! 1.25x boost!"
    elif btc_change_24h >= 0:
        multiplier = 1.0
        message = "Bitcoin is stable."
    elif btc_change_24h >= -2:
        multiplier = 0.9
        message = "Bitcoin is down slightly. 0.9x penalty."
    else:
        multiplier = 0.75
        message = "Bitcoin is crashing! 0.75x penalty."
    
    # SEQUENCING: Then calculate the final boosted amount
    boosted_amount = int(base_amount * multiplier)
    
    return {
        'boosted_amount': boosted_amount,
        'multiplier': multiplier,
        'message': message,
        'base_amount': base_amount
    }
```

---

## Algorithm with Sequencing, Selection, and Iteration

### Algorithm: `update_score(game, score)` in Player Model

This algorithm updates a player's score for a specific minigame, implementing all three algorithmic components.

```python
# dbs2_player.py
def update_score(self, game, score):
    """
    Update player's score for a specific game.
    Keeps the higher score if one already exists.
    
    Contains: Sequencing, Selection, and Iteration
    """
    # SEQUENCING: First, retrieve current scores dictionary
    current_scores = self.scores  # Returns parsed JSON dict
    
    # SELECTION: Check if this game already has a score
    if game in current_scores:
        # SELECTION: Only update if new score is higher
        if score > current_scores[game]:
            current_scores[game] = score
            updated = True
        else:
            updated = False
    else:
        # First time playing this game
        current_scores[game] = score
        updated = True
    
    # SEQUENCING: Save updated scores back to database
    self._scores = json.dumps(current_scores)
    db.session.commit()
    
    # ITERATION: Calculate total score across all games
    total = 0
    for game_name, game_score in current_scores.items():
        total += game_score
    
    return {
        'game': game,
        'score': score,
        'updated': updated,
        'total_score': total
    }
```

### Detailed Breakdown:

| Component | Location in Code |
|-----------|------------------|
| **Sequencing** | Retrieve scores → Check/update → Save → Calculate total |
| **Selection** | `if game in current_scores` and `if score > current_scores[game]` |
| **Iteration** | `for game_name, game_score in current_scores.items()` |

---

## Calls to Student-Developed Procedure

### Call #1: Frontend Requests Boosted Crypto

The frontend calls the Bitcoin boost endpoint when awarding mining rewards:

```javascript
// DBS2API.js
async addCryptoWithBoost(baseAmount) {
    // Get current Bitcoin boost data
    const boostData = await this.getBitcoinBoost();
    const multiplier = boostData.boost_multiplier || 1.0;
    
    // Calculate boosted amount (calls the procedure logic)
    const boostedAmount = Math.round(baseAmount * multiplier);
    
    // Add the boosted crypto to player's balance
    const result = await this.addCrypto(boostedAmount);
    
    return {
        crypto: result.crypto,
        boosted_amount: boostedAmount,
        multiplier: multiplier,
        message: boostData.message
    };
}
```

### Call #2: Minigame Completion Triggers Score Update

When a player completes the crypto miner, the score is submitted:

```javascript
// cryptoMinerMinigame.js
async function completeMining() {
    const finalScore = calculateFinalScore();
    
    // Call the backend procedure to update score
    await DBS2API.submitScore('crypto_miner', finalScore);
    
    // Award crypto with Bitcoin boost
    const reward = await DBS2API.addCryptoWithBoost(baseReward);
    
    showCompletionScreen(reward);
}
```

---

## Instructions for Output

### Visual Output: Mining Interface with Dynamic Indicator

The crypto miner displays a visual timing bar that players must click at the right moment:

```javascript
// cryptoMinerMinigame.js
function renderMiningInterface() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="mining-bar">
            <div class="target-zone" style="left: ${targetStart}%; width: ${targetWidth}%"></div>
            <div class="indicator" id="mining-indicator"></div>
        </div>
        <div class="mining-stats">
            <span>Attempts: ${attempts}</span>
            <span>Successes: ${successes}</span>
            <span>Crypto Earned: ${cryptoEarned}</span>
        </div>
    `;
    
    // Animate the indicator
    animateIndicator();
}
```

### Text Output: Bitcoin Boost Message

The game displays real-time Bitcoin market data and boost information:

```javascript
// Show boost message to player
function displayBoostInfo(boostData) {
    const boostDisplay = document.getElementById('boost-display');
    boostDisplay.innerHTML = `
        <div class="btc-info">
            <span>BTC: $${boostData.btc_price_usd.toLocaleString()}</span>
            <span class="${boostData.btc_change_24h >= 0 ? 'positive' : 'negative'}">
                ${boostData.btc_change_24h >= 0 ? '+' : ''}${boostData.btc_change_24h.toFixed(2)}%
            </span>
        </div>
        <div class="boost-message">${boostData.message}</div>
        <div class="multiplier">Multiplier: ${boostData.multiplier}x</div>
    `;
}
```

---

## Online Data Stream: Bitcoin Price API Integration

The backend fetches **real-time Bitcoin price data** from an external API to calculate reward multipliers.

### Backend Endpoint: `/api/dbs2/bitcoin-boost`

```python
# dbs2_api.py
class _BitcoinBoostResource(Resource):
    def get(self):
        """Fetch real Bitcoin data and calculate boost multiplier"""
        try:
            # ONLINE DATA STREAM: Fetch from CoinGecko API
            response = requests.get(
                'https://api.coingecko.com/api/v3/simple/price',
                params={
                    'ids': 'bitcoin',
                    'vs_currencies': 'usd',
                    'include_24hr_change': 'true'
                },
                timeout=5
            )
            data = response.json()
            
            btc_price = data['bitcoin']['usd']
            btc_change = data['bitcoin']['usd_24h_change']
            
            # Calculate boost based on real market data
            boost_result = calculate_boosted_reward(100, btc_change)
            
            return {
                'btc_price_usd': btc_price,
                'btc_change_24h': round(btc_change, 2),
                'boost_multiplier': boost_result['multiplier'],
                'message': boost_result['message']
            }, 200
            
        except Exception as e:
            # Fallback if API is unavailable
            return {
                'btc_price_usd': 0,
                'btc_change_24h': 0,
                'boost_multiplier': 1.0,
                'message': 'Bitcoin data unavailable'
            }, 200
```

This demonstrates **online data stream** usage because:
- Data is fetched in real-time from an external API (CoinGecko)
- The response dynamically affects gameplay (reward multipliers)
- The UI updates based on the fetched data

---

## Data Persistence: Backend Database Storage

### Player Model with Full State Persistence

```python
# dbs2_player.py
class DBS2Player(db.Model):
    __tablename__ = 'dbs2_players'
    
    id = db.Column(db.Integer, primary_key=True)
    _uid = db.Column(db.String(255), unique=True, nullable=False)
    _crypto = db.Column(db.Integer, default=0)
    _inventory = db.Column(db.Text, default='[]')
    _scores = db.Column(db.Text, default='{}')
    _minigames_completed = db.Column(db.Text, default='{}')
    
    # Crypto management
    def add_crypto(self, amount):
        self._crypto += amount
        db.session.commit()
        return self._crypto
    
    # Minigame completion tracking
    def complete_minigame(self, game_name):
        completed = self.minigames_completed
        completed[game_name] = True
        self._minigames_completed = json.dumps(completed)
        db.session.commit()
        return completed
```

### RESTful API Endpoints

```python
# dbs2_api.py - Endpoints I developed

# Player data
api.add_resource(_PlayerResource, '/player')           # GET, PUT player info

# Crypto management  
api.add_resource(_CryptoResource, '/crypto')           # GET, PUT crypto balance

# Inventory system
api.add_resource(_InventoryResource, '/inventory')     # GET, POST, DELETE items

# Score tracking
api.add_resource(_ScoresResource, '/scores')           # GET, PUT game scores

# Minigame completion
api.add_resource(_MinigamesResource, '/minigames')     # GET, PUT completion status

# Leaderboard
api.add_resource(_LeaderboardResource, '/leaderboard') # GET ranked players

# Bitcoin boost
api.add_resource(_BitcoinBoostResource, '/bitcoin-boost') # GET real-time BTC data
```

---

## Summary of Contributions

| Requirement | My Implementation |
|-------------|-------------------|
| **Input** | Keyboard (Enter/Escape) and mouse clicks for mining timing |
| **List #1** | `miningHistory[]` — tracks attempts for success rate calculation |
| **List #2** | `inventory[]` — backend JSON array for player items |
| **Procedure** | `calculate_boosted_reward(base_amount, btc_change_24h)` |
| **Sequencing** | Determine multiplier → Calculate boost → Return result |
| **Selection** | Multiple `if/elif/else` for boost tiers based on BTC change |
| **Iteration** | Loop through scores to calculate totals; loop through history for rates |
| **Procedure Call** | `addCryptoWithBoost()` calls boost calculation on minigame completion |
| **Output** | Visual mining bar, text stats display, boost messages |
| **Data Stream** | Real-time Bitcoin price from CoinGecko API |
| **Persistence** | SQLAlchemy models storing crypto, inventory, scores, completion status |

---

## Technical Stack

- **Frontend:** Vanilla JavaScript, HTML5 Canvas, CSS3
- **Backend:** Python Flask, Flask-RESTful, SQLAlchemy
- **Database:** SQLite (development), PostgreSQL-compatible
- **External API:** CoinGecko Bitcoin Price API
- **Authentication:** JWT tokens with Flask decorators