<?php
// Optimized Admin Actions for InfinityFree Hosting
// Handles heavy operations server-side to prevent 502 Bad Gateway (Entry Process Limits)

session_start();
session_write_close(); // Prevent session locking
set_time_limit(300);   // Prevent execution timeout

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$root = __DIR__ . '/../';

if ($action === 'complete_all') {
    $coursesFile = $root . 'courses.json';
    
    if (!file_exists($coursesFile)) {
        echo json_encode(['error' => 'courses.json not found']);
        exit;
    }
    
    $courses = json_decode(file_get_contents($coursesFile), true);
    $results = [];
    
    if (is_array($courses)) {
        foreach ($courses as $course) {
            $courseFile = $root . $course['id'] . '.json';
            if (file_exists($courseFile)) {
                $results[] = json_decode(file_get_contents($courseFile), true);
            }
        }
    }
    
    echo json_encode($results);
    exit;
}
?>