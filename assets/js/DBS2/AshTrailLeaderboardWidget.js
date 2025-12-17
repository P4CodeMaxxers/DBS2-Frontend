/**
 * Small pixel-themed Ash Trail leaderboard widget (main game overlay).
 * Pulls from backend: GET /api/dbs2/leaderboard/minigame?game=ash_trail&limit=5
 * Auto-refreshes on an interval.
 */
export default class AshTrailLeaderboardWidget {
  constructor(apiBase = null) {
    this.container = null;
    this.apiBase = apiBase || this._inferApiBase();
    this.refreshInterval = null;
    this.isRefreshing = false;
    this.rows = [];
    this.mode = "defi_grimoire"; // defi_grimoire | lost_ledger | proof_of_burn
  }

  _inferApiBase() {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    return isLocalhost ? "http://localhost:8587/api/dbs2" : "/api/dbs2";
  }

  async fetchLeaderboard(limit = 5) {
    const gameKey = `ash_trail_${this.mode}`;
    const url = `${this.apiBase}/leaderboard/minigame?game=${encodeURIComponent(gameKey)}&limit=${limit}`;
    const res = await fetch(url, { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const raw = data?.leaderboard;
    if (!Array.isArray(raw)) return [];
    return raw.map((entry, idx) => ({
      rank: entry?.rank ?? idx + 1,
      name: entry?.user_info?.name || entry?.user_info?.uid || "Unknown",
      score: typeof entry?.score === "number" ? entry.score : Number(entry?.score ?? 0),
      run_id: entry?.run_id ?? null,
    }));
  }

  async _openGhostViewerFromLeaderboardEntry(entry) {
    try {
      const bookId = this.mode;
      const runId = entry?.run_id;
      if (!runId) {
        alert("No replay uploaded for this leaderboard entry yet (it has a score, but no saved trace).");
        return;
      }

      const detailRes = await fetch(`${this.apiBase}/ash-trail/runs/${runId}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      if (!detailRes.ok) throw new Error(`HTTP ${detailRes.status}`);
      const detail = await detailRes.json();
      const run = detail?.run;
      const trace = Array.isArray(run?.trace) ? run.trace : [];
      if (!trace.length) throw new Error("Empty trace");

      this._showGhostOverlay({
        title: run?.user_info?.name || run?.user_info?.uid || "Ghost Run",
        subtitle: `${bookId.replaceAll("_", " ")} · ${Math.round(Number(run?.score) || 0)}%`,
        trace
      });
    } catch (e) {
      console.log("[AshTrail] Ghost viewer failed:", e);
      alert("Could not load this replay (missing trace or backend error).");
    }
  }

  _showGhostOverlay({ title, subtitle, trace }) {
    const existing = document.getElementById("ashtrail-ghost-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "ashtrail-ghost-overlay";
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2000;
      background: rgba(0,0,0,0.75);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Sixtyfour', 'Courier New', monospace;
    `;

    const panel = document.createElement("div");
    panel.style.cssText = `
      width: min(720px, 92vw);
      background: rgba(15, 23, 42, 0.95);
      border: 3px solid #666;
      box-shadow: 6px 6px 0 rgba(0,0,0,0.7);
      padding: 10px;
    `;

    const header = document.createElement("div");
    header.style.cssText = `display:flex; justify-content:space-between; align-items:center; gap:10px;`;
    const hLeft = document.createElement("div");
    hLeft.innerHTML = `<div style="color:#e5e7eb;font-size:12px;font-weight:bold;">▶ ${title}</div>
      <div style="color:#9ca3af;font-size:10px;margin-top:2px;">${subtitle}</div>`;
    const close = document.createElement("button");
    close.textContent = "✕";
    close.style.cssText = `background:rgba(255,255,255,0.08); border:2px solid #666; color:#fff; cursor:pointer; padding:2px 8px;`;
    close.onclick = () => overlay.remove();
    header.appendChild(hLeft);
    header.appendChild(close);

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 420;
    canvas.style.cssText = `width:100%; height:auto; margin-top:10px; background:#020617; border:1px solid rgba(75,85,99,0.8);`;
    const ctx = canvas.getContext("2d");

    panel.appendChild(header);
    panel.appendChild(canvas);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Playback (assumes 24x24 grid like AshTrailMinigame)
    const GRID = 24;
    const cellW = canvas.width / GRID;
    const cellH = canvas.height / GRID;

    let i = 0;
    const drawFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#020617");
      grad.addColorStop(1, "#0b1120");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.lineWidth = cellW * 0.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(56,189,248,0.85)";
      ctx.beginPath();
      trace.forEach((p, idx) => {
        if (idx > i) return;
        const x = (p.x + 0.5) * cellW;
        const y = (p.y + 0.5) * cellH;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      const head = trace[i];
      if (head) {
        const x = (head.x + 0.5) * cellW;
        const y = (head.y + 0.5) * cellH;
        ctx.fillStyle = "rgba(251,191,36,0.95)";
        ctx.beginPath();
        ctx.arc(x, y, cellW * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }

      i++;
      if (i < trace.length) setTimeout(drawFrame, 18);
    };
    drawFrame();
  }

  async init(autoRefresh = true, refreshIntervalMs = 3000) {
    const existing = document.getElementById("ashtrail-leaderboard-container");
    if (existing) existing.remove();

    // Force consistent dropdown theming across browsers (options often ignore inline styles).
    if (!document.getElementById("ashtrail-leaderboard-style")) {
      const style = document.createElement("style");
      style.id = "ashtrail-leaderboard-style";
      style.textContent = `
        #ashtrail-leaderboard-mode {
          background: rgba(0,0,0,0.55) !important;
          color: #e5e7eb !important;
        }
        #ashtrail-leaderboard-mode option {
          background: #0b0f19 !important;
          color: #e5e7eb !important;
        }
      `;
      document.head.appendChild(style);
    }

    this.container = document.createElement("div");
    this.container.id = "ashtrail-leaderboard-container";

    // Positioned near the bookshelf (right side of basement).
    // (Bookshelf sprite is at ~width * 19/22, height * 3/5 in `GameLevelBasement.js`.)
    this.container.style.cssText = `
      position: fixed;
      top: 330px;
      right: 16px;
      min-width: 190px;
      max-width: 240px;
      background: rgba(24, 24, 24, 0.92);
      border: 3px solid #666666;
      border-radius: 0;
      padding: 0;
      color: #ffffff;
      font-family: 'Sixtyfour', 'Courier New', monospace;
      font-size: 11px;
      z-index: 999;
      box-shadow: 5px 5px 0px rgba(0, 0, 0, 0.75), inset 0 0 0 2px rgba(255, 255, 255, 0.08);
      image-rendering: pixelated;
      line-height: 1.2;
      overflow: hidden;
      pointer-events: auto;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      border-bottom: 2px solid #666666;
      background: rgba(0, 0, 0, 0.25);
    `;

    const title = document.createElement("span");
    title.textContent = "📚 ASH TRAIL";
    title.style.cssText = `
      font-size: 12px;
      font-weight: bold;
      text-shadow: 2px 2px 0px rgba(0, 0, 0, 1);
      letter-spacing: 0.8px;
      color: #86efac;
    `;

    const controls = document.createElement("div");
    controls.style.cssText = `display:flex; align-items:center; gap:6px;`;

    const select = document.createElement("select");
    select.id = "ashtrail-leaderboard-mode";
    select.style.cssText = `
      background: rgba(255,255,255,0.08);
      border: 2px solid #666;
      color: #fff;
      font-size: 10px;
      padding: 2px 4px;
      font-family: 'Courier New', monospace;
      outline: none;
    `;
    select.innerHTML = `
      <option value="defi_grimoire">DeFi</option>
      <option value="lost_ledger">Ledger</option>
      <option value="proof_of_burn">Burn</option>
    `;
    select.value = this.mode;
    select.addEventListener("change", () => {
      this.mode = select.value;
      this.refresh();
    });

    const refreshBtn = document.createElement("button");
    refreshBtn.innerHTML = "🔄";
    refreshBtn.title = "Refresh";
    refreshBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid #666;
        border-radius: 4px;
        color: #fff;
        cursor: pointer;
        font-size: 11px;
        padding: 3px 5px;
        line-height: 1;
      `;
    refreshBtn.onclick = () => this.refresh();

    controls.appendChild(select);
    controls.appendChild(refreshBtn);

    header.appendChild(title);
    header.appendChild(controls);
    this.container.appendChild(header);

    const body = document.createElement("div");
    body.id = "ashtrail-leaderboard-entries";
    body.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 8px 10px;
    `;
    this.container.appendChild(body);

    document.body.appendChild(this.container);

    await this.refresh();

    if (autoRefresh) this.startAutoRefresh(refreshIntervalMs);
  }

  _render() {
    const body = document.getElementById("ashtrail-leaderboard-entries");
    if (!body) return;

    if (!this.rows.length) {
      body.innerHTML = `<div style="color:#9ca3af;font-size:10px;">No scores yet</div>`;
      return;
    }

    body.innerHTML = "";
    this.rows.slice(0, 5).forEach((r, idx) => {
      const row = document.createElement("div");
      row.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 6px;
        background: ${idx === 0 ? "rgba(134, 239, 172, 0.10)" : idx % 2 === 0 ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.06)"};
        border: 2px solid ${idx === 0 ? "#86efac" : "#444444"};
        border-left-width: ${idx === 0 ? "4px" : "2px"};
        white-space: nowrap;
        font-size: 10px;
      `;

      const left = document.createElement("span");
      const nm = (r.name || "Unknown").toString();
      const displayName = nm.length > 10 ? nm.slice(0, 9) + "…" : nm;
      left.textContent = `#${r.rank} ${displayName}`;
      left.title = nm;
      left.style.cssText = `
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 2px 2px 0px rgba(0, 0, 0, 1);
      `;

      const right = document.createElement("span");
      right.textContent = `${Math.max(0, Math.min(100, Math.round(Number(r.score) || 0)))}%`;
      right.style.cssText = `
        font-weight: bold;
        color: #86efac;
        text-shadow: 2px 2px 0px rgba(0, 0, 0, 1);
        font-family: 'Courier New', monospace;
      `;

      const watch = document.createElement("button");
      watch.textContent = "▶";
      watch.title = "Watch ghost run";
      watch.style.cssText = `
        background: rgba(255,255,255,0.08);
        border: 2px solid #666;
        color: #fff;
        cursor: pointer;
        font-size: 10px;
        padding: 1px 6px;
        line-height: 1.2;
      `;
      watch.onclick = (e) => {
        e.stopPropagation();
        this._openGhostViewerFromLeaderboardEntry(r);
      };

      const rightWrap = document.createElement("div");
      rightWrap.style.cssText = "display:flex; align-items:center; gap:6px;";
      rightWrap.appendChild(right);
      rightWrap.appendChild(watch);

      row.appendChild(left);
      row.appendChild(rightWrap);
      body.appendChild(row);
    });
  }

  async refresh() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    try {
      const rows = await this.fetchLeaderboard(5);
      this.rows = rows || [];
    } catch (e) {
      this.rows = [];
    } finally {
      this.isRefreshing = false;
      this._render();
    }
  }

  startAutoRefresh(intervalMs = 3000) {
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(() => this.refresh(), intervalMs);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  destroy() {
    this.stopAutoRefresh();
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}


