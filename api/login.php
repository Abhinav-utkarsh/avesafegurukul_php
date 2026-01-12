<?php
session_name('AVESAFE_SESSION');
session_set_cookie_params(0, '/');
session_start();
require_once 'config.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(['error' => 'Email and password required']);
    exit;
}

$data = json_encode(['email' => $email, 'password' => $password, 'returnSecureToken' => true]);

$ch = curl_init(FIREBASE_AUTH_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);

if ($httpCode === 200 && isset($result['idToken'])) {
    $_SESSION['user_email'] = $result['email'];
    $_SESSION['user_id'] = $result['localId'];
    $_SESSION['display_name'] = $result['displayName'] ?? explode('@', $result['email'])[0];
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => $result['error']['message'] ?? 'Login failed']);
}
?>
