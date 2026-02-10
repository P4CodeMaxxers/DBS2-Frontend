---
layout: post
title: "DBS2 AshTrail: Leaderboard, Replay, Marketplace, and Multiplayer Chat (Create PT Skill B)"
categories: dbs2 ashtrail collegeboard
author: Cyrus
tags: [DBS2, AshTrail, CreatePT, SkillB, Flask, JavaScript, WebSockets]
---

## Program purpose and overall design

For my College Board Create Performance Task (Skill B), I extended the **DBS2** project with the **AshTrail** platformer experience. The purpose of my program is to teach crypto and CS concepts through a basement game where players:

- Play the **AshTrail** level in the DBS2 basement.
- Compete on a **global leaderboard** backed by a Flask API.
- Re-watch runs using a **replay system**.
- Spend earned in-game currency in a **marketplace** UI.
- Chat with other players in real time using a **multiplayer WebSocket chatbox**.

The system is split into:

- **Frontend (`DBS2-Frontend`)** – JavaScript game engine, HUD, leaderboard, replay controls, marketplace, and chat panel.
- **Backend (`DBS2-Backend`)** – Flask API that stores runs and marketplace data, plus a separate WebSocket server for live chat.

Users provide **input** with keyboard controls (WASD, space, E), UI buttons (Replay, Play Again, Buy), and chat messages. The program produces **output** by rendering the game canvas, updating the leaderboard, showing marketplace state, and streaming chat messages.

---

## Data abstraction: lists and run schema

Instead of hard‑coded values, my backend uses a **list of run objects** to represent AshTrail games that users finish. A simplified Python representation of this data structure looks like:

```python
ashtrail_runs = [
    {
        "id": 123,
        "user_id": 42,
        "username": "Cyrus",
        "time_ms": 95432,
        "coins_collected": 37,
        "died": False,
        "replay_data": "...compressed input stream...",
        "created_at": "2026-02-09T15:21:00Z",
    },
    # more run objects appended over time...
]
```

This **list** is not hard coded. Each time a player finishes AshTrail, the frontend sends a **POST** request, and the backend appends a new object into `ashtrail_runs`. This single abstraction lets me:

- Store any number of runs per player.
- Compute each player’s **best** performance.
- Power the **replay** system (via `replay_data`).
- Generate the JSON for the **leaderboard** endpoint.

Because all related data (user, time, coins, replay) live together in each object, my later logic can be written on top of a single list instead of many separate variables.

---

## Frontend: input and output for AshTrail

### Game input

On the frontend, users interact with the AshTrail game through:

- **Keyboard** – movement (A/D), jumping (space), and interact (E).
- **Mouse / touch** – clicking buttons such as **Replay**, **Play Again**, and marketplace items.
- **Text** – typing into the DBS2 multiplayer chatbox.

An example of input handling in the front‑end game loop is:

```javascript
window.addEventListener('keydown', (event) => {
  if (event.key === 'a') player.moveLeft();
  if (event.key === 'd') player.moveRight();
  if (event.key === ' ') player.jump();
});
```

### Visual output

The program responds by:

- Drawing the **AshTrail level** on a HTML5 canvas.
- Showing a **HUD** with time and coins for the current run.
- Rendering the **AshTrail leaderboard panel** with ranked players.
- Displaying the **marketplace UI** using live prices from the backend.
- Updating a **DBS2 Chat** panel with system and player messages.

For example, rendering the leaderboard from a list of entries on the frontend looks like:

