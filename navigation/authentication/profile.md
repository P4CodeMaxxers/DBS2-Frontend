---
layout: none
title: Your Profile
permalink: /profile
---
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Redirecting to DBS2...</title>
    <script>
        // Instant redirect to DBS2 game
        window.location.href = "{{ site.baseurl }}/DBS2";
    </script>
    <style>
        body {
            background: #0d0d1a;
            color: #0a5;
            font-family: 'Courier New', monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
        }
        a {
            color: #0a5;
            text-decoration: none;
            padding: 15px 30px;
            border: 2px solid #0a5;
            display: inline-block;
            margin-top: 20px;
        }
        a:hover {
            background: #0a5;
            color: #000;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>REDIRECTING...</h1>
        <p>Taking you to Discord Basement Simulator 2</p>
        <a href="{{ site.baseurl }}/DBS2">Click here if not redirected</a>
    </div>
</body>
</html>