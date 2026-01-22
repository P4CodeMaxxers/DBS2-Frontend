import { baseurl, pythonURI, fetchOptions, getHeaders } from './config.js';

console.log("login.js loaded");

document.addEventListener('DOMContentLoaded', function() {
    console.log("Base URL:", baseurl);
    getCredentials(baseurl)
        .then(data => {
            console.log("Credentials data:", data);
            const loginArea = document.getElementById('loginArea');
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
                            <a href="${baseurl}/logout">Logout</a>
                        </div>
                    </div>
                `;

                const dropdownButton = loginArea.querySelector('.dropbtn');
                const dropdownContent = loginArea.querySelector('.dropdown-content');

                dropdownButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    if (dropdownContent.classList.contains('hidden')) {
                        dropdownContent.classList.remove('hidden');
                    } else {
                        dropdownContent.classList.add('hidden');
                    }
                });

                document.addEventListener('click', (event) => {
                    if (!dropdownButton.contains(event.target) && !dropdownContent.contains(event.target)) {
                        dropdownContent.classList.add('hidden');
                    }
                });
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

    // REMOVED the duplicate login form handler that was causing the error
    // The login page (login.md) has its own inline handlers (pythonLogin and signup)
});

function getCredentials(baseurl) {
    const token = localStorage.getItem("token");

    // User is not logged in yet — this is NORMAL
    if (!token) {
        console.log("No token found, user not logged in");
        return Promise.resolve(null);
    }

    const URL = pythonURI + '/api/id';

    return fetch(URL, {
        method: 'GET',
    
        mode: 'cors',
        headers: {
            ...getHeaders(),
            "Authorization": `Bearer ${token}`,
        }
    })
    .then(response => {
        if (response.status === 401) {
            console.log("Token invalid or expired");
            localStorage.removeItem("token");
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
