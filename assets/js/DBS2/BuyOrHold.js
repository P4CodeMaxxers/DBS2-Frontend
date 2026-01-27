// Buy or Hold? - Crypto Trading Minigame for DBS2
// Self-contained minigame that creates its own UI overlay

const BuyOrHoldGame = (function() {
  'use strict';

  // Configuration
  const CONFIG = {
    STARTING_CASH: 100,
    STARTING_PRICE: 10,
    TRADE_FEE: 2,
    TOTAL_TICKS: 7
  };

  // Game state
  let gameState = {
    cash: CONFIG.STARTING_CASH,
    price: CONFIG.STARTING_PRICE,
    coins: 0,
    tick: 0,
    priceHistory: [CONFIG.STARTING_PRICE],
    trades: 0,
    isPlaying: false,
    container: null
  };

  // Headlines database
  const headlines = [
    { text: "🚀 Influencer tweeted!", type: "pump" },
    { text: "🐳 Whale dumped 1000 coins!", type: "dump" },
    { text: "⚡ Network fees spiking!", type: "neutral" },
    { text: "📈 Bulls taking control!", type: "pump" },
    { text: "📉 Bears entering market!", type: "dump" },
    { text: "🔥 FOMO intensifies!", type: "pump" },
    { text: "❄️ Market cooling down", type: "neutral" },
    { text: "💎 Diamond hands forming!", type: "pump" },
    { text: "🧻 Paper hands detected!", type: "dump" },
    { text: "⚠️ Regulatory concerns!", type: "dump" },
    { text: "🌙 To the moon!", type: "pump" },
    { text: "💀 Rug pull rumors!", type: "dump" }
  ];

  // CSS for the minigame
  const styles = `
    #buyOrHoldContainer {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 14, 39, 0.98);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'Courier New', monospace;
      color: #00ff41;
    }

    #buyOrHoldContainer::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 255, 65, 0.03) 0px,
        transparent 1px,
        transparent 2px,
        rgba(0, 255, 65, 0.03) 3px
      );
      pointer-events: none;
      animation: scan 8s linear infinite;
    }

    @keyframes scan {
      0% { transform: translateY(0); }
      100% { transform: translateY(100px); }
    }

    .boh-modal {
      background: rgba(10, 14, 39, 0.95);
      border: 2px solid #00ff41;
      box-shadow: 0 0 30px rgba(0, 255, 65, 0.3);
      max-width: 500px;
      width: 90%;
      padding: 2rem;
      position: relative;
      z-index: 1;
    }

    .boh-modal::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #00ff41, #00ccff, #ff00ff, #00ff41);
      z-index: -1;
      filter: blur(10px);
      opacity: 0.3;
      animation: glow 3s ease-in-out infinite;
    }

    @keyframes glow {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }

    .boh-title {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      text-shadow: 0 0 10px #00ff41;
      letter-spacing: 3px;
      text-align: center;
    }

    .boh-subtitle {
      font-size: 0.9rem;
      color: #00ccff;
      margin-bottom: 2rem;
      text-shadow: 0 0 5px #00ccff;
      text-align: center;
    }

    .boh-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .boh-stat {
      background: rgba(0, 255, 65, 0.1);
      padding: 1rem;
      border: 1px solid #00ff41;
      text-align: center;
    }

    .boh-stat-label {
      font-size: 0.7rem;
      color: #00ccff;
      margin-bottom: 0.3rem;
    }

    .boh-stat-value {
      font-size: 1.3rem;
      font-weight: bold;
    }

    .boh-price-change {
      font-size: 0.8rem;
      margin-top: 0.2rem;
    }

    .boh-up { color: #00ff41; }
    .boh-down { color: #ff0055; }

    .boh-chart {
      height: 100px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid #00ff41;
      margin-bottom: 1.5rem;
      position: relative;
    }

    .boh-news {
      background: rgba(0, 204, 255, 0.1);
      border: 1px solid #00ccff;
      padding: 1rem;
      margin-bottom: 1.5rem;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      animation: pulse 0.5s ease-in-out;
      text-align: center;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .boh-controls {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .boh-btn {
      padding: 1rem 2rem;
      font-family: 'Courier New', monospace;
      font-size: 1rem;
      font-weight: bold;
      border: 2px solid;
      background: rgba(0, 0, 0, 0.7);
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .boh-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .boh-buy {
      border-color: #00ff41;
      color: #00ff41;
    }

    .boh-buy:hover:not(:disabled) {
      background: rgba(0, 255, 65, 0.2);
      box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
    }

    .boh-sell {
      border-color: #ff0055;
      color: #ff0055;
    }

    .boh-sell:hover:not(:disabled) {
      background: rgba(255, 0, 85, 0.2);
      box-shadow: 0 0 20px rgba(255, 0, 85, 0.5);
    }

    .boh-hold {
      border-color: #ffaa00;
      color: #ffaa00;
    }

    .boh-hold:hover:not(:disabled) {
      background: rgba(255, 170, 0, 0.2);
      box-shadow: 0 0 20px rgba(255, 170, 0, 0.5);
    }

    .boh-start {
      border-color: #00ccff;
      color: #00ccff;
      padding: 1.5rem 3rem;
      font-size: 1.2rem;
    }

    .boh-start:hover {
      background: rgba(0, 204, 255, 0.2);
      box-shadow: 0 0 20px rgba(0, 204, 255, 0.5);
    }

    .boh-close {
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      color: #ff0055;
      font-size: 24px;
      cursor: pointer;
      z-index: 10;
    }

    .boh-fee-warning {
      font-size: 0.8rem;
      color: #ffaa00;
      margin-top: 0.5rem;
      text-align: center;
    }

    .boh-result {
      margin-top: 2rem;
      padding: 1.5rem;
      border: 2px solid;
      font-size: 1.1rem;
      line-height: 1.6;
      animation: slideIn 0.5s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .boh-result.win {
      border-color: #00ff41;
      background: rgba(0, 255, 65, 0.1);
      color: #00ff41;
    }

    .boh-result.loss {
      border-color: #ff0055;
      background: rgba(255, 0, 85, 0.1);
      color: #ff0055;
    }

    .boh-hidden {
      display: none;
    }
  `;

  // Create HTML structure
  function createHTML() {
    return `
      <div class="boh-modal">
        <button class="boh-close" onclick="window.BuyOrHold.hide()">×</button>
        
        <div id="boh-start-screen">
          <h1 class="boh-title">BUY OR HOLD?</h1>
          <p class="boh-subtitle">// SURVIVE THE VOLATILITY //</p>
          <p style="margin-bottom: 2rem; line-height: 1.6; text-align: center;">
            You have $100. The coin is $10.<br>
            Buy. Sell. Hold.<br>
            Can you beat the market?
          </p>
          <div style="text-align: center;">
            <button class="boh-btn boh-start" onclick="window.BuyOrHold.start()">INITIALIZE</button>
          </div>
        </div>

        <div id="boh-game-screen" class="boh-hidden">
          <h1 class="boh-title">BUY OR HOLD?</h1>
          <p class="boh-subtitle">// SURVIVE THE VOLATILITY //</p>
          
          <div class="boh-stats">
            <div class="boh-stat">
              <div class="boh-stat-label">CASH</div>
              <div class="boh-stat-value">$<span id="boh-cash">100</span></div>
            </div>
            <div class="boh-stat">
              <div class="boh-stat-label">COIN PRICE</div>
              <div class="boh-stat-value">$<span id="boh-price">10</span></div>
              <div class="boh-price-change" id="boh-price-change"></div>
            </div>
            <div class="boh-stat">
              <div class="boh-stat-label">HOLDINGS</div>
              <div class="boh-stat-value"><span id="boh-coins">0</span></div>
            </div>
          </div>

          <div class="boh-chart">
            <canvas id="boh-chart"></canvas>
          </div>

          <div class="boh-news" id="boh-news">
            Waiting for market data...
          </div>

          <div class="boh-controls">
            <button class="boh-btn boh-buy" id="boh-buy" onclick="window.BuyOrHold.buy()">BUY</button>
            <button class="boh-btn boh-hold" onclick="window.BuyOrHold.hold()">HOLD</button>
            <button class="boh-btn boh-sell" id="boh-sell" onclick="window.BuyOrHold.sell()">SELL</button>
          </div>

          <div class="boh-fee-warning">
            ⚠️ Trading fee: $2 per transaction
          </div>
        </div>

        <div id="boh-result-screen" class="boh-hidden">
          <h1 class="boh-title">BUY OR HOLD?</h1>
          <p class="boh-subtitle">// GAME OVER //</p>
          <div class="boh-result" id="boh-result"></div>
          <div style="text-align: center;">
            <button class="boh-btn boh-start" onclick="window.BuyOrHold.restart()" style="margin-top: 1.5rem;">RESTART</button>
          </div>
        </div>
      </div>
    `;
  }

  // Initialize and show the minigame
  function show() {
    if (gameState.container) return; // Already showing

    // Inject styles
    if (!document.getElementById('boh-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'boh-styles';
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }

    // Create container
    const container = document.createElement('div');
    container.id = 'buyOrHoldContainer';
    container.innerHTML = createHTML();
    document.body.appendChild(container);
    gameState.container = container;

    resetGameState();
  }

  // Hide and cleanup
  function hide() {
    if (gameState.container) {
      gameState.container.remove();
      gameState.container = null;
    }
    gameState.isPlaying = false;
  }

  // Reset game state
  function resetGameState() {
    gameState.cash = CONFIG.STARTING_CASH;
    gameState.price = CONFIG.STARTING_PRICE;
    gameState.coins = 0;
    gameState.tick = 0;
    gameState.priceHistory = [CONFIG.STARTING_PRICE];
    gameState.trades = 0;
    gameState.isPlaying = false;
  }

  // Show specific screen
  function showScreen(screen) {
    const screens = ['start', 'game', 'result'];
    screens.forEach(s => {
      const el = document.getElementById(`boh-${s}-screen`);
      if (el) {
        el.classList.toggle('boh-hidden', s !== screen);
      }
    });
  }

  // Start game
  function start() {
    resetGameState();
    showScreen('game');
    gameState.isPlaying = true;
    nextTick();
  }

  // Next tick
  function nextTick() {
    if (!gameState.isPlaying) return;

    gameState.tick++;
    
    if (gameState.tick > CONFIG.TOTAL_TICKS) {
      endGame();
      return;
    }

    // Generate random price change
    const change = (Math.random() - 0.5) * 6;
    gameState.price = Math.max(1, gameState.price + change);
    gameState.priceHistory.push(gameState.price);

    // Show random headline
    const headline = headlines[Math.floor(Math.random() * headlines.length)];
    const newsEl = document.getElementById('boh-news');
    if (newsEl) newsEl.textContent = headline.text;

    updateDisplay();
    drawChart();
  }

  // Update display
  function updateDisplay() {
    const cashEl = document.getElementById('boh-cash');
    const priceEl = document.getElementById('boh-price');
    const coinsEl = document.getElementById('boh-coins');
    
    if (cashEl) cashEl.textContent = gameState.cash.toFixed(0);
    if (priceEl) priceEl.textContent = gameState.price.toFixed(2);
    if (coinsEl) coinsEl.textContent = gameState.coins;

    // Update price change
    const changeEl = document.getElementById('boh-price-change');
    if (changeEl && gameState.priceHistory.length > 1) {
      const prevPrice = gameState.priceHistory[gameState.priceHistory.length - 2];
      const change = gameState.price - prevPrice;
      const changePercent = (change / prevPrice * 100).toFixed(1);
      
      if (change > 0) {
        changeEl.textContent = `▲ +${changePercent}%`;
        changeEl.className = 'boh-price-change boh-up';
      } else if (change < 0) {
        changeEl.textContent = `▼ ${changePercent}%`;
        changeEl.className = 'boh-price-change boh-down';
      } else {
        changeEl.textContent = '—';
        changeEl.className = 'boh-price-change';
      }
    }

    // Update buttons
    const buyBtn = document.getElementById('boh-buy');
    const sellBtn = document.getElementById('boh-sell');
    
    if (buyBtn) {
      buyBtn.disabled = (gameState.cash < gameState.price + CONFIG.TRADE_FEE) || gameState.coins >= 1;
    }
    if (sellBtn) {
      sellBtn.disabled = gameState.coins === 0;
    }
  }

  // Draw chart
  function drawChart() {
    const canvas = document.getElementById('boh-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const padding = 10;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    const maxPrice = Math.max(...gameState.priceHistory);
    const minPrice = Math.min(...gameState.priceHistory);
    const priceRange = maxPrice - minPrice || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff41';
    ctx.beginPath();

    gameState.priceHistory.forEach((p, i) => {
      const x = padding + (width / CONFIG.TOTAL_TICKS) * i;
      const y = padding + height - ((p - minPrice) / priceRange) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    gameState.priceHistory.forEach((p, i) => {
      const x = padding + (width / CONFIG.TOTAL_TICKS) * i;
      const y = padding + height - ((p - minPrice) / priceRange) * height;
      
      ctx.fillStyle = '#00ff41';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Player actions
  function buy() {
    if (!gameState.isPlaying) return;
    
    if (gameState.cash >= gameState.price + CONFIG.TRADE_FEE && gameState.coins < 1) {
      gameState.cash -= (gameState.price + CONFIG.TRADE_FEE);
      gameState.coins = 1;
      gameState.trades++;
      setTimeout(nextTick, 500);
    }
  }

  function sell() {
    if (!gameState.isPlaying) return;
    
    if (gameState.coins > 0) {
      gameState.cash += (gameState.price - CONFIG.TRADE_FEE);
      gameState.coins = 0;
      gameState.trades++;
      setTimeout(nextTick, 500);
    }
  }

  function hold() {
    if (!gameState.isPlaying) return;
    setTimeout(nextTick, 500);
  }

  // End game
  function endGame() {
    gameState.isPlaying = false;
    showScreen('result');

    const finalValue = gameState.cash + (gameState.coins * gameState.price);
    const profit = finalValue - CONFIG.STARTING_CASH;
    const profitPercent = ((profit / CONFIG.STARTING_CASH) * 100).toFixed(1);

    const resultEl = document.getElementById('boh-result');
    if (!resultEl) return;

    resultEl.className = 'boh-result ' + (profit >= 0 ? 'win' : 'loss');

    let message = `<strong>FINAL VALUE: $${finalValue.toFixed(2)}</strong><br><br>`;
    
    if (profit > 0) {
      message += `Profit: +$${profit.toFixed(2)} (+${profitPercent}%)<br><br>`;
    } else {
      message += `Loss: $${profit.toFixed(2)} (${profitPercent}%)<br><br>`;
    }

    if (gameState.trades === 0) {
      message += "You never traded. Sometimes the best move is no move.";
    } else if (gameState.trades > 4) {
      message += `You traded ${gameState.trades} times and paid $${gameState.trades * CONFIG.TRADE_FEE} in fees. Overtrading killed your gains.`;
    } else if (profit > 20) {
      message += "You timed it perfectly. Diamond hands.";
    } else if (profit > 0) {
      message += "You made it out alive. Not bad.";
    } else if (profit < -30) {
      message += "Rekt. The market is unforgiving.";
    } else {
      message += "You lost, but you learned. Try again.";
    }

    resultEl.innerHTML = message;
  }

  // Restart
  function restart() {
    showScreen('start');
  }

  // Public API
  return {
    show: show,
    hide: hide,
    start: start,
    buy: buy,
    sell: sell,
    hold: hold,
    restart: restart
  };
})();

// Make globally accessible
if (typeof window !== 'undefined') {
  window.BuyOrHold = BuyOrHoldGame;
}

// Also support module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BuyOrHoldGame;
}