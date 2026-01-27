import { addInventoryItem, rewardMinigame, isMinigameCompleted, completeMinigame, updateScore, getScores, submitAshTrailRun, getCoinPrice } from './StatsManager.js';
import { showRewardAnimation } from './WalletDisplay.js';

// Coin config for this minigame
const REWARD_COIN = 'solana';
const COIN_SYMBOL = 'SOL';
const COIN_COLOR = '#00ffa3';
const COIN_ICON = '◎';

// Logical grid that everything lives on (player + path).
const GRID_COLS = 24;
const GRID_ROWS = 24;

// Utility to append evenly spaced points along a segment
function pushSegmentPoints(pts, ax, ay, bx, by, steps) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({
      x: ax + (bx - ax) * t,
      y: ay + (by - ay) * t,
    });
  }
}

// Utility to build a smooth sine‐wave style path that fills the arena
function buildWavePath() {
  const pts = [];
  const marginX = 2;
  const minX = marginX;
  const maxX = GRID_COLS - marginX;
  const midY = GRID_ROWS * 0.5;
  const amp = GRID_ROWS * 0.3;
  const steps = 72;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = minX + (maxX - minX) * t;
    const y = midY + Math.sin(t * Math.PI * 2) * amp * 0.5;
    pts.push({ x, y });
  }
  return pts;
}

// Heart / petal‐like curve around the center
function buildHeartPath() {
  const pts = [];
  const cx = GRID_COLS / 2;
  const cy = GRID_ROWS * 0.55;
  const scale = GRID_ROWS * 0.30;
  const steps = 220;

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const xh = 16 * Math.pow(Math.sin(t), 3);
    const yh = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const x = cx + (xh / 18) * scale;
    const y = cy - (yh / 18) * scale;
    pts.push({ x, y });
  }

  const outerRadiusBase = GRID_ROWS * 0.40;
  const outerSteps = 120;
  for (let i = 0; i <= outerSteps; i++) {
    const t = (i / outerSteps) * Math.PI * 2;
    const angle = t;
    const radius = outerRadiusBase * (0.9 + 0.2 * Math.sin(3 * t));
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    pts.push({ x, y });
  }

  return pts;
}

// Cross / star corridor shape
function buildCrossPath() {
  const pts = [];
  const cx = GRID_COLS / 2;
  const cy = GRID_ROWS / 2;
  const arm = GRID_ROWS * 0.38;
  const stepsPerSeg = 18;

  const startY = GRID_ROWS - 2;
  pushSegmentPoints(pts, cx, startY, cx, cy + arm * 0.4, stepsPerSeg);
  pushSegmentPoints(pts, cx, cy + arm * 0.4, cx, cy - arm, stepsPerSeg);
  pushSegmentPoints(pts, cx, cy - arm, cx + arm, cy - arm * 0.1, stepsPerSeg);
  pushSegmentPoints(pts, cx + arm, cy - arm * 0.1, cx + arm * 0.2, cy + arm, stepsPerSeg);
  pushSegmentPoints(pts, cx + arm * 0.2, cy + arm, cx, cy + arm * 0.4, stepsPerSeg);
  pushSegmentPoints(pts, cx, cy + arm * 0.4, cx - arm * 0.2, cy + arm, stepsPerSeg);
  pushSegmentPoints(pts, cx - arm * 0.2, cy + arm, cx - arm, cy - arm * 0.1, stepsPerSeg);
  pushSegmentPoints(pts, cx - arm, cy - arm * 0.1, cx, cy - arm, stepsPerSeg);
  pushSegmentPoints(pts, cx, cy - arm, cx, startY, stepsPerSeg);

  return pts;
}

// Book + path data - Each represents a different AMM routing scenario
const BOOKS = [
  {
    id: "defi_grimoire",
    title: "Direct Swap Route",
    difficulty: 1,
    rating: "3/10",
    requiredScore: 60,
    description: "A simple direct swap through a single liquidity pool (SOL → USDC). Low slippage, straightforward execution. Perfect for beginners learning AMM basics.",
    path: buildWavePath(),
    routingExample: "SOL → USDC",
    poolType: "Single Pool",
  },
  {
    id: "lost_ledger",
    title: "Multi-Hop Routing",
    difficulty: 2,
    rating: "6/10",
    requiredScore: 60,
    description: "Optimized routing through multiple liquidity pools (SOL → USDC → ETH). Finding the optimal path minimizes slippage and maximizes your output tokens.",
    path: buildCrossPath(),
    routingExample: "SOL → USDC → ETH",
    poolType: "Two-Hop Route",
  },
  {
    id: "proof_of_burn",
    title: "Complex Multi-Pool Optimization",
    difficulty: 3,
    rating: "9.5/10",
    requiredScore: 60,
    description: "Advanced routing through multiple pools with varying liquidity (SOL → USDC → ETH → BTC). Requires understanding price impact, slippage, and optimal pathfinding.",
    path: buildHeartPath(),
    routingExample: "SOL → USDC → ETH → BTC",
    poolType: "Multi-Hop Optimization",
  },
];

// DOM helpers
function createEl(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  Object.assign(el, props);
  if (props.style && typeof props.style === 'object') {
    Object.assign(el.style, props.style);
  }
  for (const child of children) {
    if (typeof child === "string") el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  }
  return el;
}

// Core state
let overlay = null;
let container = null;
let canvas = null;
let ctx = null;

let currentBook = null;
let truePath = [];
let playerPath = [];
let playerPos = null;
let isRunPhase = false;
let isFirstCompletion = false;

// Coin price state
let boostMultiplier = 1.0;
let coinPrice = 0;
let coinChange = 0;
let lastReward = 0;

// Continuous movement state
let pressedDirs = { up: false, down: false, left: false, right: false };
let runAnimId = null;
let lastTimestamp = null;
let sampleAccumulator = 0;
let keyHandlerDown = null;
let keyHandlerUp = null;

