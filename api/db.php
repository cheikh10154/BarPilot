<?php
// BarPilot - Database Connection Wrapper (PostgreSQL / Supabase / MySQL / SQLite)
header('Content-Type: application/json; charset=utf-8');

$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbPort = getenv('DB_PORT') ?: '5432';
$dbName = getenv('DB_NAME') ?: 'barpilot_db';
$dbUser = getenv('DB_USER') ?: 'postgres';
$dbPass = getenv('DB_PASS') ?: '';
$dbDriver = getenv('DB_DRIVER') ?: 'pgsql'; // 'pgsql', 'mysql' or 'sqlite'

try {
    if ($dbDriver === 'sqlite') {
        $pdo = new PDO("sqlite:" . __DIR__ . "/barpilot.sqlite");
    } elseif ($dbDriver === 'mysql') {
        $pdo = new PDO("mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass);
    } else {
        $pdo = new PDO("pgsql:host={$dbHost};port={$dbPort};dbname={$dbName}", $dbUser, $dbPass);
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // If DB is offline, provide mock fallback response
    $pdo = null;
}

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
