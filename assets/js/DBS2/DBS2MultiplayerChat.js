/**
 * DBS2 Multiplayer Chat
 * WebSocket-based live chat for players in the basement.
 * Follows the teacher's WebSocket article: connect, send, receive broadcast.
 */
import { websocketURI } from '../api/config.js';

const MAX_MESSAGES = 50;
const PANEL_ID = 'dbs2-multiplayer-chat';
const STYLE_ID = 'dbs2-multiplayer-chat-style';

let ws = null;
let messageList = [];
let panel = null;
let isMinimized = true;

function getPlayerName() {
    if (window.DBS2API?.getPlayer) {
        return window.DBS2API.getPlayer().then(p => p?.user_info?.name || p?.user?.name || getGuestId()).catch(() => getGuestId());
    }
    return Promise.resolve(getGuestId());
}

function getGuestId() {
    const key = 'dbs2_guest_id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = 'Guest_' + Math.random().toString(36).slice(2, 8);
        localStorage.setItem(key, id);
    }
    return id;
}

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        #${PANEL_ID} {
            position: fixed;
            bottom: 12px;
            right: 12px;
            width: 280px;
            max-height: 200px;
            background: rgba(20, 25, 35, 0.95);
            border: 1px solid rgba(0, 255, 163, 0.3);
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 15000;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        #${PANEL_ID}.minimized {
            max-height: 36px;
        }
        #${PANEL_ID} .chat-header {
            padding: 8px 10px;
            background: rgba(0, 255, 163, 0.15);
            color: #0a5;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #${PANEL_ID} .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
            max-height: 140px;
        }
        #${PANEL_ID} .chat-message {
            margin-bottom: 6px;
            padding: 4px 6px;
            border-radius: 4px;
            background: rgba(255,255,255,0.05);
        }
        #${PANEL_ID} .chat-message .name { color: #0af; font-weight: bold; }
        #${PANEL_ID} .chat-message .text { color: #ccc; }
        #${PANEL_ID} .chat-message.system .text { color: #888; font-style: italic; }
        #${PANEL_ID} .chat-input-row {
            padding: 6px 8px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        #${PANEL_ID} input {
            width: 100%;
            padding: 6px 8px;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(0, 255, 163, 0.3);
            border-radius: 4px;
            color: #fff;
            font-size: 12px;
        }
    `;
    document.head.appendChild(style);
}

function addMessage(data) {
    const msg = typeof data === 'string' ? { type: 'chat', name: 'System', text: data } : data;
    messageList.push(msg);
    if (messageList.length > MAX_MESSAGES) messageList.shift();
    renderMessages();
}

function renderMessages() {
    const container = panel?.querySelector('.chat-messages');
    if (!container) return;
    container.innerHTML = messageList.map(m => {
        const cls = m.type === 'system' ? 'system' : '';
        return `<div class="chat-message ${cls}"><span class="name">${escapeHtml(m.name || '?')}:</span> <span class="text">${escapeHtml(m.text || '')}</span></div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

function createPanel() {
    if (document.getElementById(PANEL_ID)) return document.getElementById(PANEL_ID);
    injectStyles();
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'minimized';
    panel.innerHTML = `
        <div class="chat-header" title="Click to expand/collapse">
            <span>💬 DBS2 Chat</span>
            <span id="dbs2-chat-status">○</span>
        </div>
        <div class="chat-messages"></div>
        <div class="chat-input-row">
            <input type="text" id="dbs2-chat-input" placeholder="Type to chat with players..." maxlength="200" />
        </div>
    `;
    document.body.appendChild(panel);

    panel.querySelector('.chat-header').onclick = () => {
        isMinimized = !isMinimized;
        panel.classList.toggle('minimized', isMinimized);
    };

    const input = panel.querySelector('#dbs2-chat-input');
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            sendMessage(input.value.trim());
            input.value = '';
        }
    };

    return panel;
}

function sendMessage(text) {
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;
    getPlayerName().then(name => {
        ws.send(JSON.stringify({ name, text }));
    });
}

function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    const url = websocketURI || 'ws://localhost:8765';
    try {
        ws = new WebSocket(url);
        updateStatus('○');

        ws.onopen = () => {
            console.log('[DBS2 Chat] Connected to WebSocket server');
            updateStatus('●');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                addMessage(data);
            } catch {
                addMessage({ type: 'system', text: event.data });
            }
        };

        ws.onclose = () => {
            console.log('[DBS2 Chat] Disconnected');
            updateStatus('○');
            addMessage({ type: 'system', name: 'System', text: 'Disconnected. Reconnecting...' });
            setTimeout(connect, 3000);
        };

        ws.onerror = () => {
            updateStatus('○');
        };
    } catch (e) {
        console.warn('[DBS2 Chat] WebSocket error:', e);
        addMessage({ type: 'system', text: 'Could not connect to chat server.' });
    }
}

function updateStatus(symbol) {
    const el = document.getElementById('dbs2-chat-status');
    if (el) el.textContent = symbol;
}

export function init() {
    createPanel();
    connect();
}

export default { init };
