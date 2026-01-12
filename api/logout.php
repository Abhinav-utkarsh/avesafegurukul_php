<?php
session_name('AVESAFE_SESSION');
session_set_cookie_params(0, '/');
session_start();
session_destroy();
header('Content-Type: application/json');
echo json_encode(['success' => true]);
?>
