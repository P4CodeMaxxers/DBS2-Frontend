/**
 * config.js - API Configuration
 * Uses JWT token in sessionStorage for cross-origin auth (cookies often blocked)
 */

export const baseurl = "/DBS2-Frontend";

// Key for JWT storage - must match backend JWT_TOKEN_NAME (jwt_python_flask)
export const JWT_TOKEN_KEY = 'jwt_python_flask';

/**
 * Detect the best available Web Storage bucket for auth tokens.
 * Prefer sessionStorage so the token clears with the tab, fall back to localStorage
 * when browsers disable sessionStorage (tracking protection / private browsing).
 */
function detectStorage() {
    if (typeof window === 'undefined') {
        return null;
    }

    const storagePriority = ['sessionStorage', 'localStorage'];
    for (const type of storagePriority) {
        try {
            const storage = window[type];
            if (!storage) continue;
            const testKey = '__dbs2_auth_test__';
            storage.setItem(testKey, '1');
            storage.removeItem(testKey);
            return { storage, type };
        } catch (err) {
            console.warn(`[Config] ${type} unavailable for auth token`, err?.message || err);
        }
    }

    console.warn('[Config] Web Storage unavailable; backend requests will rely on cookies only');
    return null;
}

const storageHandle = detectStorage();

// Flask backend URI
export var pythonURI;
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    pythonURI = "http://localhost:8403";
} else {
    pythonURI = "https://dbs2.opencodingsociety.com";
}

// WebSocket URI for DBS2 multiplayer chat (port 8765)
export var websocketURI;
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    websocketURI = "ws://localhost:8765";
} else {
    // Use wss for production (secure WebSocket)
    const host = "dbs2.opencodingsociety.com";
    websocketURI = (location.protocol === "https:" ? "wss://" : "ws://") + host + ":8765";
}

console.log('[Config] Frontend hostname:', location.hostname);
console.log('[Config] Backend pythonURI:', pythonURI);
console.log('[Config] WebSocket URI:', websocketURI);

export var javaURI = pythonURI;

function readAuthToken() {
    if (!storageHandle) {
        return null;
    }
    try {
        return storageHandle.storage.getItem(JWT_TOKEN_KEY);
    } catch (err) {
        console.warn('[Config] Unable to read auth token', err?.message || err);
        return null;
    }
}

function writeAuthToken(token) {
    if (!storageHandle) {
        return;
    }
    try {
        storageHandle.storage.setItem(JWT_TOKEN_KEY, token);
    } catch (err) {
        console.warn('[Config] Unable to persist auth token', err?.message || err);
    }
}

function removeStoredToken() {
    const stores = [];
    if (typeof window !== 'undefined') {
        if (window.sessionStorage) stores.push(window.sessionStorage);
        if (window.localStorage) stores.push(window.localStorage);
    }
    stores.forEach(store => {
        try {
            store.removeItem(JWT_TOKEN_KEY);
        } catch (err) {
            /* ignore */
        }
    });
}

/**
 * Get headers for API requests - includes Authorization when token is present
 * Token from sessionStorage works cross-origin (cookies often blocked by browsers)
 */
export function getHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'X-Origin': 'client'
    };
    const token = readAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export function getAuthToken() {
    return readAuthToken();
}

/** Store auth token after login (call from login page before redirect) */
export function setAuthToken(token) {
    if (!token) return;
    writeAuthToken(token);
}

/** Remove auth token from every available storage bucket */
export function clearAuthToken() {
    removeStoredToken();
}

/**
 * Standard fetch options - headers are dynamic (include Authorization when logged in)
 */
export const fetchOptions = {
    method: 'GET',
    mode: 'cors',
    cache: 'default',
    credentials: 'include',  // Send cookies as fallback
    get headers() { return getHeaders(); }
};

/**
 * Get fetch options for authenticated requests
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} body - Request body (optional)
 * @returns {object} Fetch options with credentials
 */
export function getAuthFetchOptions(method = 'GET', body = null) {
    const options = {
        method: method,
        mode: 'cors',
        cache: 'default',
        credentials: 'include',  // Send cookies with request
        headers: getHeaders()
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    return options;
}

/**
 * User Login Function (legacy support)
 */
export function login(options) {
    const requestOptions = {
        ...fetchOptions,
        method: options.method || 'POST',
        credentials: 'include',
        headers: getHeaders(),
        body: options.method === 'POST' ? JSON.stringify(options.body) : undefined
    };

    document.getElementById(options.message).textContent = "";

    console.log('[Login] Attempting to fetch:', options.URL);

    fetch(options.URL, requestOptions)
        .then(response => {
            if (!response.ok) {
                const errorMsg = 'Login error: ' + response.status;
                console.log(errorMsg);
                document.getElementById(options.message).textContent = errorMsg;
                return;
            }
            // Cookie is automatically set by the response
            options.callback();
        })
        .catch(error => {
            console.error('[Login] Fetch error:', error);
            const errorMsg = `Connection error: ${error.message}`;
            document.getElementById(options.message).textContent = errorMsg;
        });
}