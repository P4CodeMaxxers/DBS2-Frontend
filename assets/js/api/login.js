/**
 * login.js - Authentication handler
 * Uses cookies for JWT authentication (not localStorage)
 */

import { baseurl, pythonURI, fetchOptions, getHeaders } from './config.js';

console.log("login.js loaded");

document.addEventListener('DOMContentLoaded', function() {
    console.log("Base URL:", baseurl);
    getCredentials(baseurl)
        .then(data => {
            console.log("Credentials data:", data);
            const loginArea = document.getElementById('loginArea');
            if (!loginArea) return;
            
            if (data) {
                loginArea.innerHTML = `
                    <div class="dropdown">
                        <button class="dropbtn">${data.name}</button>
                        <div class="dropdown-content hidden">
                            ${
                                data.roles && Array.isArray(data.roles) && data.roles.length > 0
                                    ? `<div class="roles-list" style="padding: 8px 16px; color: #888; font-size: 0.95em;">
                                        Roles: ${data.roles.map(role => role.name).join(", ")}
                                       </div>
                                       <hr style="margin: 4px 0;">`
                                    : ''
                            }
                            <a href="${baseurl}/profile">Profile</a>
                            <a href="#" id="logoutLink">Logout</a>
                        </div>
                    </div>
                `;

                const dropdownButton = loginArea.querySelector('.dropbtn');
                const dropdownContent = loginArea.querySelector('.dropdown-content');
                const logoutLink = loginArea.querySelector('#logoutLink');

                dropdownButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    dropdownContent.classList.toggle('hidden');
                });

                document.addEventListener('click', (event) => {
                    if (!dropdownButton.contains(event.target) && !dropdownContent.contains(event.target)) {
                        dropdownContent.classList.add('hidden');
                    }
                });

                // Handle logout
                if (logoutLink) {
                    logoutLink.addEventListener('click', async (event) => {
                        event.preventDefault();
                        await handleLogout();
                        window.location.href = `${baseurl}/login`;
                    });
                }
            } else {
                loginArea.innerHTML = `<a href="${baseurl}/login">Login</a>`;
            }
            loginArea.style.opacity = "1";
        })
        .catch(err => {
            console.error("Error fetching credentials: ", err);
            const loginArea = document.getElementById('loginArea');
            if (loginArea) {
                loginArea.innerHTML = `<a href="${baseurl}/login">Login</a>`;
            }
        });
});

/**
 * Get current user credentials from the backend
 * Uses cookies for authentication (credentials: 'include')
 */
function getCredentials(baseurl) {
    const URL = pythonURI + '/api/id';

    return fetch(URL, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',  // Send cookies with request
        headers: getHeaders()
    })
    .then(response => {
        if (response.status === 401) {
            console.log("Not authenticated or session expired");
            return null;
        }

        if (!response.ok) {
            console.warn("HTTP status code:", response.status);
            return null;
        }

        return response.json();
    })
    .catch(err => {
        console.error("Fetch error:", err);
        return null;
    });
}

/**
 * Handle user logout
 * Clears the JWT cookie by calling the backend DELETE endpoint
 */
async function handleLogout() {
    try {
        await fetch(pythonURI + '/api/authenticate', {
            method: 'DELETE',
            mode: 'cors',
            credentials: 'include',  // Include cookies so backend can invalidate
            headers: getHeaders()
        });
        console.log("Logged out successfully");
    } catch (e) {
        console.error('Logout failed:', e);
    }
}

/**
 * Check if user is logged in
 * @returns {Promise<boolean>}
 */
export async function isLoggedIn() {
    try {
        const response = await fetch(pythonURI + '/api/id', {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: getHeaders()
        });
        return response.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Get current user data
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
    try {
        const response = await fetch(pythonURI + '/api/id', {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: getHeaders()
        });
        if (!response.ok) return null;
        return response.json();
    } catch (e) {
        return null;
    }
}

export { handleLogout, getCredentials };