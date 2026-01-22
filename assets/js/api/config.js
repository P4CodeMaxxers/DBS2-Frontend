/**
 * config.js - API Configuration
 * Uses cookies for JWT authentication (not localStorage)
 */

export const baseurl = "/DBS2-Frontend";

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
 * Get headers for API requests
 * No longer includes Authorization header - cookies handle auth
 */
export function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-Origin': 'client'
    };
}

/**
 * Standard fetch options with credentials for cookie-based auth
 * credentials: 'include' ensures cookies are sent with cross-origin requests
 */
export const fetchOptions = {
    method: 'GET',
    mode: 'cors',
    cache: 'default',
    credentials: 'include',  // IMPORTANT: This sends cookies with requests
    headers: {
        'Content-Type': 'application/json',
        'X-Origin': 'client'
    }
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