```javascript
function renderAshTrailLeaderboard(entries) {
  const container = document.getElementById('ashtrail-leaderboard');
  container.innerHTML = '';
  entries.forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';
    row.textContent =
      `#${index + 1} ${entry.username} – ${(entry.best_time_ms / 1000).toFixed(2)}s`;
    container.appendChild(row);
  });
}
```

---

## Backend procedure for POSTing a completed run

When a player finishes a run, the frontend sends a **POST** request. That single request carries both **input** and **output** for my Create PT requirement:

- **Input**: the user’s time, coins collected, whether they died, and recorded replay data.
- **Output**: the updated AshTrail leaderboard.

Example request from the frontend:

```javascript
async function submitAshTrailRun(runData) {
  const response = await fetch(`${pythonURI}/api/ashtrail/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(runData),
  });
  return await response.json();
}
```

Where `runData` might look like:

```json
{
  "time_ms": 95432,
  "coins": 37,
  "replay_data": "compressed-input-stream",
  "died": false
}
```

On the backend, my core procedure (simplified) that satisfies Skill B and the Create PT algorithm requirement is:

```python
def record_ashtrail_run(user_id, username, time_ms, coins, died, replay_data):
    """
    Purpose: store a new AshTrail run, update that user’s best record,
    and return the updated leaderboard.
    """
    # 1. Create a run object (sequencing)
    new_run = {
        "id": generate_run_id(),
        "user_id": user_id,
        "username": username,
        "time_ms": time_ms,
        "coins_collected": coins,
        "died": died,
        "replay_data": replay_data,
    }

    # 2. Append to the shared list (data abstraction)
    ashtrail_runs.append(new_run)

    # 3. Compute each user’s best run (iteration + selection)
    best_by_user = {}
    for run in ashtrail_runs:  # iteration over the list
        name = run["username"]
        current_best = best_by_user.get(name)
        if current_best is None or run["time_ms"] < current_best["time_ms"]:
            # selection: only keep faster times
            best_by_user[name] = run

    # 4. Build and sort a leaderboard
    leaderboard = sorted(
        [
            {
                "username": name,
                "best_time_ms": run["time_ms"],
                "best_coins": run["coins_collected"],
            }
            for name, run in best_by_user.items()
        ],
        key=lambda entry: entry["best_time_ms"],
    )

    # 5. Return leaderboard as the POST response
    return leaderboard
```

### Algorithm explanation (Create PT style)

- **Sequencing** – The procedure creates the run, appends it, computes bests, sorts, and finally returns the leaderboard. Each step must happen in order.
- **Selection** – The `if current_best is None or run["time_ms"] < current_best["time_ms"]` line chooses whether to replace the stored best run when a faster time appears.
- **Iteration** – The `for run in ashtrail_runs` loop walks through every element in the `ashtrail_runs` list so the algorithm can compare the new run against all previous runs for that player.

By relying on the `ashtrail_runs` list abstraction, this logic stays simple and re‑usable throughout my project.

---

## Replay feature: reconstructing a run from stored data

The replay feature uses the `replay_data` field in each run entry. When a player clicks **Replay** on a leaderboard row:

1. The frontend requests run details (by `id`) from the backend.
2. The backend returns the same `replay_data` that was stored when the run finished.
3. The game engine switches into a replay mode and steps through each input event.

Conceptually, the frontend uses code like:

```javascript
function playReplay(replayData) {
  const events = decodeReplay(replayData); // list of { time, action }
  resetGameToStart();
  let index = 0;

  function step(timestamp) {
    while (index < events.length && events[index].time <= timestamp) {
      applyAction(events[index].action); // move, jump, etc.
      index++;
    }
    updateGame();
    renderGame();
    if (!replayOver()) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
```

Here I again rely on a **list** of input events and **iteration** with a loop to recreate the entire path the player took through the level.

---

## Marketplace UI: list‑driven purchasing

The **AshTrail marketplace** UI is another example of Skill B style logic:

- Backend route (for example `/api/market/items`) returns a **list** of items:

  ```json
  [
    { "id": 1, "name": "Double Jump Upgrade", "price": 50 },
    { "id": 2, "name": "Speed Boots", "price": 40 }
  ]
  ```

- Frontend renders this list into responsive cards.
- When the user clicks **Buy**, the frontend sends a POST with `{ "item_id": 1 }`.
- Backend selection logic checks if the user has enough currency in their **inventory list**; only then does it subtract the price and update the stored inventory before returning the new balance as output.

This shows another real use of data structures and logic rather than hard‑coded items.

---

## Multiplayer chatbox (WebSockets)

The DBS2 multiplayer chatbox is a supporting feature that encourages collaboration:

- **Frontend**:
  - Connects to `websocketURI` using the JavaScript `WebSocket` API.
  - Sends JSON messages like `{ "name": "Cyrus", "text": "gg run!" }`.
  - Stores messages in a `messageList` array and re‑renders the UI whenever a new message arrives.

- **Backend WebSocket server**:
  - Tracks `connected` clients and a `message_history` list.
  - When a message is received, it appends to `message_history` and iterates over all clients to broadcast the new chat.

Although chat is not the main scoring feature for my Create PT, it demonstrates another complete input/output loop using lists and loops.

---

## Testing and reflection

To verify correctness, I tested several scenarios:

- **Run submission** – posting a completed run should move my username to the correct place on the AshTrail leaderboard and never promote a slower time above a faster one.
- **Replay** – the replayed path and final time match the original run values stored in `ashtrail_runs`.
- **Marketplace** – buying an item only succeeds if the backend selection logic sees enough in‑game currency, and the UI updates my balance correctly.
- **Chatbox** – with two browser windows open, messages typed in one appear in the other, confirming that the WebSocket broadcast loop and `messageList` rendering work together.

Designing AshTrail this way let me meet the **College Board Create PT Skill B** requirements directly on a real project: I use lists as data abstractions, I wrote clear procedures operating on those lists, and I implemented algorithms that rely on sequencing, selection, and iteration to power a live game, leaderboard, replay, marketplace, and chat system inside DBS2.

