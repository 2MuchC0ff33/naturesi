<?php
// api/capture-order.php — Captures and verifies a PayPal order
// POST: { "orderID": "5O190127TN364715T", "expectedTotal": "15.00", "currency": "AUD" }
// Returns: { "verified": true, "status": "COMPLETED", "order": {...} }
//          or { "verified": false, "reason": "..." }

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

$order_id = isset($input['orderID']) ? $input['orderID'] : '';
$expected_total = isset($input['expectedTotal']) ? floatval($input['expectedTotal']) : 0;
$expected_currency = isset($input['currency']) ? strtoupper($input['currency']) : 'AUD';

if ($order_id === '') {
    json_response(array('error' => 'Missing orderID'), 400);
}

if ($expected_total <= 0) {
    json_response(array('error' => 'Invalid expectedTotal'), 400);
}

// Step 1: Capture the order via PayPal API
$capture_result = paypal_api_request('POST', '/v2/checkout/orders/' . urlencode($order_id) . '/capture', null);

if (isset($capture_result['error'])) {
    error_log('PayPal capture API error: ' . $capture_result['error']);
    // Use 200 with verified=false to avoid Cloudflare overriding 502
    json_response(array('verified' => false, 'reason' => 'Failed to capture payment: ' . $capture_result['error']));
}

$order_data = $capture_result['data'];
$http_code = $capture_result['http_code'];

if ($http_code !== 201 && $http_code !== 200) {
    $reason = isset($order_data['message']) ? $order_data['message'] : 'Capture failed (HTTP ' . $http_code . ')';
    error_log('PayPal capture failed (HTTP ' . $http_code . '): ' . json_encode($order_data));
    // Use 200 with verified=false to avoid Cloudflare overriding 502
    json_response(array('verified' => false, 'reason' => $reason, 'http_code' => $http_code));
}

// Step 2: Verify the captured amount
$status = isset($order_data['status']) ? $order_data['status'] : '';

if ($status !== 'COMPLETED') {
    json_response(array(
        'verified' => false,
        'reason' => 'Payment status is ' . $status . ', not COMPLETED',
        'status' => $status,
        'order' => $order_data,
    ));
}

// Extract captured amount from the response
$captured_amount = null;
$captured_currency = null;

if (isset($order_data['purchase_units'][0]['payments']['captures'][0])) {
    $capture_obj = $order_data['purchase_units'][0]['payments']['captures'][0];
    if (isset($capture_obj['amount']['value'])) {
        $captured_amount = floatval($capture_obj['amount']['value']);
    }
    if (isset($capture_obj['amount']['currency_code'])) {
        $captured_currency = $capture_obj['amount']['currency_code'];
    }
}

// Verify amount matches (within 0.01 tolerance)
if ($captured_amount !== null) {
    $diff = abs($captured_amount - $expected_total);
    if ($diff > 0.01) {
        error_log('Amount mismatch: captured=' . $captured_amount . ' expected=' . $expected_total . ' order=' . $order_id);
        json_response(array(
            'verified' => false,
            'reason' => 'Amount mismatch: captured ' . $captured_amount . ' vs expected ' . $expected_total,
            'status' => 'COMPLETED',
            'order' => $order_data,
        ));
    }
}

// Verify currency matches
if ($captured_currency !== null && $captured_currency !== $expected_currency) {
    error_log('Currency mismatch: captured=' . $captured_currency . ' expected=' . $expected_currency . ' order=' . $order_id);
    json_response(array(
        'verified' => false,
        'reason' => 'Currency mismatch: ' . $captured_currency . ' vs ' . $expected_currency,
        'status' => 'COMPLETED',
        'order' => $order_data,
    ));
}

// Step 3: Write verified order to flat file
$order_record = array(
    'order_id' => $order_id,
    'status' => $status,
    'captured_amount' => $captured_amount,
    'currency' => $captured_currency,
    'expected_total' => $expected_total,
    'verified_at' => date('c'),
    'paypal_response' => $order_data,
);

$filename = date('Ymd-His') . '-' . sanitize_filename($order_id) . '.json';
$filepath = ORDERS_DIR . '/' . $filename;

$written = write_json_file($filepath, $order_record);
if (!$written) {
    error_log('Failed to write order file: ' . $filepath);
    // Still return verified=true since PayPal confirmed payment
}

// Success
json_response(array(
    'verified' => true,
    'status' => 'COMPLETED',
    'order_id' => $order_id,
    'amount' => $captured_amount,
    'currency' => $captured_currency,
));
