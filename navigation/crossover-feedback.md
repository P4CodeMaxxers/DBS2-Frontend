---
layout: page
title: "Crossover Feedback — DBS2"
permalink: /crossover-feedback
search_exclude: true
---

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

<style>
  .crossover-wrap {
    font-family: 'DM Sans', system-ui, sans-serif;
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    background: linear-gradient(160deg, #eef2f7 0%, #e2e8f0 50%, #cbd5e1 100%);
    color: #000000 !important;
    border-radius: 20px;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.12);
  }
  .crossover-wrap h1,
  .crossover-wrap h2,
  .crossover-wrap .teams-heading {
    color: #000000 !important;
  }
  .crossover-wrap h1 {
    font-size: 1.85rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 0.35rem;
  }
  .crossover-wrap .subtitle {
    font-size: 0.95rem;
    color: #000000 !important;
    margin-bottom: 2rem;
  }
  .overall-block {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
    padding: 1.5rem 1.75rem;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-radius: 16px;
    color: #f8fafc;
    margin-bottom: 2.5rem;
    box-shadow: 0 10px 40px -10px rgba(15,23,42,0.4);
  }
  .overall-block .score-circle {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: linear-gradient(145deg, #38bdf8 0%, #0ea5e9 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }
  .overall-block .score-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    margin-top: 0.25rem;
  }
  .summary-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    margin-top: 1rem;
  }
  @media (max-width: 640px) { .summary-cols { grid-template-columns: 1fr; } }
  .summary-box {
    padding: 1.25rem 1.5rem;
    border-radius: 12px;
    border-left: 4px solid;
  }
  .summary-box.glows {
    background: rgba(56, 189, 248, 0.08);
    border-left-color: #0ea5e9;
  }
  .summary-box.grows {
    background: rgba(251, 113, 133, 0.08);
    border-left-color: #fb7185;
  }
  .summary-box h3 {
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.75rem;
  }
  .summary-box.glows h3 { color: #0284c7; }
  .summary-box.grows h3 { color: #e11d48; }
  .summary-box ul {
    margin: 0;
    padding-left: 1.1rem;
    font-size: 0.9rem;
    line-height: 1.65;
    color: #000000;
  }
  .teams-heading {
    font-size: 1.1rem;
    font-weight: 700;
    color: #000000 !important;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .teams-heading .badge {
    background: #1e293b;
    color: #f8fafc;
    font-size: 0.75rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-weight: 600;
  }
  .team-card {
    background: linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%);
    border-radius: 16px;
    padding: 1.5rem 1.75rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5);
    border: 2px solid #cbd5e1;
    border-left-width: 6px;
  }
  .team-card.team-1 { border-left-color: #0ea5e9; }
  .team-card.team-2 { border-left-color: #8b5cf6; }
  .team-card.team-3 { border-left-color: #f59e0b; }
  .team-card.team-4 { border-left-color: #10b981; }
  .team-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #cbd5e1;
  }
  .team-card h2 {
    font-size: 1.15rem;
    font-weight: 700;
    color: #000000;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .team-card h2 .team-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 800;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .team-card.team-1 h2 .team-num { background: linear-gradient(145deg, #0ea5e9, #0284c7); }
  .team-card.team-2 h2 .team-num { background: linear-gradient(145deg, #8b5cf6, #7c3aed); }
  .team-card.team-3 h2 .team-num { background: linear-gradient(145deg, #f59e0b, #d97706); }
  .team-card.team-4 h2 .team-num { background: linear-gradient(145deg, #10b981, #059669); }
  .team-rating {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(15,23,42,0.08);
    border: 2px solid #94a3b8;
    border-radius: 12px;
    padding: 0.35rem 0.75rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 1rem;
    font-weight: 700;
    color: #000000;
  }
  .team-card.team-1 .team-rating { border-color: #0ea5e9; background: rgba(14,165,233,0.12); color: #0369a1; }
  .team-card.team-2 .team-rating { border-color: #8b5cf6; background: rgba(139,92,246,0.12); color: #6d28d9; }
  .team-card.team-3 .team-rating { border-color: #f59e0b; background: rgba(245,158,11,0.12); color: #b45309; }
  .team-card.team-4 .team-rating { border-color: #10b981; background: rgba(16,185,129,0.12); color: #047857; }
  .team-rating .stars {
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    color: #eab308;
  }
  .team-card .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  @media (max-width: 700px) { .team-card .two-col { grid-template-columns: 1fr; } }
  .team-card .col {
    background: #e2e8f0;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    border: 1px solid #94a3b8;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .team-card .col.their-feedback { border-left: 4px solid #0284c7; }
  .team-card .col.ours { border-left: 4px solid #6d28d9; }
  .team-card .col h4 {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.6rem;
    color: #000000 !important;
  }
  .team-card .col.their-feedback h4:first-of-type { color: #000000 !important; border-bottom: 1px solid #bae6fd; padding-bottom: 0.35rem; }
  .team-card .col.their-feedback h4.grows { color: #000000 !important; border-bottom: 1px solid #fecdd3; padding-bottom: 0.35rem; }
  .team-card .col.ours h4 { color: #000000 !important; border-bottom: 1px solid #e9d5ff; padding-bottom: 0.35rem; }
  .team-card .col ul,
  .team-card .col p,
  .team-card .col ul li,
  .team-card .col p strong {
    margin: 0 0 0.5rem;
    padding-left: 1rem;
    font-size: 0.9rem;
    line-height: 1.7;
    color: #000000 !important;
  }
  .team-card .col p { padding-left: 0; }
  .team-card .col ul { list-style: disc; }
  .team-card .col ul li { margin-bottom: 0.25rem; }
  .team-card .col.ours ul { list-style: circle; }
  .team-card .col strong { color: #000000 !important; }
  .crossover-wrap .team-card .col,
  .crossover-wrap .team-card .col * {
    color: #000000 !important;
  }
  .crossover-wrap .team-card .col .status.completed { color: #059669 !important; }
  .crossover-wrap .team-card .col .status.not-completed { color: #dc2626 !important; }
  .suggestion-note {
    font-size: 0.85rem;
    color: #000000 !important;
    font-style: italic;
    margin-top: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #cbd5e1;
    border-radius: 8px;
    border-left: 4px solid #475569;
  }
  .summary-box ul { color: #000000; }
  .project-overview {
    background: #f8fafc;
    border: 2px solid #cbd5e1;
    border-radius: 16px;
    padding: 1.5rem 1.75rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .project-overview h2 { font-size: 1.1rem; color: #000000 !important; margin-bottom: 0.75rem; }
  .project-overview p { color: #000000 !important; line-height: 1.7; margin: 0; }
  .feedback-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1rem 1.25rem;
    background: #f8fafc;
    border: 2px solid #cbd5e1;
    border-radius: 12px;
  }
  .feedback-stats .stat { text-align: center; min-width: 80px; }
  .feedback-stats .stat .val { font-size: 1.5rem; font-weight: 700; color: #000000 !important; font-family: 'JetBrains Mono', monospace; }
  .feedback-stats .stat .lbl { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #000000 !important; }
  .themes-section { margin-top: 2.5rem; margin-bottom: 2rem; }
  .themes-section h2 { font-size: 1.2rem; color: #000000 !important; margin-bottom: 1rem; }
  .themes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  @media (max-width: 640px) { .themes-grid { grid-template-columns: 1fr; } }
  .themes-card {
    background: #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
    border: 2px solid #94a3b8;
  }
  .themes-card h3 { font-size: 0.9rem; color: #000000 !important; margin-bottom: 0.75rem; padding-bottom: 0.35rem; border-bottom: 2px solid #94a3b8; }
  .themes-card.strengths { border-left: 4px solid #059669; }
  .themes-card.improve { border-left: 4px solid #dc2626; }
  .themes-card ul,
  .themes-card ul li { margin: 0; padding-left: 1.1rem; color: #000000 !important; font-size: 0.9rem; line-height: 1.6; }
  .action-section { margin-bottom: 2rem; }
  .action-section h2 { font-size: 1.2rem; color: #000000 !important; margin-bottom: 1rem; }
  .action-list { list-style: none; padding: 0; margin: 0; }
  .action-list li {
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.5rem;
    background: #f1f5f9;
    border-radius: 8px;
    color: #000000 !important;
    font-size: 0.9rem;
    border: 1px solid #cbd5e1;
    border-left: 4px solid #6366f1;
  }
  .action-list li.priority-high { border-left-color: #dc2626 !important; }
  .action-list li.priority-mid { border-left-color: #f59e0b !important; }
  .action-list li.priority-future { border-left-color: #64748b !important; }
  .conclusion-box {
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
    border: 2px solid #0ea5e9;
    border-radius: 16px;
    padding: 1.5rem 1.75rem;
    color: #000000 !important;
    font-size: 0.95rem;
    line-height: 1.7;
  }
  .suggestions-table-wrap {
    margin-bottom: 2rem;
    overflow-x: auto;
  }
  .suggestions-table-wrap h2 { font-size: 1.2rem; color: #000000 !important; margin-bottom: 1rem; }
  .suggestions-table {
    width: 100%;
    border-collapse: collapse;
    background: #1e293b;
    border: 2px solid #334155;
    border-radius: 12px;
    overflow: hidden;
    font-size: 0.9rem;
  }
  .suggestions-table th,
  .suggestions-table td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #334155;
  }
  .suggestions-table th {
    background: #334155;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.8rem;
    color: #ffffff !important;
  }
  .suggestions-table tbody tr { background: #1e293b; }
  .suggestions-table tbody tr:nth-child(even) { background: #0f172a; }
  .suggestions-table tbody td {
    color: #ffffff !important;
  }
  .suggestions-table tr:last-child td { border-bottom: none; }
  .suggestions-table .status {
    font-weight: 600;
    white-space: nowrap;
  }
  .suggestions-table .status.completed { color: #86efac !important; }
  .suggestions-table .status.not-completed { color: #fca5a5 !important; }
  .suggestions-checklist {
    list-style: none;
    padding: 0;
    margin: 0;
    background: #1e293b;
    border: 2px solid #334155;
    border-radius: 12px;
    overflow: hidden;
    font-size: 0.9rem;
  }
  .suggestions-checklist li {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #334155;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #ffffff !important;
  }
  .suggestions-checklist li:last-child { border-bottom: none; }
  .suggestions-checklist li:nth-child(even) { background: #0f172a; }
  .suggestions-checklist li.checked .suggestion-text { text-decoration: line-through; opacity: 0.8; }
  .suggestions-checklist input[type="checkbox"] {
    width: 1.1rem;
    height: 1.1rem;
    accent-color: #86efac;
    flex-shrink: 0;
    cursor: pointer;
  }
  .suggestions-checklist .suggestion-text { flex: 1; }
</style>

<div class="crossover-wrap">
  <h1>DBS2 — Crossover Review Feedback</h1>
  <p class="subtitle">Feedback from peer teams and our suggestions in return</p>

  <section class="project-overview">
    <h2>Project overview</h2>
    <p>DBS2 is a gamified crypto and computer science learning platform. Players earn coins (Satoshis, Solana, Dogecoin, etc.) by completing minigames—including Ash Trail, a pathfinding puzzle tied to the DeFi Grimoire and other “books”—and climb leaderboards. The crossover review captured peer feedback on scope, UX, and educational value.</p>
  </section>

  <div class="feedback-stats">
    <div class="stat"><span class="val">4.4</span><div class="lbl">Avg rating</div></div>
    <div class="stat"><span class="val">4</span><div class="lbl">Teams</div></div>
    <div class="stat"><span class="val">2</span><div class="lbl">Summary themes</div></div>
  </div>

  <div class="overall-block">
    <div>
      <div class="score-circle">4.4</div>
      <div class="score-label">Overall rating</div>
    </div>
    <div class="summary-cols" style="flex: 1;">
      <div class="summary-box glows">
        <h3>Glows (across all teams)</h3>
        <ul>
          <li>Ash Trail difficulty options and randomized feature</li>
          <li>Leaderboard and crypto/minigame structure</li>
          <li>Interactive, game-based learning style</li>
          <li>Clear focus and scope from some reviewers</li>
        </ul>
      </div>
      <div class="summary-box grows">
        <h3>Grows (across all teams)</h3>
        <ul>
          <li>Add splash screen, hints, and clearer instructions</li>
          <li>Remove unused minigames and tidy Ash Trail UI</li>
          <li>More crypto/cryptography-related content</li>
          <li>Improve button contrast and readability where noted</li>
        </ul>
      </div>
    </div>
  </div>

  <p class="teams-heading">Feedback by team <span class="badge">4 teams</span></p>

  <!-- Team 1 -->
  <div class="team-card team-1">
    <div class="team-card-header">
      <h2><span class="team-num">1</span> Team 1</h2>
      <span class="team-rating"><span class="stars">★★★★☆</span> 4.2</span>
    </div>
    <div class="two-col">
      <div class="col their-feedback">
        <h4>Their feedback to us</h4>
        <p><strong>Glows:</strong></p>
        <ul>
          <li>Easy and hard mode for Ash Trail; randomized feature is a plus</li>
          <li>Leaderboard and game structure make progress feel tangible</li>
        </ul>
        <p><strong>Grows:</strong></p>
        <ul>
          <li>Add a splash screen</li>
          <li>Add hints and clearer instructions</li>
          <li>Consider a short “how to play” tooltip on first visit</li>
        </ul>
        <p class="suggestion-note">Suggestion: Add a hint button at the top for first-time players.</p>
      </div>
      <div class="col ours">
        <h4>Our suggestions to them</h4>
        <ul>
          <li>Stores top times for media organizer — strong for tracking progress</li>
          <li>Recommended sources and information about different sources</li>
          <li>Thesis generator: generates thesis from descriptions, gives a quality score, counter/supporting arguments, and advice; copy/paste friendly</li>
          <li>Citation generator with Gemini; can fill in or paste link; multiple export options</li>
          <li>Summary of activity through the site; uses data to infer bias — really useful</li>
          <li>Consider a “saved projects” or history view so users can revisit past work</li>
          <li>Overall really good; suggest adding a hint button at the top for consistency</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Team 2 -->
  <div class="team-card team-2">
    <div class="team-card-header">
      <h2><span class="team-num">2</span> Team 2</h2>
      <span class="team-rating"><span class="stars">★★★★☆</span> 4.5</span>
    </div>
    <div class="two-col">
      <div class="col their-feedback">
        <h4>Their feedback to us</h4>
        <p><strong>Grows:</strong></p>
        <ul>
          <li>Remove two minigames that aren’t being used</li>
          <li>Second leaderboard in Ash Trail UI shouldn’t be permanently on screen (or make it collapsible)</li>
          <li>Unify navigation so users don’t get lost between crypto and minigame sections</li>
        </ul>
        <p class="suggestion-note">Suggestion: Single, clear leaderboard view and optional “view run” for Ash Trail.</p>
      </div>
      <div class="col ours">
        <h4>Our suggestions to them</h4>
        <ul>
          <li>Adding data (might get removed) — consider keeping a lightweight summary</li>
          <li>Ability to see data and user data in a clear way</li>
          <li>MC on media literacy and staying safe online (e.g. not sharing certain info); summary stats and “what others said” %</li>
          <li>Microblog + Gemini API for personality type — standout feature</li>
          <li>Machine learning game felt off-topic/redundant; could trim or refocus</li>
          <li>Fifth module: matchmaking game showing your info vs others — good hook</li>
          <li>Matching/cohesive theme and more visual consistency would strengthen the product</li>
          <li>Add a “share results” or export so users can compare with friends</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Team 3 -->
  <div class="team-card team-3">
    <div class="team-card-header">
      <h2><span class="team-num">3</span> Team 3</h2>
      <span class="team-rating"><span class="stars">★★★★☆</span> 4.0</span>
    </div>
    <div class="two-col">
      <div class="col their-feedback">
        <h4>Their feedback to us</h4>
        <p><strong>Grows:</strong></p>
        <ul>
          <li>Add more cryptography and crypto-related games</li>
          <li>Remove or replace old games that don’t fit the theme</li>
          <li>Clarify learning objectives at the start of each minigame</li>
        </ul>
        <p class="suggestion-note">Suggestion: Tie new crypto minigames to existing Ash Trail / DeFi theme.</p>
      </div>
      <div class="col ours">
        <h4>Our suggestions to them</h4>
        <ul>
          <li><strong>Superpower:</strong> 6 modules + live refresh/rooms — strong structure</li>
          <li>Demonstrates complex concepts (GPU, CPU, parallel computing) in approachable ways</li>
          <li>Main focus: how computer architecture works; interactive demos</li>
          <li>Teaching different types of computing; articles + server-side simulation (sequential math)</li>
          <li>Digit recognition with API showing processing and parallel speedup</li>
          <li>Math applied to real-case scenarios; building intuition and testing case studies</li>
          <li>Clear “when to use which kind of computing” takeaway</li>
          <li>Collaborative rooms to get through modules — great for engagement</li>
          <li>A “glossary” or quick-reference panel for terms would help beginners</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Team 4 -->
  <div class="team-card team-4">
    <div class="team-card-header">
      <h2><span class="team-num">4</span> Team 4</h2>
      <span class="team-rating"><span class="stars">★★★★★</span> 4.6</span>
    </div>
    <div class="two-col">
      <div class="col their-feedback">
        <h4>Their feedback to us</h4>
        <p><strong>Glows:</strong></p>
        <ul>
          <li>AI integration is unique and really cool</li>
          <li>Current time is ideal for teaching this kind of essential knowledge</li>
          <li>Ash Trail feels engaging and ties well to the crypto theme</li>
        </ul>
        <p><strong>Superpower:</strong> Interactive training</p>
        <p><strong>Focus:</strong> Teaching kids to use AI effectively for schoolwork</p>
        <p><strong>Features:</strong> AI prompt engineering trainer; prompt generator for various subjects</p>
        <h4 class="grows" style="margin-top: 1rem;">Grows</h4>
        <ul>
          <li>Some buttons are hard to read — text colors too similar to background; increase contrast</li>
          <li>Add a brief “what you’ll learn” before each activity</li>
        </ul>
        <p class="suggestion-note">Suggestion: Run a quick accessibility pass on button text vs background.</p>
      </div>
      <div class="col ours">
        <h4>Our suggestions to them</h4>
        <ul>
          <li>Prompt engineering trainer is highly relevant and timely</li>
          <li>Prompt generator per subject helps scaffold learning</li>
          <li>Improving button/text contrast will help usability a lot</li>
          <li>Consider a short “why this matters” blurb on the homepage for students and parents</li>
          <li>Example prompts or a “prompt library” would help learners get started faster</li>
          <li>Progress badges or levels could increase motivation for younger users</li>
        </ul>
      </div>
    </div>
  </div>

  <section class="themes-section">
    <h2>Key themes from feedback</h2>
    <div class="themes-grid">
      <div class="themes-card strengths">
        <h3>Strengths identified</h3>
        <ul>
          <li>Ash Trail difficulty options and replay/leaderboard structure</li>
          <li>Interactive, game-based learning and crypto/minigame theme</li>
          <li>Clear scope and unique AI integration (noted by Team 4)</li>
        </ul>
      </div>
      <div class="themes-card improve">
        <h3>Areas for improvement</h3>
        <ul>
          <li>Splash screen, hints, and clearer instructions</li>
          <li>Button and text contrast (accessibility)</li>
          <li>Trim unused minigames; collapsible or single leaderboard view</li>
          <li>More crypto/cryptography content and learning objectives per minigame</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="action-section">
    <h2>Our action items</h2>
    <ul class="action-list">
      <li class="priority-high">Run an accessibility pass on button text vs background contrast</li>
      <li class="priority-high">Add a hint / “how to play” control for first-time players</li>
      <li class="priority-mid">Add a splash screen and clarify instructions for Ash Trail</li>
      <li class="priority-mid">Consider a single or collapsible leaderboard view in Ash Trail UI</li>
      <li class="priority-future">Add more crypto-themed minigames and tie learning objectives to each activity</li>
    </ul>
  </section>

  <section class="suggestions-table-wrap">
    <h2>Suggestions — check off when completed</h2>
    <ul class="suggestions-checklist" id="suggestions-checklist">
      <li id="sug-1"><label style="display:flex;align-items:center;gap:0.75rem;width:100%;cursor:pointer;"><input type="checkbox" data-id="1" aria-label="Mark completed"><span class="suggestion-text">Run an accessibility pass on button text vs background contrast</span></label></li>
      <li id="sug-2"><label style="display:flex;align-items:center;gap:0.75rem;width:100%;cursor:pointer;"><input type="checkbox" data-id="2" aria-label="Mark completed"><span class="suggestion-text">Add a hint / “how to play” control for first-time players</span></label></li>
      <li id="sug-3"><label style="display:flex;align-items:center;gap:0.75rem;width:100%;cursor:pointer;"><input type="checkbox" data-id="3" aria-label="Mark completed"><span class="suggestion-text">Add a splash screen and clarify instructions for Ash Trail</span></label></li>
      <li id="sug-4"><label style="display:flex;align-items:center;gap:0.75rem;width:100%;cursor:pointer;"><input type="checkbox" data-id="4" aria-label="Mark completed"><span class="suggestion-text">Consider a single or collapsible leaderboard view in Ash Trail UI</span></label></li>
      <li id="sug-5"><label style="display:flex;align-items:center;gap:0.75rem;width:100%;cursor:pointer;"><input type="checkbox" data-id="5" aria-label="Mark completed"><span class="suggestion-text">Add more crypto-themed minigames and tie learning objectives to each activity</span></label></li>
      <li id="sug-6"><label style="display:flex;align-items:center;gap:0.75rem;width:100%;cursor:pointer;"><input type="checkbox" data-id="6" aria-label="Mark completed"><span class="suggestion-text">Trim or remove unused minigames and tidy Ash Trail UI</span></label></li>
      <li id="sug-7"><label style="display:flex;align-items:center;gap:0.75rem;width:100%;cursor:pointer;"><input type="checkbox" data-id="7" aria-label="Mark completed"><span class="suggestion-text">Unify navigation so users don't get lost between crypto and minigame sections</span></label></li>
      <li id="sug-8"><label style="display:flex;align-items:center;gap:0.75rem;width:100%;cursor:pointer;"><input type="checkbox" data-id="8" aria-label="Mark completed"><span class="suggestion-text">Add "what you'll learn" or learning objectives at the start of each minigame</span></label></li>
      <li id="sug-9"><label style="display:flex;align-items:center;gap:0.75rem;width:100%;cursor:pointer;"><input type="checkbox" data-id="9" aria-label="Mark completed"><span class="suggestion-text">Add a short "how to play" tooltip or onboarding for first visit</span></label></li>
      <li id="sug-10"><label style="display:flex;align-items:center;gap:0.75rem;width:100%;cursor:pointer;"><input type="checkbox" data-id="10" aria-label="Mark completed"><span class="suggestion-text">Tie new crypto minigames to existing Ash Trail / DeFi theme</span></label></li>
      <li id="sug-11"><label style="display:flex;align-items:center;gap:0.75rem;width:100%;cursor:pointer;"><input type="checkbox" data-id="11" aria-label="Mark completed"><span class="suggestion-text">Add more cryptography and crypto-related content across the site</span></label></li>
      <li id="sug-12"><label style="display:flex;align-items:center;gap:0.75rem;width:100%;cursor:pointer;"><input type="checkbox" data-id="12" aria-label="Mark completed"><span class="suggestion-text">Improve button and text contrast across all minigames (accessibility)</span></label></li>
    </ul>
  </section>
  <script>
  (function() {
    var KEY = 'dbs2_crossover_suggestions_checked';
    var list = document.getElementById('suggestions-checklist');
    if (!list) return;
    var inputs = list.querySelectorAll('input[type="checkbox"]');
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
    function save() {
      var out = {};
      inputs.forEach(function(inp) {
        var id = inp.getAttribute('data-id');
        if (id) out[id] = inp.checked;
      });
      try { localStorage.setItem(KEY, JSON.stringify(out)); } catch (e) {}
    }
    inputs.forEach(function(inp) {
      var id = inp.getAttribute('data-id');
      if (saved[id]) { inp.checked = true; inp.closest('li').classList.add('checked'); }
      inp.addEventListener('change', function() {
        var li = inp.closest('li');
        if (inp.checked) li.classList.add('checked'); else li.classList.remove('checked');
        save();
      });
    });
  })();
  </script>

  <div class="conclusion-box">
    <strong>Conclusion.</strong> We received an average rating of 4.4/5. The feedbacks that were consistent through the team were to change the leaderboard structure and better objective navigations. Teams also suggested on adding more directions to our game so that the players actually know where to go. Many teams also pointed out that we might have a bit too much UI inour games, and it would be good to reduce the amount of screens in our game. Teams also suggested centralizing the leaderboard and maybe adding easter eggs to the game so the process doesn't feel as repetitive. Matchmakers suggested that we should have more cryptocurrency lessons. All of us are working on these suggestions, and we already completed the leaderboard centralization suggestion and easter eggs suggestion.
  </div>
</div>
