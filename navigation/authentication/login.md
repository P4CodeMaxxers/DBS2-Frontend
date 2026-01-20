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
        <form id="pythonForm" onsubmit="pythonLogin(event); return false;">
            <div class="form-group">
                <input type="text" id="uid" placeholder="GitHub ID" required>
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
        <form id="signupForm" onsubmit="signup(event); return false;">
            <div class="form-group">
                <input type="text" id="name" placeholder="Name" required>
            </div>
            <div class="form-group">
                <input type="text" id="signupUid" placeholder="GitHub ID" required>
            </div>
            <div class="form-group">
                <input type="text" id="signupEmail" placeholder="Email" required>
            </div>
            <div class="form-group">
                <input type="password" id="signupPassword" placeholder="Password" required>
            </div>
            <p>
                <label class="switch">
                    <span class="toggle">
                        <input type="checkbox" name="kasmNeeded" id="kasmNeeded">
                        <span class="slider"></span>
                    </span>
                    <span class="label-text">Kasm Server Needed</span>
                </label>
            </p>
            <p>
                <button type="submit" class="large primary submit-button">Sign Up</button>
            </p>
            <p id="signupMessage" style="color: green;"></p>
        </form>
    </div>
</div>

<script type="module">
    import { pythonURI, fetchOptions } from '{{site.baseurl}}/assets/js/api/config.js';

    // Login - Direct fetch without using the login() helper
    window.pythonLogin = async function (event) {
        event.preventDefault();
        
        const messageEl = document.getElementById("message");
        const loginButton = document.querySelector(".login-card button");
        
        // Clear previous messages
        messageEl.textContent = "";
        loginButton.disabled = true;

        const loginData = {
            uid: document.getElementById("uid").value,
            password: document.getElementById("password").value,
        };

        console.log("Attempting login with:", { uid: loginData.uid }); // Debug log (don't log password)

        try {
            const response = await fetch(`${pythonURI}/api/authenticate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(loginData)
            });

            console.log("Login response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Authentication failed: ${response.status}`);
            }

            const data = await response.json();
            console.log("Login successful:", data);

            // Redirect to profile on success
            window.location.href = '{{site.baseurl}}/profile';

        } catch (error) {
            console.error("Login Error:", error);
            messageEl.style.color = "red";
            messageEl.textContent = error.message || "Invalid username or password";
            loginButton.disabled = false;
        }
    }

    // Signup
    window.signup = async function (event) {
        event.preventDefault();
        
        const signupButton = document.querySelector(".signup-card button");
        const messageEl = document.getElementById("signupMessage");
        
        signupButton.disabled = true;
        messageEl.textContent = "";

        const signupData = {
            name: document.getElementById("name").value,
            uid: document.getElementById("signupUid").value,
            email: document.getElementById("signupEmail").value,
            password: document.getElementById("signupPassword").value,
            kasm_server_needed: document.getElementById("kasmNeeded").checked,
        };

        console.log("Attempting signup with:", { uid: signupData.uid, email: signupData.email });

        try {
            const response = await fetch(`${pythonURI}/api/user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(signupData)
            });

            console.log("Signup response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Signup failed: ${response.status}`);
            }

            const data = await response.json();
            console.log("Signup successful:", data);
            
            messageEl.style.color = "green";
            messageEl.textContent = "Signup successful! You can now log in.";
            
            // Clear form
            document.getElementById("signupForm").reset();

        } catch (error) {
            console.error("Signup Error:", error);
            messageEl.style.color = "red";
            messageEl.textContent = error.message || "Signup failed. Please try again.";
        } finally {
            signupButton.disabled = false;
        }
    }
</script>