// Overlay lifecycle
function openOverlay() {
  if (overlay) closeOverlay();

  overlay = createEl("div", {
    className: "ashtrail-overlay",
    style: {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "5000",
      backdropFilter: "blur(4px)",
    },
  });

  container = createEl("div", {
    className: "ashtrail-container",
    style: {
      width: "min(960px, 90vw)",
      height: "min(600px, 85vh)",
      background: "#111820",
      borderRadius: "16px",
      boxShadow: "0 18px 45px rgba(0,0,0,0.55)",
      border: `1px solid ${COIN_COLOR}44`,
      color: "#f3f4f6",
      display: "flex",
      flexDirection: "column",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: "hidden",
    },
  });

  const header = createHeader();
  const main = createEl("div", {
    className: "ashtrail-main",
    style: {
      flex: "1",
      display: "flex",
      padding: "12px 18px 18px",
      gap: "18px",
      boxSizing: "border-box",
    },
  });
  main.id = "ashtrail-main";

  container.appendChild(header);
  container.appendChild(main);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
}

function closeOverlay() {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
  overlay = null;
  container = null;
  canvas = null;
  ctx = null;
  truePath = [];
  playerPath = [];
  playerPos = null;
  isRunPhase = false;
  cleanupRunInput();
  window.ashTrailActive = false;
  window.minigameActive = false;
  
  try {
    if (window.Leaderboard && typeof window.Leaderboard.refresh === 'function') {
      window.Leaderboard.refresh();
    }
  } catch(e) {}
}

function createHeader() {
  const title = createEl("div", {
    textContent: `${COIN_ICON} Ash Trail Memory — AMM Routing Recovery`,
    style: {
      fontSize: "18px",
      fontWeight: "600",
      letterSpacing: "0.03em",
      color: COIN_COLOR,
    },
  });

  const subtitle = createEl("div", {
    textContent: "Trace optimal liquidity pool routes to recover the burned DeFi routing guides.",
    style: {
      fontSize: "12px",
      color: "#9ca3af",
      marginTop: "2px",
    },
  });

  const textWrap = createEl("div", {
    style: { display: "flex", flexDirection: "column" },
  }, [title, subtitle]);

  // Price info
  const priceInfo = createEl("div", {
    style: {
      display: "flex",
      gap: "15px",
      fontSize: "11px",
      background: `${COIN_COLOR}22`,
      padding: "6px 12px",
      borderRadius: "5px",
      border: `1px solid ${COIN_COLOR}44`,
    },
  });
  priceInfo.innerHTML = `
    <span style="color: #888;">Rewards: <span style="color: ${COIN_COLOR};">${COIN_SYMBOL}</span></span>
    <span style="color: #fff;">$${coinPrice.toFixed(2)}</span>
    <span style="color: ${coinChange >= 0 ? '#0f0' : '#f00'};">${coinChange >= 0 ? '+' : ''}${coinChange.toFixed(1)}%</span>
    <span style="color: ${boostMultiplier >= 1 ? '#0f0' : '#f00'};">${boostMultiplier.toFixed(2)}x</span>
  `;

  const closeBtn = createEl("button", {
    textContent: "✕",
    ariaLabel: "Close",
    style: {
      border: "none",
      background: "transparent",
      color: "#9ca3af",
      fontSize: "18px",
      cursor: "pointer",
      padding: "4px 8px",
      borderRadius: "999px",
    },
  });
  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.background = "rgba(148,163,184,0.15)";
    closeBtn.style.color = "#e5e7eb";
  });
  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.background = "transparent";
    closeBtn.style.color = "#9ca3af";
  });
  closeBtn.addEventListener("click", () => {
    closeOverlay();
  });

  const rightWrap = createEl("div", {
    style: { display: "flex", alignItems: "center", gap: "15px" },
  }, [priceInfo, closeBtn]);

  const header = createEl("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 18px 8px",
      borderBottom: "1px solid rgba(148,163,184,0.25)",
      background: `radial-gradient(circle at top left, ${COIN_COLOR}22, transparent 55%), #020617`,
    },
  }, [textWrap, rightWrap]);

  return header;
}

function setScene(contentEl) {
  const main = document.getElementById("ashtrail-main");
  if (!main) return;
  main.innerHTML = "";
  main.appendChild(contentEl);
}

