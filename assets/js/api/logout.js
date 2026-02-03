/**
 * logout.js - Logout handler
 */

import { pythonURI, javaURI, getHeaders, clearAuthToken } from './config.js';

// Try to import StatsManager for clearing local data
let clearLocalData = null;
try {
    const statsModule = await import('./StatsManager.js');
    clearLocalData = statsModule.clearLocalData;
} catch (e) {
    console.log('[logout] StatsManager not available');
}

/**
 * Handle user logout
 * Calls the DELETE endpoint which clears the JWT cookie
 */
export async function handleLogout() {
    // Clear DBS2 game state first
    if (clearLocalData) {
        try {
            clearLocalData();
            console.log('[logout] Cleared DBS2 local data');
        } catch (e) {
            console.error('[logout] Failed to clear DBS2 data:', e);
        }
    }
    
    // Logout from python backend (invalidates token) - send token before we clear it
    try {
        await fetch(pythonURI + '/api/authenticate', {
            method: 'DELETE',
            mode: 'cors',
            credentials: 'include',
            headers: getHeaders()  // Include Authorization so backend can invalidate
        });
        console.log('[logout] Logged out from Python backend');
    } catch (e) {
        console.error('[logout] Python logout failed:', e);
    }

    // Logout from java backend if applicable
    try {
        await fetch(javaURI + '/my/logout', {
            method: 'POST',
            mode: 'cors',
            credentials: 'include'
        });
        console.log('[logout] Logged out from Java backend');
    } catch (e) {
        // Java backend might not exist, ignore
    }
    
    // Clear auth token from sessionStorage
    clearAuthToken();
    
    // Clear any other localStorage items
    localStorage.removeItem('dbs2_intro_seen');
    
    // Clear any old format localStorage (migration cleanup)
    localStorage.removeItem('dbs2_local_state');
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