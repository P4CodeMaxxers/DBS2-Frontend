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
        <form id="signupForm">
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
    import { pythonURI, getHeaders } from '{{site.baseurl}}/assets/js/api/config.js';

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
        console.log("Login endpoint:", `${pythonURI}/api/authenticate`);
        console.log("Username:", loginData.uid);

        try {
            const response = await fetch(`${pythonURI}/api/authenticate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                mode: "cors",
                body: JSON.stringify(loginData)
            });

            console.log("Response status:", response.status);
            console.log("Response headers:", [...response.headers.entries()]);

            if (!response.ok) {
                let errorMessage = `Authentication failed (${response.status})`;
                try {
                    const errorData = await response.json();
                    console.log("Error data:", errorData);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    const errorText = await response.text();
                    console.log("Error text:", errorText);
                    if (errorText) errorMessage = errorText;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log("=== LOGIN SUCCESSFUL ===");
            console.log("Full response:", data);
            console.log("Token in response?", data.token ? "YES" : "NO");
            console.log("Token value:", data.token);

            // Store the token in localStorage
            if (data.token) {
                localStorage.setItem('jwt_token', data.token);
                console.log("Token stored in localStorage");
                console.log("Verify storage:", localStorage.getItem('jwt_token'));
            } else {
                console.error("NO TOKEN IN RESPONSE!");
            }

            // Wait 2 seconds so we can see the Network request
            console.log("Waiting 2 seconds before redirect...");
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Redirect to home on success
            console.log("Redirecting now...");
            window.location.href = '{{site.baseurl}}/DBS2';

        } catch (error) {
            console.error("=== LOGIN ERROR ===");
            console.error("Error type:", error.name);
            console.error("Error message:", error.message);
            console.error("Full error:", error);
            
            messageEl.style.color = "red";
            
            if (error.message.includes("Failed to fetch")) {
                messageEl.textContent = "Cannot connect to server. Check if backend is running and CORS is configured.";
            } else if (error.message.includes("401")) {
                messageEl.textContent = "Invalid username or password. Please check your credentials.";
            } else {
                messageEl.textContent = error.message;
            }
            
            loginButton.disabled = false;
        }
    });

    // Signup Form Handler
    document.getElementById('signupForm').addEventListener('submit', async (event) => {
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

        console.log("=== SIGNUP ATTEMPT ===");
        console.log("Backend URI:", pythonURI);
        console.log("Signup endpoint:", `${pythonURI}/api/user`);
        console.log("Username:", signupData.uid);
        console.log("Email:", signupData.email);

        try {
            const response = await fetch(`${pythonURI}/api/user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                mode: "cors",
                body: JSON.stringify(signupData)
            });

            console.log("Response status:", response.status);
            console.log("Response headers:", [...response.headers.entries()]);

            if (!response.ok) {
                let errorMessage = `Signup failed (${response.status})`;
                try {
                    const errorData = await response.json();
                    console.log("Error data:", errorData);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    const errorText = await response.text();
                    console.log("Error text:", errorText);
                    if (errorText) errorMessage = errorText;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log("Signup successful! Response:", data);
            
            messageEl.style.color = "green";
            messageEl.textContent = "Signup successful! You can now log in with your credentials.";
            
            // Clear form
            document.getElementById("signupForm").reset();

        } catch (error) {
            console.error("=== SIGNUP ERROR ===");
            console.error("Error type:", error.name);
            console.error("Error message:", error.message);
            console.error("Full error:", error);
            
            messageEl.style.color = "red";
            
            if (error.message.includes("Failed to fetch")) {
                messageEl.textContent = "Cannot connect to server. Check if backend is running and CORS is configured.";
            } else {
                messageEl.textContent = error.message;
            }
        } finally {
            signupButton.disabled = false;
        }
    });
</script>