// Scene 0: Intro
function renderIntroScene() {
  const left = createEl("div", {
    style: {
      flex: "1.2",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "12px 4px",
      gap: "12px",
    },
  });

  const introTitle = createEl("h2", {
    textContent: "IShowGreen's Burnt DeFi Routing Manual",
    style: {
      margin: "0",
      fontSize: "22px",
      fontWeight: "600",
    },
  });

  const introText = createEl("p", {
    textContent: "IShowGreen's liquidity pool routing guides burned in a candle accident. These pages contain critical knowledge about AMM routing, slippage optimization, and multi-hop swaps.",
    style: {
      margin: "4px 0 0",
      fontSize: "14px",
      lineHeight: "1.5",
      color: "#e5e7eb",
    },
  });

  const flavor = createEl("p", {
    textContent: "Each ash trail represents an optimal routing path through liquidity pools. Memorize the route, then trace it from memory. Master these paths and you'll understand how to minimize slippage and maximize your token swaps in DeFi.",
    style: {
      margin: "6px 0 0",
      fontSize: "13px",
      lineHeight: "1.5",
      color: "#9ca3af",
    },
  });

  const rewardInfo = createEl("div", {
    style: {
      padding: "10px",
      background: `${COIN_COLOR}22`,
      borderRadius: "8px",
      border: `1px solid ${COIN_COLOR}44`,
      marginTop: "10px",
    },
  });
  rewardInfo.innerHTML = `
    <div style="font-size: 15px; color: #888;">Earn <span style="color: ${COIN_COLOR}; font-weight: bold;">${COIN_SYMBOL}</span> (Solana) for successful runs!</div>
    <div style="font-size: 17px; color: #666; margin-top: 4px;">Rewards boosted by real market performance</div>
  `;

  const startBtn = createPrimaryButton("Start Ash Trail Challenge", () => {
    renderBookSelectScene();
  });

  left.appendChild(introTitle);
  left.appendChild(introText);
  left.appendChild(flavor);
  left.appendChild(rewardInfo);
  left.appendChild(startBtn);

  const right = createEl("div", {
    style: {
      flex: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  });

  const previewCanvasWrap = createCanvasPanel("Preview", "Follow glowing ash once, then from memory.");
  right.appendChild(previewCanvasWrap);

  const layout = createEl("div", {
    style: {
      display: "flex",
      gap: "18px",
      width: "100%",
      height: "100%",
    },
  }, [left, right]);

  setScene(layout);
}

function createPrimaryButton(label, onClick) {
  const btn = createEl("button", {
    textContent: label,
    style: {
      marginTop: "8px",
      alignSelf: "flex-start",
      padding: "8px 16px",
      borderRadius: "999px",
      border: "none",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      background: `linear-gradient(135deg, ${COIN_COLOR}, #00aa77)`,
      color: "#000",
      boxShadow: `0 8px 20px ${COIN_COLOR}55`,
    },
  });
  btn.addEventListener("mouseenter", () => {
    btn.style.filter = "brightness(1.1)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.filter = "none";
  });
  btn.addEventListener("click", onClick);
  return btn;
}

function createCanvasPanel(title, subtitle) {
  const wrapper = createEl("div", {
    style: {
      width: "100%",
      height: "100%",
      background: "#020617",
      borderRadius: "14px",
      border: "1px solid rgba(148,163,184,0.35)",
      display: "flex",
      flexDirection: "column",
      padding: "10px",
      boxSizing: "border-box",
      gap: "6px",
    },
  });

  const heading = createEl("div", {
    textContent: title,
    style: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#e5e7eb",
    },
  });

  const sub = createEl("div", {
    textContent: subtitle,
    style: { fontSize: "11px", color: "#9ca3af" },
  });

  canvas = createEl("canvas", {
    width: 460,
    height: 360,
    style: {
      flex: "1",
      borderRadius: "10px",
      background: "#020617",
      border: "1px solid rgba(55,65,81,0.8)",
    },
  });
  ctx = canvas.getContext("2d");

  wrapper.appendChild(heading);
  wrapper.appendChild(sub);
  wrapper.appendChild(canvas);

  return wrapper;
}

