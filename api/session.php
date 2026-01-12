<?php
session_name('AVESAFE_SESSION');
session_set_cookie_params(0, '/');
session_start();
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

$response = [];

if (isset($_SESSION['user_email'])) {
    $response['loggedIn'] = true;
    $response['email'] = $_SESSION['user_email'];
    $response['displayName'] = $_SESSION['display_name'] ?? 'User';
} else {
    $response['loggedIn'] = false;
}

echo json_encode($response);
?>
