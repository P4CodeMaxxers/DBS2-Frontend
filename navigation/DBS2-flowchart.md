---
layout: page
title: "DBS2 Presentation Flowchart"
permalink: /DBS2/flowchart
---

<style>
.dbs2-flow-wrapper {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.dbs2-flow-intro {
  margin-bottom: 1.5rem;
  max-width: 52rem;
}

.dbs2-flow-grid {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 52rem;
  margin: 0 auto;
}

.dbs2-flow-step {
  position: relative;
  padding-left: 3rem;
}

.dbs2-flow-step::before {
  content: attr(data-step);
  position: absolute;
  left: 0.9rem;
  top: 0.9rem;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 999px;
  background: #22c55e;
  color: #020617;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25), 0 8px 18px rgba(34, 197, 94, 0.55);
}

.dbs2-flow-step::after {
  content: "";
  position: absolute;
  left: 1.7rem;
  top: 2.5rem;
  bottom: -1.3rem;
  width: 2px;
  background: linear-gradient(to bottom, rgba(148, 163, 184, 0.9), rgba(148, 163, 184, 0));
}

.dbs2-flow-step:last-child::after {
  display: none;
}

@media (max-width: 960px) {
  .dbs2-flow-step {
    padding-left: 2.6rem;
  }

  .dbs2-flow-step::before {
    left: 0.7rem;
  }

  .dbs2-flow-step::after {
    left: 1.5rem;
  }
}

.dbs2-flow-card {
  position: relative;
  padding: 1rem 1.1rem;
  border-radius: 0.75rem;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.6);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.7);
}

.dbs2-flow-card h3 {
  margin-top: 0;
  margin-bottom: 0.35rem;
  font-size: 1rem;
}

.dbs2-flow-card p {
  margin: 0;
  font-size: 0.9rem;
}

.dbs2-flow-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.7);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dbs2-flow-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
}

.dbs2-flow-arrow {
  margin: 0.25rem 0;
  font-size: 0.8rem;
  color: #9ca3af;
}

.dbs2-flow-list {
  margin: 0.3rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.88rem;
}

.dbs2-flow-list li {
  margin: 0.1rem 0;
}
</style>

<div class="dbs2-flow-wrapper">
  <div class="dbs2-flow-intro">
    <span class="dbs2-flow-tag">
      <span class="dbs2-flow-tag-dot"></span>
      DBS2 Presentation Map
    </span>
    <p style="margin-top:0.75rem;">
      Use this page during your presentation to walk through everything you built in DBS2:
      the main building, each minigame, and how the backend, Postman, and crypto system all connect.
    </p>
  </div>

  <div class="dbs2-flow-grid">
    <div class="dbs2-flow-step" data-step="1">
      <div class="dbs2-flow-card">
        <h3>1. DBS2 Overview → Built Building</h3>
        <p class="dbs2-flow-arrow">You start here.</p>
        <ul class="dbs2-flow-list">
          <li>What DBS2 is and why we made it.</li>
          <li>Show the main building / hub that connects everything.</li>
        </ul>
      </div>
    </div>

    <div class="dbs2-flow-step" data-step="2">
      <div class="dbs2-flow-card">
        <h3>2. Minigame Concepts (each person)</h3>
        <p class="dbs2-flow-arrow">Overview of all games in the building.</p>
        <ul class="dbs2-flow-list">
          <li>Ashtrail – book-chasing / movement game.</li>
          <li>Laundry Game – task and timing game.</li>
          <li>Whack-a-Rat – reaction game.</li>
          <li>Infinite Users – scaling and logic challenge.</li>
          <li>Crypto Mining – earn in-game crypto.</li>
        </ul>
      </div>
    </div>

    <div class="dbs2-flow-step" data-step="3">
      <div class="dbs2-flow-card">
        <h3>3. For each minigame</h3>
        <p class="dbs2-flow-arrow">Repeat this pattern for all five games.</p>
        <ul class="dbs2-flow-list">
          <li><strong>Original inspiration</strong> – where the idea came from.</li>
          <li><strong>Process of development</strong> – design → prototype → testing → polish.</li>
        </ul>
      </div>
    </div>

    <div class="dbs2-flow-step" data-step="4">
      <div class="dbs2-flow-card">
        <h3>4. Postman and APIs</h3>
        <p class="dbs2-flow-arrow">Connect minigames to real data.</p>
        <ul class="dbs2-flow-list">
          <li>Learning HTTP methods: GET, POST, PUT.</li>
          <li>Building a Postman collection with requests for each minigame.</li>
          <li>Using Postman to test crypto and score updates to the backend.</li>
        </ul>
      </div>
    </div>

    <div class="dbs2-flow-step" data-step="5">
      <div class="dbs2-flow-card">
        <h3>5. Backend Integration</h3>
        <p class="dbs2-flow-arrow">How the game talks to the server.</p>
        <ul class="dbs2-flow-list">
          <li>Admin panel to monitor and control game data.</li>
          <li>Inventory system for items players collect.</li>
          <li>Crypto counter to track total crypto per player.</li>
        </ul>
      </div>
    </div>

    <div class="dbs2-flow-step" data-step="6">
      <div class="dbs2-flow-card">
        <h3>6. Crypto Rules and Data Flow</h3>
        <p class="dbs2-flow-arrow">Tie it all together and wrap up.</p>
        <ul class="dbs2-flow-list">
          <li>Each minigame rewards about 15–50 crypto.</li>
          <li>Goal: reach 250 crypto to escape.</li>
          <li>Frontend sends new crypto / inventory to backend after each run.</li>
          <li>Data can be changed by Postman and is shown on leaderboards and inventory.</li>
          <li>Finish with what you learned from building DBS2.</li>
        </ul>
      </div>
    </div>
  </div>
</div>