// Scene 1: Book selection
function renderBookSelectScene() {
  const sidebar = createEl("div", {
    style: {
      width: "260px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
  });

  const title = createEl("h2", {
    textContent: "Choose a Burnt Book",
    style: {
      margin: "0",
      fontSize: "18px",
    },
  });

  const subtitle = createEl("p", {
    textContent: "Each book represents a different AMM routing scenario. Start with simple direct swaps, then master multi-hop optimization. Your routing efficiency determines your slippage savings.",
    style: {
      margin: "4px 0 0",
      fontSize: "12px",
      color: "#9ca3af",
      lineHeight: "1.5",
    },
  });

  sidebar.appendChild(title);
  sidebar.appendChild(subtitle);

  const bookList = createEl("div", {
    style: {
      marginTop: "6px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      overflowY: "auto",
    },
  });

  let firstBook = null;
  let cachedScores = null;
  
  const getCachedScores = async () => {
    if (cachedScores) return cachedScores;
    try {
      cachedScores = await getScores();
    } catch (_) {
      cachedScores = {};
    }
    return cachedScores || {};
  };

  const statusTextFor = async (book) => {
    const scores = await getCachedScores();
    const key = `ash_trail_${book.id}`;
    const bestRaw = scores?.[key];
    const best = bestRaw === undefined || bestRaw === null ? null : Math.round(Number(bestRaw) || 0);
    const req = book.requiredScore ?? 60;
    const done = best !== null && best >= req;
    if (best === null) return { text: "⬜ Not completed", color: "#9ca3af" };
    return {
      text: `${done ? "✅" : "⬜"} Best: ${Math.max(0, Math.min(100, best))}% (need ${req}%)`,
      color: done ? "#86efac" : "#fca5a5",
    };
  };

  BOOKS.forEach((book, index) => {
    const ratingLabel = book.rating || "—/10";
    const card = createEl("button", {
      type: "button",
      style: {
        width: "100%",
        textAlign: "left",
        padding: "8px 10px",
        borderRadius: "10px",
        border: `1px solid ${COIN_COLOR}44`,
        background: "rgba(15,23,42,0.9)",
        color: "#e5e7eb",
        cursor: "pointer",
        fontSize: "13px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      },
    });

    const titleRow = createEl("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      },
    });
    const t = createEl("span", { textContent: book.title });
    const d = createEl("span", {
      textContent: ratingLabel,
      style: { fontSize: "13px" },
    });
    titleRow.appendChild(t);
    titleRow.appendChild(d);

    const status = createEl("span", {
      textContent: "Status: loading...",
      style: { fontSize: "11px", color: "#9ca3af" },
    });
    statusTextFor(book).then((s) => {
      status.textContent = s.text;
      status.style.color = s.color;
    });

    card.appendChild(titleRow);
    card.appendChild(status);

    card.addEventListener("click", () => {
      renderBookDetailScene(book);
    });

    if (index === 0) firstBook = book;

    bookList.appendChild(card);
  });

  sidebar.appendChild(bookList);

  const mainPanel = createEl("div", {
    style: {
      flex: "1",
      display: "flex",
    },
  });

  const layout = createEl("div", {
    style: {
      display: "flex",
      gap: "18px",
      width: "100%",
      height: "100%",
    },
  }, [sidebar, mainPanel]);

  setScene(layout);

  if (firstBook) {
    renderBookDetailScene(firstBook);
  }
}

function renderBookDetailScene(book) {
  currentBook = book;
  truePath = book.path;

  const main = document.getElementById("ashtrail-main");
  if (!main || !main.firstChild) return;

  const layout = main.firstChild;
  const mainPanel = layout.lastChild;
  mainPanel.innerHTML = "";

  const detail = createEl("div", {
    style: {
      flex: "1",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
  });

  const heading = createEl("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
  });

  const t = createEl("h3", {
    textContent: book.title,
    style: { margin: "0", fontSize: "18px" },
  });
  
  // Calculate potential reward
  const baseReward = 0.1 + (book.difficulty * 0.05);
  const estReward = (baseReward * boostMultiplier).toFixed(3);
  
  const meta = createEl("div", {
    style: { fontSize: "12px", color: "#9ca3af" },
  });
  meta.innerHTML = `Difficulty: ${book.rating || "—/10"} · Required: ${book.requiredScore}% · Route: <span style="color: ${COIN_COLOR};">${book.routingExample || "N/A"}</span> · Est. Reward: <span style="color: ${COIN_COLOR};">${estReward} ${COIN_SYMBOL}</span>`;
  
  const desc = createEl("p", {
    textContent: book.description,
    style: {
      fontSize: "13px",
      color: "#e5e7eb",
      lineHeight: "1.5",
      margin: "4px 0 0",
    },
  });

  const routingInfo = createEl("div", {
    style: {
      margin: "6px 0 0",
      padding: "8px",
      background: `${COIN_COLOR}15`,
      borderRadius: "6px",
      border: `1px solid ${COIN_COLOR}33`,
    },
  });
  routingInfo.innerHTML = `<div style="font-size: 11px; color: ${COIN_COLOR};">📊 ${book.poolType || "Routing Path"}</div><div style="font-size: 10px; color: #888; margin-top: 2px;">This route represents: ${book.routingExample || "Token swap path"}</div>`;

  heading.appendChild(t);
  heading.appendChild(meta);
  heading.appendChild(desc);
  heading.appendChild(routingInfo);

  const warn = createEl("p", {
    textContent: "You'll see the optimal routing path traced once. After that, the trail disappears and you must navigate it from memory. Your accuracy determines your slippage savings.",
    style: {
      fontSize: "12px",
      color: "#f97316",
      margin: "8px 0 0",
    },
  });

  const buttonsRow = createEl("div", {
    style: {
      display: "flex",
      gap: "8px",
      marginTop: "8px",
      alignItems: "center",
    },
  });

  const beginBtn = createPrimaryButton("Begin Memory Run", () => {
    renderPreviewScene();
  });

  const backBtn = createEl("button", {
    textContent: "Back to Shelf",
    style: {
      padding: "7px 14px",
      borderRadius: "999px",
      border: "1px solid rgba(148,163,184,0.8)",
      background: "transparent",
      color: "#e5e7eb",
      fontSize: "13px",
      cursor: "pointer",
    },
  });
  backBtn.addEventListener("mouseenter", () => {
    backBtn.style.background = "rgba(148,163,184,0.12)";
  });
  backBtn.addEventListener("mouseleave", () => {
    backBtn.style.background = "transparent";
  });
  backBtn.addEventListener("click", () => {
    renderBookSelectScene();
  });

  buttonsRow.appendChild(beginBtn);
  buttonsRow.appendChild(backBtn);

  const previewWrap = createCanvasPanel("Book Arena", "The ash trail will appear once, then vanish.");

  detail.appendChild(heading);
  detail.appendChild(warn);
  detail.appendChild(buttonsRow);
  detail.appendChild(previewWrap);

  mainPanel.appendChild(detail);
}

// Scene 2: Preview
function renderPreviewScene() {
  if (!currentBook) return;
  const layout = createEl("div", {
    style: {
      display: "flex",
      width: "100%",
      height: "100%",
      gap: "18px",
    },
  });

  const left = createEl("div", {
    style: {
      width: "260px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
  });

  const title = createEl("h2", {
    textContent: currentBook.title,
    style: { margin: "0", fontSize: "18px" },
  });

  const text = createEl("p", {
    textContent: `Watch closely. The optimal routing path (${currentBook.routingExample || "token swap route"}) will trace through the liquidity pools once. This represents the most efficient way to swap tokens while minimizing slippage. When the glow fades, navigate it from memory.`,
    style: {
      fontSize: "13px",
      color: "#e5e7eb",
      lineHeight: "1.5",
      margin: "6px 0 0",
    },
  });

  const hint = createEl("p", {
    textContent: "Tip: Each segment represents a hop through a liquidity pool. Memorize the sequence - in real DeFi, following the optimal route saves you tokens through reduced slippage. Use W/A/S/D or Arrow Keys to navigate.",
    style: {
      fontSize: "12px",
      color: "#9ca3af",
      margin: "4px 0 0",
    },
  });

  const controls = createEl("p", {
    textContent: "Controls in run phase: W/A/S/D or Arrow Keys · Enter to finish early.",
    style: {
      fontSize: "11px",
      color: "#9ca3af",
      margin: "10px 0 0",
      fontStyle: "italic",
    },
  });

  left.appendChild(title);
  left.appendChild(text);
  left.appendChild(hint);
  left.appendChild(controls);

  const right = createEl("div", {
    style: {
      flex: "1",
      display: "flex",
    },
  });
  const panel = createCanvasPanel("Ash Trail Preview", "Memorize this glowing path. It plays only once.");
  right.appendChild(panel);

  layout.appendChild(left);
  layout.appendChild(right);

  setScene(layout);

  drawBackground();
  playPathPreview(truePath, () => {
    const footer = createEl("div", {
      style: {
        position: "absolute",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "8px 14px",
        borderRadius: "999px",
        background: "rgba(15,23,42,0.92)",
        border: `1px solid ${COIN_COLOR}88`,
        fontSize: "12px",
        color: "#e5e7eb",
        display: "flex",
        gap: "10px",
        alignItems: "center",
      },
    });
    footer.textContent = "Ready? The trail is gone. Walk it from memory.";

    const btn = createPrimaryButton("Start Memory Run", () => {
      footer.remove();
      renderRunScene();
    });
    btn.style.marginTop = "0";
    footer.appendChild(btn);

    if (overlay) overlay.appendChild(footer);
  });
}

function drawBackground() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, "#020617");
  bgGrad.addColorStop(1, "#0b1120");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  for (let r = 40; r < Math.min(canvas.width, canvas.height) / 1.1; r += 40) {
    ctx.beginPath();
    ctx.strokeStyle = `${COIN_COLOR}40`;
    ctx.lineWidth = 1;
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function playPathPreview(path, onComplete) {
  if (!ctx || !canvas || !path || path.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  drawBackground();

  const cellW = canvas.width / GRID_COLS;
  const cellH = canvas.height / GRID_ROWS;
  let i = 0;

  const baseDelay = 70;
  const minDelay = 20;
  const delay = Math.max(minDelay, baseDelay - Math.min(80, (path.length - 80) * 0.3));

  const step = () => {
    if (!ctx) return;

    drawBackground();

    ctx.save();
    ctx.lineWidth = cellW * 0.55;
    ctx.lineCap = "round";
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `${COIN_COLOR}40`);
    gradient.addColorStop(0.5, COIN_COLOR);
    gradient.addColorStop(1, `${COIN_COLOR}40`);
    ctx.strokeStyle = gradient;

    ctx.beginPath();
    path.forEach((p, idx) => {
      if (idx > i) return;
      const cx = (p.x + 0.5) * cellW;
      const cy = (p.y + 0.5) * cellH;
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.restore();

    const head = path[i];
    if (head) {
      const hx = (head.x + 0.5) * cellW;
      const hy = (head.y + 0.5) * cellH;
      const radius = cellW * 0.32;
      const gradient = ctx.createRadialGradient(hx, hy, 1, hx, hy, radius);
      gradient.addColorStop(0, COIN_COLOR);
      gradient.addColorStop(0.4, `${COIN_COLOR}cc`);
      gradient.addColorStop(1, `${COIN_COLOR}00`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(hx, hy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    i++;
    if (i < path.length) {
      setTimeout(step, delay);
    } else {
      setTimeout(() => {
        drawBackground();
        if (onComplete) onComplete();
      }, 200);
    }
  };

  step();
}

// Scene 3: Run phase
function renderRunScene() {
  if (!currentBook) return;
  isRunPhase = true;
  playerPath = [];
  playerPos = { ...truePath[0] };
  pressedDirs = { up: false, down: false, left: false, right: false };
  lastTimestamp = null;
  sampleAccumulator = 0;

  const layout = createEl("div", {
    style: {
      display: "flex",
      width: "100%",
      height: "100%",
      gap: "18px",
    },
  });

  const sidebar = createEl("div", {
    style: {
      width: "260px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
  });

  const title = createEl("h2", {
    textContent: "Walk the Ash Trail",
    style: { margin: "0", fontSize: "18px" },
  });

  const desc = createEl("p", {
    textContent: `Use W/A/S/D or Arrow Keys to follow the optimal routing path (${currentBook?.routingExample || "token swap route"}). Ash particles will flicker when you're on the correct route - this represents finding the right liquidity pools. Your accuracy determines how much slippage you avoid.`,
    style: {
      fontSize: "13px",
      color: "#e5e7eb",
      lineHeight: "1.5",
      margin: "4px 0 0",
    },
  });

  const info = createEl("p", {
    textContent: "Press Enter at any time to finish your run and see IShowGreen's reaction.",
    style: {
      fontSize: "12px",
      color: "#9ca3af",
      margin: "6px 0 0",
    },
  });

  sidebar.appendChild(title);
  sidebar.appendChild(desc);
  sidebar.appendChild(info);

  const right = createEl("div", {
    style: {
      flex: "1",
      display: "flex",
    },
  });

  const panel = createCanvasPanel("Memory Run", "Trail is gone. Trust your recall.");
  right.appendChild(panel);

  layout.appendChild(sidebar);
  layout.appendChild(right);
  setScene(layout);

  drawRunState();
  setupRunInput();
  startRunLoop();
}

function setupRunInput() {
  cleanupRunInput();
  keyHandlerDown = (e) => {
    if (!isRunPhase) return;
    const key = e.key.toLowerCase();
    if (key === "enter") {
      e.preventDefault();
      finishRun();
      return;
    }
    if (key === "w" || e.key === "ArrowUp") { pressedDirs.up = true; e.preventDefault(); }
    else if (key === "s" || e.key === "ArrowDown") { pressedDirs.down = true; e.preventDefault(); }
    else if (key === "a" || e.key === "ArrowLeft") { pressedDirs.left = true; e.preventDefault(); }
    else if (key === "d" || e.key === "ArrowRight") { pressedDirs.right = true; e.preventDefault(); }
  };

  keyHandlerUp = (e) => {
    if (!isRunPhase) return;
    const key = e.key.toLowerCase();
    if (key === "w" || e.key === "ArrowUp") pressedDirs.up = false;
    else if (key === "s" || e.key === "ArrowDown") pressedDirs.down = false;
    else if (key === "a" || e.key === "ArrowLeft") pressedDirs.left = false;
    else if (key === "d" || e.key === "ArrowRight") pressedDirs.right = false;
  };

  window.addEventListener("keydown", keyHandlerDown);
  window.addEventListener("keyup", keyHandlerUp);
}

function cleanupRunInput() {
  if (keyHandlerDown) {
    window.removeEventListener("keydown", keyHandlerDown);
    keyHandlerDown = null;
  }
  if (keyHandlerUp) {
    window.removeEventListener("keyup", keyHandlerUp);
    keyHandlerUp = null;
  }
  if (runAnimId !== null) {
    cancelAnimationFrame(runAnimId);
    runAnimId = null;
  }
}

function startRunLoop() {
  const SPEED = 6;

  const step = (timestamp) => {
    if (!isRunPhase || !playerPos) return;

    if (lastTimestamp == null) {
      lastTimestamp = timestamp;
      runAnimId = requestAnimationFrame(step);
      return;
    }
    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    let vx = 0;
    let vy = 0;
    if (pressedDirs.up) vy -= 1;
    if (pressedDirs.down) vy += 1;
    if (pressedDirs.left) vx -= 1;
    if (pressedDirs.right) vx += 1;

    const mag = Math.hypot(vx, vy);
    if (mag > 0) {
      vx = (vx / mag) * SPEED;
      vy = (vy / mag) * SPEED;
      playerPos.x += vx * dt;
      playerPos.y += vy * dt;
    }

    const MARGIN = 0.7;
    playerPos.x = Math.max(MARGIN, Math.min(GRID_COLS - MARGIN, playerPos.x));
    playerPos.y = Math.max(MARGIN, Math.min(GRID_ROWS - MARGIN, playerPos.y));

    sampleAccumulator += dt;
    if (sampleAccumulator >= 1 / 20) {
      playerPath.push({ x: playerPos.x, y: playerPos.y });
      sampleAccumulator = 0;
    }

    drawRunState();
    runAnimId = requestAnimationFrame(step);
  };

  runAnimId = requestAnimationFrame(step);
}

function drawRunState() {
  if (!ctx || !canvas || !playerPos) return;
  drawBackground();

  const cellW = canvas.width / GRID_COLS;
  const cellH = canvas.height / GRID_ROWS;

  if (truePath.length > 1) {
    let closestIdx = 0;
    let minDist = Infinity;
    truePath.forEach((p, idx) => {
      const dx = p.x - playerPos.x;
      const dy = p.y - playerPos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        minDist = d;
        closestIdx = idx;
      }
    });

    const windowSize = 4;
    for (let i = Math.max(0, closestIdx - windowSize); i <= Math.min(truePath.length - 1, closestIdx + windowSize); i++) {
      const p = truePath[i];
      const cx = (p.x + 0.5) * cellW;
      const cy = (p.y + 0.5) * cellH;
      const r = cellW * 0.35;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `${COIN_COLOR}20`);
      g.addColorStop(1, `${COIN_COLOR}00`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (playerPath.length > 0) {
    ctx.strokeStyle = "rgba(96,165,250,0.8)";
    ctx.lineWidth = cellW * 0.25;
    ctx.lineCap = "round";
    ctx.beginPath();
    playerPath.forEach((p, idx) => {
      const cx = (p.x + 0.5) * cellW;
      const cy = (p.y + 0.5) * cellH;
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
  }

  const px = (playerPos.x + 0.5) * cellW;
  const py = (playerPos.y + 0.5) * cellH;
  ctx.fillStyle = COIN_COLOR;
  ctx.beginPath();
  ctx.arc(px, py, cellW * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

// Scene 4: Results
async function finishRun() {
  if (!isRunPhase) return;
  isRunPhase = false;
  cleanupRunInput();

  const score = computeScore(truePath, playerPath);

  try {
    if (currentBook?.id) {
      await updateScore(`ash_trail_${currentBook.id}`, score);
    }
  } catch (e) {}

  try {
    if (currentBook?.id && Array.isArray(playerPath) && playerPath.length) {
      const stride = Math.max(1, Math.floor(playerPath.length / 350));
      const trace = playerPath.filter((_, i) => i % stride === 0).map(p => ({ x: p.x, y: p.y }));
      console.log('[AshTrail] Submitting run:', { bookId: currentBook.id, score, traceLength: trace.length });
      const result = await submitAshTrailRun(currentBook.id, score, trace);
      if (result && result.success) {
        console.log('[AshTrail] Run submitted successfully:', result.run?.id);
      } else {
        console.warn('[AshTrail] Run submission failed:', result?.error || 'Unknown error');
      }
    } else {
      console.warn('[AshTrail] Cannot submit run - missing book or path:', { 
        hasBook: !!currentBook?.id, 
        hasPath: Array.isArray(playerPath) && playerPath.length > 0 
      });
    }
  } catch (e) {
    console.error('[AshTrail] Error submitting run:', e);
  }
  
  try {
    lastReward = await awardCryptoForScore(score);
  } catch (e) {}
  
  renderResultsScene(score);
}

async function awardCryptoForScore(score) {
  let solReward = 0;
  
  const required = currentBook?.requiredScore ?? 60;
  if (score >= required) {
    const difficultyBonus = currentBook ? (currentBook.difficulty * 0.05) : 0;
    const scoreBonus = score / 1000;
    solReward = 0.1 + difficultyBonus + scoreBonus;
    solReward = Math.round(solReward * boostMultiplier * 1000) / 1000;
    
    if (isFirstCompletion) {
      solReward += 0.5;
      
      try {
        await completeMinigame('ash_trail');
        await addInventoryItem({
          name: 'Code Scrap: Ash Trail',
          found_at: 'ash_trail',
          timestamp: new Date().toISOString()
        });
        isFirstCompletion = false;
      } catch (e) {}
    }
    
    await rewardMinigame('ash_trail', solReward);
    
  } else if (score >= 50) {
    solReward = Math.round((score / 500) * boostMultiplier * 1000) / 1000;
    await rewardMinigame('ash_trail', solReward);
  }
  
  if (window.WalletDisplay?.refresh) {
    window.WalletDisplay.refresh();
  }
  
  return solReward;
}

function computeScore(trueP, playerP) {
  if (!trueP || trueP.length === 0 || !playerP || playerP.length === 0) return 0;
  if (playerP.length < 5) return 0;

  let totalDistanceTraveled = 0;
  for (let i = 1; i < playerP.length; i++) {
    const dx = playerP[i].x - playerP[i-1].x;
    const dy = playerP[i].y - playerP[i-1].y;
    totalDistanceTraveled += Math.sqrt(dx * dx + dy * dy);
  }

  let truePathLength = 0;
  for (let i = 1; i < trueP.length; i++) {
    const dx = trueP[i].x - trueP[i-1].x;
    const dy = trueP[i].y - trueP[i-1].y;
    truePathLength += Math.sqrt(dx * dx + dy * dy);
  }

  if (totalDistanceTraveled < truePathLength * 0.1) return 0;

  const pathLengthRatio = totalDistanceTraveled / truePathLength;
  let excessPenalty = 1.0;
  if (pathLengthRatio > 2.5) {
    excessPenalty = Math.max(0.1, 1.0 - (pathLengthRatio - 2.5) * 0.3);
  } else if (pathLengthRatio > 2.0) {
    excessPenalty = Math.max(0.5, 1.0 - (pathLengthRatio - 2.0) * 0.6);
  }

  const difficulty = currentBook?.difficulty ?? 2;
  const MAX_DIST = Math.max(0.65, 1.00 - 0.08 * difficulty);

  const weightFromDist = (d) => {
    const t = Math.max(0, 1 - d / MAX_DIST);
    return Math.pow(t, 1.55);
  };

  let proximitySum = 0;
  for (const p of playerP) {
    proximitySum += weightFromDist(distanceToPath(p, trueP));
  }
  const proximityFrac = proximitySum / playerP.length;

  let coverageSum = 0;
  for (const tp of trueP) {
    coverageSum += weightFromDist(distanceToPath(tp, playerP));
  }
  const coverageFrac = coverageSum / trueP.length;

  const rawScore = 0.55 * proximityFrac + 0.45 * coverageFrac;
  const penalizedScore = rawScore * excessPenalty;
  const score = Math.round(penalizedScore * 100);
  return Math.max(0, Math.min(100, score));
}

function distanceToPath(point, path) {
  let min = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const d = distancePointToSegment(point, path[i], path[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

function distancePointToSegment(p, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const abLenSq = abx * abx + aby * aby || 1;
  let t = (apx * abx + apy * aby) / abLenSq;
  t = Math.max(0, Math.min(1, t));
  const closestX = a.x + abx * t;
  const closestY = a.y + aby * t;
  const dx = p.x - closestX;
  const dy = p.y - closestY;
  return Math.sqrt(dx * dx + dy * dy);
}

function reactionForScore(score) {
  const routingExample = currentBook?.routingExample || "the route";
  const slippageEstimate = Math.max(0, (100 - score) / 10).toFixed(1);
  
  if (score < 50) {
    return {
      label: "Inefficient Routing",
      text: `IShowGreen studies your path: "This routing is inefficient. You're losing approximately ${slippageEstimate}% to slippage by deviating from the optimal path through ${routingExample}. In real DeFi, this would cost you significantly more tokens. Try again and follow the pools more precisely."`,
      tone: "error",
    };
  }
  if (score < 80) {
    return {
      label: "Acceptable Routing",
      text: `IShowGreen nods: "Not bad, but you could optimize further. Your route through ${routingExample} had some detours that increased slippage by about ${slippageEstimate}%. You got the tokens, but professional traders would find a better path. Still, functional routing."`,
      tone: "warn",
    };
  }
  return {
    label: "Optimal Routing",
    text: `IShowGreen actually smiles: "Excellent! You've mastered the optimal routing path for ${routingExample}. Your efficiency minimizes slippage and maximizes output tokens. This is exactly how you should route swaps in real DeFi protocols. Well done."`,
    tone: "success",
  };
}

async function fetchAshTrailAI(book, score) {
  try {
    if (!book?.id) return null;
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const apiBase = isLocalhost ? "http://localhost:8403/api/dbs2" : "/api/dbs2";
    const res = await fetch(`${apiBase}/ash-trail/ai`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        book_id: book.id,
        score: score,
        trail_stats: { required: book.requiredScore ?? 60 }
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

function renderResultsScene(score) {
  const reaction = reactionForScore(score);

  const layout = createEl("div", {
    style: {
      display: "flex",
      width: "100%",
      height: "100%",
      gap: "18px",
    },
  });

  const left = createEl("div", {
    style: {
      flex: "1",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: "10px",
    },
  });

  const scoreLabel = createEl("div", {
    textContent: "Routing Efficiency",
    style: {
      fontSize: "13px",
      color: "#9ca3af",
    },
  });

  const scoreValue = createEl("div", {
    textContent: `${score}%`,
    style: {
      fontSize: "42px",
      fontWeight: "800",
    },
  });

  const badge = createEl("div", {
    textContent: reaction.label,
    style: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "11px",
    },
  });

  if (reaction.tone === "error") {
    badge.style.background = "rgba(248,113,113,0.15)";
    badge.style.color = "#fecaca";
    badge.style.border = "1px solid rgba(248,113,113,0.6)";
  } else if (reaction.tone === "warn") {
    badge.style.background = "rgba(250,204,21,0.12)";
    badge.style.color = "#facc15";
    badge.style.border = "1px solid rgba(250,204,21,0.6)";
  } else {
    badge.style.background = `${COIN_COLOR}22`;
    badge.style.color = COIN_COLOR;
    badge.style.border = `1px solid ${COIN_COLOR}88`;
  }

  const reactionText = createEl("p", {
    textContent: reaction.text,
    style: {
      fontSize: "13px",
      color: "#e5e7eb",
      lineHeight: "1.5",
      margin: "6px 0 0",
    },
  });

  // Routing efficiency metrics
  const routingExample = currentBook?.routingExample || "the route";
  const slippageEstimate = Math.max(0, (100 - score) / 10).toFixed(1);
  const efficiencyMetrics = createEl("div", {
    style: {
      marginTop: "15px",
      padding: "12px",
      background: "rgba(0,255,163,0.08)",
      borderRadius: "8px",
      border: "1px solid rgba(0,255,163,0.2)",
    },
  });
  efficiencyMetrics.innerHTML = `
    <div style="font-size: 11px; color: #888; margin-bottom: 6px;">ROUTING METRICS</div>
    <div style="font-size: 12px; color: #e5e7eb; margin-bottom: 4px;">Route: <span style="color: ${COIN_COLOR};">${routingExample}</span></div>
    <div style="font-size: 12px; color: #e5e7eb;">Estimated Slippage: <span style="color: ${score >= 80 ? '#0f0' : score >= 50 ? '#ffa500' : '#f00'};">${slippageEstimate}%</span></div>
    <div style="font-size: 11px; color: #666; margin-top: 6px;">Higher efficiency = Lower slippage = More tokens received</div>
  `;

  // Reward display
  if (lastReward > 0) {
    const rewardDiv = createEl("div", {
      style: {
        marginTop: "15px",
        padding: "15px",
        background: `${COIN_COLOR}22`,
        borderRadius: "10px",
        border: `1px solid ${COIN_COLOR}44`,
        textAlign: "center",
      },
    });
    rewardDiv.innerHTML = `
      <div style="font-size: 28px; margin-bottom: 5px;">${COIN_ICON}</div>
      <div style="font-size: 20px; font-weight: bold; color: ${COIN_COLOR};">+${lastReward.toFixed(3)} ${COIN_SYMBOL}</div>
      <div style="font-size: 13px; color: #888; margin-top: 4px;">Solana - Earned through efficient routing</div>
    `;
    left.appendChild(scoreLabel);
    left.appendChild(scoreValue);
    left.appendChild(badge);
    left.appendChild(reactionText);
    left.appendChild(efficiencyMetrics);
    left.appendChild(rewardDiv);
  } else {
    left.appendChild(scoreLabel);
    left.appendChild(scoreValue);
    left.appendChild(badge);
    left.appendChild(reactionText);
    left.appendChild(efficiencyMetrics);
  }

  // Page wrap
  const pageWrap = createEl("div", {
    style: {
      marginTop: "10px",
      padding: "10px",
      borderRadius: "12px",
      background: "rgba(2,6,23,0.65)",
      border: "1px solid rgba(75,85,99,0.45)",
    },
  });
  const pageTitle = createEl("div", {
    textContent: "Recovered Page",
    style: { fontSize: "12px", fontWeight: "800", color: COIN_COLOR, marginBottom: "6px" },
  });
  const pageText = createEl("pre", {
    textContent: "Loading...",
    style: {
      margin: "0",
      whiteSpace: "pre-wrap",
      fontFamily: "Courier New, monospace",
      fontSize: "11px",
      color: "#e5e7eb",
      lineHeight: "1.45",
    },
  });
  pageWrap.appendChild(pageTitle);
  pageWrap.appendChild(pageText);
  left.appendChild(pageWrap);

  const buttons = createEl("div", {
    style: {
      display: "flex",
      gap: "8px",
      marginTop: "10px",
    },
  });

  const retryBtn = createPrimaryButton("Retry Book", () => {
    renderPreviewScene();
  });

  const shelfBtn = createEl("button", {
    textContent: "Return to Bookshelf",
    style: {
      padding: "7px 14px",
      borderRadius: "999px",
      border: "1px solid rgba(148,163,184,0.8)",
      background: "transparent",
      color: "#e5e7eb",
      fontSize: "13px",
      cursor: "pointer",
    },
  });
  shelfBtn.addEventListener("click", () => {
    renderBookSelectScene();
  });

  const exitBtn = createEl("button", {
    textContent: "Continue Basement Quest",
    style: {
      padding: "7px 14px",
      borderRadius: "999px",
      border: "none",
      background: "rgba(59,130,246,0.15)",
      color: "#bfdbfe",
      fontSize: "13px",
      cursor: "pointer",
    },
  });
  exitBtn.addEventListener("click", () => {
    if (lastReward > 0) {
      showRewardAnimation(REWARD_COIN, lastReward);
    }
    closeOverlay();
  });

  buttons.appendChild(retryBtn);
  buttons.appendChild(shelfBtn);
  buttons.appendChild(exitBtn);
  left.appendChild(buttons);

  const right = createEl("div", {
    style: {
      flex: "1",
      display: "flex",
    },
  });

  const panel = createCanvasPanel("Your Attempt vs. True Path (Preview Only)", "");
  right.appendChild(panel);

  drawBackground();
  if (ctx && canvas) {
    const cellW = canvas.width / GRID_COLS;
    const cellH = canvas.height / GRID_ROWS;

    ctx.strokeStyle = COIN_COLOR;
    ctx.lineWidth = cellW * 0.25;
    ctx.beginPath();
    truePath.forEach((p, idx) => {
      const cx = (p.x + 0.5) * cellW;
      const cy = (p.y + 0.5) * cellH;
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    if (playerPath.length > 0) {
      ctx.strokeStyle = "rgba(59,130,246,0.9)";
      ctx.beginPath();
      playerPath.forEach((p, idx) => {
        const cx = (p.x + 0.5) * cellW;
        const cy = (p.y + 0.5) * cellH;
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    }

    fetchAshTrailAI(currentBook, score).then((ai) => {
      if (!ai) {
        pageText.textContent = "No backend page text available.";
        return;
      }
      if (ai.dialogue) reactionText.textContent = ai.dialogue;
      if (ai.page_title) pageTitle.textContent = ai.page_title;
      if (ai.page_text) pageText.textContent = ai.page_text;
    });
  }

  layout.appendChild(left);
  layout.appendChild(right);
  setScene(layout);
}

// Public entry point
export async function showAshTrailMinigame() {
  window.ashTrailActive = true;
  window.minigameActive = true;
  
  // Fetch coin price
  try {
    const priceData = await getCoinPrice(REWARD_COIN);
    coinPrice = priceData.price_usd || 0;
    coinChange = priceData.change_24h || 0;
    boostMultiplier = priceData.boost_multiplier || 1.0;
    console.log('[AshTrail] SOL price:', coinPrice, 'boost:', boostMultiplier);
  } catch (e) {
    coinPrice = 150;
    coinChange = 0;
    boostMultiplier = 1.0;
  }
  
  // Check first completion
  try {
    isFirstCompletion = !(await isMinigameCompleted('ash_trail'));
    console.log('[AshTrail] First completion:', isFirstCompletion);
  } catch (e) {
    isFirstCompletion = false;
  }
  
  openOverlay();
  renderIntroScene();
}

window.showAshTrailMinigame = showAshTrailMinigame;