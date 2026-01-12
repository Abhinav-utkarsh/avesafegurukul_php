<?php
// Prevent direct access
if (basename($_SERVER['PHP_SELF']) === 'config.php') {
    header("HTTP/1.0 403 Forbidden");
    exit;
}

// Configuration - REPLACE WITH YOUR REAL FIREBASE API KEY
define('FIREBASE_API_KEY', 'YOUR_FIREBASE_API_KEY_HERE');
define('FIREBASE_AUTH_URL', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' . FIREBASE_API_KEY);
define('FIREBASE_REGISTER_URL', 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' . FIREBASE_API_KEY);
