<?php
// BarPilot - Orders API (Create, List, Update Status & Recipe Deductions)
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // List orders for location
    $orders = [
        [
            'id' => 1042,
            'table' => 'Tavolo 04',
            'server' => 'Giulia Conti',
            'status' => 'prep',
            'time' => '2 min',
            'total' => 8.90,
            'items' => [
                ['name' => 'Cappuccino', 'qty' => 2, 'price' => 2.80],
                ['name' => 'Espresso', 'qty' => 1, 'price' => 1.50],
                ['name' => 'Croissant burro', 'qty' => 1, 'price' => 1.80]
            ]
        ],
        [
            'id' => 1041,
            'table' => 'Tavolo 08',
            'server' => 'Sara Romano',
            'status' => 'ready',
            'time' => '5 min',
            'total' => 16.50,
            'items' => [
                ['name' => 'Bière blonde artisanale', 'qty' => 3, 'price' => 5.00],
                ['name' => 'Acqua minerale 50cl', 'qty' => 1, 'price' => 1.50]
            ]
        ]
    ];
    sendJsonResponse(['orders' => $orders]);

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $table = $input['table'] ?? 'Comptoir';
    $items = $input['items'] ?? [];
    $total = 0;

    foreach ($items as $item) {
        $total += ($item['qty'] * $item['price']);
    }

    $newOrder = [
        'id' => rand(1050, 9999),
        'table' => $table,
        'items' => $items,
        'total' => round($total, 2),
        'status' => 'prep',
        'created_at' => date('c')
    ];

    sendJsonResponse(['success' => true, 'order' => $newOrder], 201);

} elseif ($method === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true);
    $orderId = $input['order_id'] ?? null;
    $status = $input['status'] ?? 'ready';

    sendJsonResponse([
        'success' => true,
        'order_id' => $orderId,
        'status' => $status,
        'updated_at' => date('c')
    ]);
}
