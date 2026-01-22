/**
 * logout.js - Logout handler
 * Uses cookies for JWT authentication
 */

import { pythonURI, javaURI } from './config.js';

/**
 * Handle user logout
 * Calls the DELETE endpoint which clears the JWT cookie
 */
export async function handleLogout() {
    // Logout from python backend (clears cookie)
    try {
        await fetch(pythonURI + '/api/authenticate', {
            method: 'DELETE',
            mode: 'cors',
            credentials: 'include'  // Include cookies so backend can clear them
        });
        console.log('Logged out from Python backend');
    } catch (e) {
        console.error('Python logout failed:', e);
    }

    // Logout from java backend if applicable
    try {
        await fetch(javaURI + '/my/logout', {
            method: 'POST',
            mode: 'cors',
            credentials: 'include'
        });
        console.log('Logged out from Java backend');
    } catch (e) {
        // Java backend might not exist, ignore
    }
    
    // Clear any localStorage items (non-auth related)
    localStorage.removeItem('dbs2_intro_seen');
}

/**
 * Logout and redirect to login page
 * @param {string} redirectUrl - URL to redirect after logout
 */
export async function logoutAndRedirect(redirectUrl = '/login') {
    await handleLogout();
    window.location.href = redirectUrl;
}

// Make available globally
window.handleLogout = handleLogout;
window.logoutAndRedirect = logoutAndRedirect;