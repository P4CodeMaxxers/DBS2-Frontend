/**
 * config.js - API Configuration
 * Uses JWT token in sessionStorage for cross-origin auth (cookies often blocked)
 */

export const baseurl = "/DBS2-Frontend";

// Key for JWT in sessionStorage - must match backend JWT_TOKEN_NAME (jwt_python_flask)
export const JWT_TOKEN_KEY = 'jwt_python_flask';

// Flask backend URI
export var pythonURI;
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    pythonURI = "http://localhost:8403";
} else {
    pythonURI = "https://dbs2.opencodingsociety.com";
}

console.log('[Config] Frontend hostname:', location.hostname);
console.log('[Config] Backend pythonURI:', pythonURI);

export var javaURI = pythonURI;

/**
 * Get headers for API requests - includes Authorization when token is present
 * Token from sessionStorage works cross-origin (cookies often blocked by browsers)
 */
export function getHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'X-Origin': 'client'
    };
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(JWT_TOKEN_KEY) : null;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

/** Store auth token after login (call from login page before redirect) */
export function setAuthToken(token) {
    if (token && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(JWT_TOKEN_KEY, token);
    }
}

/** Clear auth token on logout */
export function clearAuthToken() {
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(JWT_TOKEN_KEY);
    }
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