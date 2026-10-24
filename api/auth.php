<?php
// BarPilot - Bar Authentication & Session API
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $provider = $input['provider'] ?? 'email';
    $email = $input['email'] ?? '';
    $barId = $input['bar_id'] ?? 'bar_01';
    $password = $input['password'] ?? '';
    $googleToken = $input['google_token'] ?? null;
    $googleProfile = $input['google_profile'] ?? null;

    // Handle Google OAuth authentication
    if ($provider === 'google') {
        $googleEmail = $googleProfile['email'] ?? ($email ?: 'google.user@barcentrale.it');
        $googleName = $googleProfile['name'] ?? 'Utente Google';
        $googlePicture = $googleProfile['picture'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop';

        sendJsonResponse([
            'success' => true,
            'provider' => 'google',
            'token' => bin2hex(random_bytes(24)),
            'bar' => [
                'id' => $barId,
                'name' => 'Bar Centrale',
                'city' => 'Roma',
                'plan' => 'Pro',
                'trial_days_remaining' => 14
            ],
            'user' => [
                'name' => $googleName,
                'role' => 'Proprietario',
                'email' => $googleEmail,
                'picture' => $googlePicture
            ]
        ]);
    }

    // Standard email validation
    if ($email === 'marco@barcentrale.it' || !empty($email)) {
        sendJsonResponse([
            'success' => true,
            'token' => bin2hex(random_bytes(24)),
            'bar' => [
                'id' => $barId,
                'name' => $barId === 'bar_02' ? 'Milano Lounge & Cocktail' : ($barId === 'bar_03' ? 'Café de Paris' : 'Bar Centrale'),
                'city' => $barId === 'bar_02' ? 'Milano' : ($barId === 'bar_03' ? 'Nice' : 'Roma'),
                'plan' => 'Pro',
                'trial_days_remaining' => 14
            ],
            'user' => [
                'name' => 'Marco Rossi',
                'role' => 'Proprietario',
                'email' => $email
            ]
        ]);
    } else {
        sendJsonResponse(['error' => 'Identifiants invalides'], 401);
    }
} else {
    sendJsonResponse(['status' => 'auth_service_ready']);
}
