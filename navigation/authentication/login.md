---
layout: page
title: Login
permalink: /login
search_exclude: true
show_reading_time: false
---
<style>
    .submit-button {
        width: 100%;
        transition: all 0.3s ease;
        position: relative;
    }
    .login-container {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        flex-wrap: nowrap;
    }

    .login-card,
    .signup-card {
        flex: 1 1 calc(50% - 20px);
        max-width: 45%;
        box-sizing: border-box;
        background: #1e1e1e;
        border-radius: 15px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        padding: 20px;
        color: white;
        overflow: hidden;
    }

    .login-card h1 {
        margin-bottom: 20px;
    }

    .signup-card h1 {
        margin-bottom: 20px;
    }

    .form-group {
        position: relative;
        margin-bottom: 1.5rem;
    }

    input {
        width: 100%;
        box-sizing: border-box;
    }
</style>
<br>
<div class="login-container">
    <!-- Login Form -->
    <div class="login-card">
        <h1 id="pythonTitle">User Login</h1>
        <hr>
        <form id="pythonForm">
            <div class="form-group">
                <input type="text" id="uid" placeholder="Username" required>
            </div>
            <div class="form-group">
                <input type="password" id="password" placeholder="Password" required>
            </div>
            <p>
                <button type="submit" class="large primary submit-button">Login</button>
            </p>
            <p id="message" style="color: red;"></p>
        </form>
    </div>

    <!-- Signup Form -->
    <div class="signup-card">
        <h1 id="signupTitle">Sign Up</h1>
        <hr>
        <form id="signupForm">
            <div class="form-group">
                <input type="text" id="signupUid" placeholder="Username" required>
            </div>
            <div class="form-group">
                <input type="password" id="signupPassword" placeholder="Password (min 2 chars)" required>
            </div>
            <p>
                <button type="submit" class="large primary submit-button">Sign Up</button>
            </p>
            <p id="signupMessage" style="color: green;"></p>
        </form>
    </div>
</div>

<script type="module">
    import { pythonURI, getHeaders, setAuthToken } from '{{site.baseurl}}/assets/js/api/config.js';

    // Login Form Handler
    document.getElementById('pythonForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const messageEl = document.getElementById("message");
        const loginButton = document.querySelector(".login-card button");
        
        messageEl.textContent = "";
        loginButton.disabled = true;

        const loginData = {
            uid: document.getElementById("uid").value,
            password: document.getElementById("password").value,
        };

        console.log("=== LOGIN ATTEMPT ===");
        console.log("Backend URI:", pythonURI);

        try {
            const response = await fetch(`${pythonURI}/api/authenticate`, {
                method: "POST",
                mode: "cors",
                credentials: "include",  // IMPORTANT: Accept and store cookies
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                let errorMessage = `Authentication failed (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    const errorText = await response.text();
                    if (errorText) errorMessage = errorText;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log("=== LOGIN SUCCESSFUL ===");
            console.log("User:", data.user);
            
            // Store token in sessionStorage - works cross-origin (cookies often blocked)
            if (data.token) {
                setAuthToken(data.token);
            }
            
            messageEl.style.color = "green";
            messageEl.textContent = "Login successful! Redirecting...";
            
            // Redirect to game
            setTimeout(() => {
                window.location.href = '{{site.baseurl}}/DBS2';
            }, 500);

        } catch (error) {
            console.error("=== LOGIN ERROR ===");
            console.error("Error:", error.message);
            
            messageEl.style.color = "red";
            
            if (error.message.includes("Failed to fetch")) {
                messageEl.textContent = "Cannot connect to server. Check if backend is running.";
            } else if (error.message.includes("401")) {
                messageEl.textContent = "Invalid username or password.";
            } else {
                messageEl.textContent = error.message;
            }
            
            loginButton.disabled = false;
        }
    });

    // Signup Form Handler - Uses guest endpoint for simple signup
    document.getElementById('signupForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const signupButton = document.querySelector(".signup-card button");
        const messageEl = document.getElementById("signupMessage");
        
        signupButton.disabled = true;
        messageEl.textContent = "";

        const signupData = {
            uid: document.getElementById("signupUid").value,
            password: document.getElementById("signupPassword").value,
        };

        console.log("=== SIGNUP ATTEMPT ===");

        try {
            // Use guest signup endpoint for simplified registration
            const response = await fetch(`${pythonURI}/api/user/guest`, {
                method: "POST",
                mode: "cors",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(signupData)
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                let errorMessage = `Signup failed (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    const errorText = await response.text();
                    if (errorText) errorMessage = errorText;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log("Signup successful:", data);
            
            messageEl.style.color = "green";
            messageEl.textContent = "Account created! You can now log in.";
            
            // Clear form
            document.getElementById("signupForm").reset();
            
            // Auto-fill login form with new credentials
            document.getElementById("uid").value = signupData.uid;
            document.getElementById("password").value = signupData.password;

        } catch (error) {
            console.error("=== SIGNUP ERROR ===");
            console.error("Error:", error.message);
            
            messageEl.style.color = "red";
            
            if (error.message.includes("Failed to fetch")) {
                messageEl.textContent = "Cannot connect to server.";
            } else if (error.message.includes("duplicate") || error.message.includes("exists")) {
                messageEl.textContent = "Username already taken. Try a different one.";
            } else {
                messageEl.textContent = error.message;
            }
        } finally {
            signupButton.disabled = false;
        }
    });

    // Check if already logged in
    (async function checkAuth() {
        try {
            const response = await fetch(`${pythonURI}/api/id`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include'
            });
            
            if (response.ok) {
                const user = await response.json();
                console.log("Already logged in as:", user.name);
                // Optionally redirect to game
                // window.location.href = '{{site.baseurl}}/DBS2';
            }
        } catch (e) {
            // Not logged in, stay on login page
        }
    })();
</script>