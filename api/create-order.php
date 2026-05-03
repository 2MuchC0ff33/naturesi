<?php
// api/create-order.php — Creates a PayPal order server-side
// POST: { "items": [...], "total": "15.00", "shipping": "5.00", "currency": "AUD" }
// Returns: { "orderID": "5O190127TN364715T" } or { "error": "..." }

header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(array('error' => 'Method not allowed'), 405);
}

// Read and validate JSON body
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!$input) {
    json_response(array('error' => 'Invalid JSON body'), 400);
}

// Validate required fields
$total = isset($input['total']) ? $input['total'] : null;
$currency = isset($input['currency']) ? strtoupper($input['currency']) : 'AUD';
$shipping = isset($input['shipping']) ? $input['shipping'] : '0.00';
$items = isset($input['items']) && is_array($input['items']) ? $input['items'] : array();

if ($total === null) {
    json_response(array('error' => 'Missing total amount'), 400);
}

// Validate total is a valid positive number
$totalFloat = floatval($total);
if ($totalFloat <= 0) {
    json_response(array('error' => 'Total must be a positive number'), 400);
}

// Sanity check: cap at $10,000 AUD for safety
if ($totalFloat > 10000.00) {
    json_response(array('error' => 'Total exceeds maximum allowed amount'), 400);
}

// Build purchase_units for PayPal API
$purchase_units = array(
    array(
        'amount' => array(
            'currency_code' => $currency,
            'value' => number_format($totalFloat, 2, '.', ''),
            'breakdown' => array(
                'item_total' => array(
                    'currency_code' => $currency,
                    'value' => number_format(max(0, $totalFloat - floatval($shipping)), 2, '.', ''),
                ),
                'shipping' => array(
                    'currency_code' => $currency,
                    'value' => number_format(floatval($shipping), 2, '.', ''),
                ),
            ),
        ),
    ),
);

// Add line items if provided
$paypal_items = array();
foreach ($items as $item) {
    $name = isset($item['title']) ? $item['title'] : (isset($item['name']) ? $item['name'] : 'Item');
    $name = substr($name, 0, 127);
    $unit_price = isset($item['price']) ? floatval($item['price']) : 0;
    $quantity = isset($item['qty']) ? intval($item['qty']) : (isset($item['quantity']) ? intval($item['quantity']) : 1);

    if ($unit_price > 0 && $quantity > 0) {
        $paypal_items[] = array(
            'name' => $name,
            'unit_amount' => array(
                'currency_code' => $currency,
                'value' => number_format($unit_price, 2, '.', ''),
            ),
            'quantity' => strval($quantity),
        );
    }
}

if (!empty($paypal_items)) {
    $purchase_units[0]['items'] = $paypal_items;
}

// Call PayPal API to create order
$result = paypal_api_request('POST', '/v2/checkout/orders', array(
    'intent' => 'CAPTURE',
    'purchase_units' => $purchase_units,
));

if (isset($result['error'])) {
    error_log('PayPal create-order API error: ' . $result['error']);
    json_response(array('error' => 'Failed to create PayPal order: ' . $result['error']));
}

$data = $result['data'];
$http_code = $result['http_code'];

if ($http_code !== 201 && $http_code !== 200) {
    $error_msg = isset($data['message']) ? $data['message'] : 'PayPal returned HTTP ' . $http_code;
    error_log('PayPal create-order failed (HTTP ' . $http_code . '): ' . json_encode($data));
    json_response(array('error' => $error_msg));
}

if (!isset($data['id'])) {
    error_log('PayPal create-order response missing order ID: ' . json_encode($data));
    json_response(array('error' => 'PayPal did not return an order ID'));
}

// Success
json_response(array(
    'orderID' => $data['id'],
    'status' => isset($data['status']) ? $data['status'] : 'CREATED',
));
