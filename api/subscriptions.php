<?php
// BarPilot - SaaS Subscriptions & 14-Day Free Trial API
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

$plans = [
    [
        'id' => 'starter',
        'name' => 'Starter',
        'price_cents' => 2900,
        'currency' => 'EUR',
        'billing' => 'monthly',
        'trial_days' => 14,
        'features' => ['Commandes', 'Tables', 'Catalogue', 'Statistiques de base']
    ],
    [
        'id' => 'pro',
        'name' => 'Pro',
        'price_cents' => 5900,
        'currency' => 'EUR',
        'billing' => 'monthly',
        'trial_days' => 14,
        'recommended' => true,
        'features' => ['Starter', 'Stocks intelligents', 'Recettes & doses', 'Fournisseurs', 'Menu QR code', 'Écran Barman (KDS)']
    ],
    [
        'id' => 'premium',
        'name' => 'Premium',
        'price_cents' => 9900,
        'currency' => 'EUR',
        'billing' => 'monthly',
        'trial_days' => 14,
        'features' => ['Pro', 'BarPilot AI assistant', 'Multi-bars centralisé', 'Import factures IA', 'Automatisations']
    ]
];

if ($method === 'GET') {
    sendJsonResponse([
        'plans' => $plans,
        'trial_status' => [
            'active' => true,
            'days_remaining' => 14,
            'expires_at' => date('c', strtotime('+14 days'))
        ]
    ]);
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $planId = $input['plan_id'] ?? 'pro';

    sendJsonResponse([
        'success' => true,
        'message' => "Abonnement {$planId} activé avec 14 jours d'essai gratuit.",
        'checkout_url' => "https://checkout.stripe.com/pay/barpilot_mock_{$planId}",
        'plan_id' => $planId,
        'trial_end' => date('c', strtotime('+14 days'))
    ]);
}
