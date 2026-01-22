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

// Function to get headers with token
export function getHeaders() {
    const token = localStorage.getItem('jwt_token');
    const headers = {
        'Content-Type': 'application/json',
        'X-Origin': 'client'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export const fetchOptions = {
    method: 'GET',
    mode: 'cors',
    cache: 'default',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'X-Origin': 'client'
    }
};

// User Login Function
export function login(options) {
    const requestOptions = {
        ...fetchOptions,
        method: options.method || 'POST',
        headers: getHeaders(), // Use the function to get headers with token
        body: options.method === 'POST' ? JSON.stringify(options.body) : undefined
    };

    document.getElementById(options.message).textContent = "";

    console.log('[Login] Attempting to fetch:', options.URL);
    console.log('[Login] Request options:', requestOptions);

    fetch(options.URL, requestOptions)
        .then(response => {
            if (!response.ok) {
                const errorMsg = 'Login error: ' + response.status;
                console.log(errorMsg);
                document.getElementById(options.message).textContent = errorMsg;
                return;
            }
            options.callback();
        })
        .catch(error => {
            console.error('[Login] Fetch error details:', {
                error: error.message,
                url: options.URL,
                type: error.name,
                stack: error.stack
            });
            const errorMsg = `CORS or service error: ${error.message}. URL: ${options.URL}`;
            console.log('Possible CORS or Service Down error: ' + error);
            document.getElementById(options.message).textContent = errorMsg;
        });
}