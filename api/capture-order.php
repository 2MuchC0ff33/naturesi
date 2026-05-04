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

// Step 1: Get order details via PayPal API (to verify amount BEFORE capturing)
$order_result = paypal_api_request('GET', '/v2/checkout/orders/' . urlencode($order_id), null);

if (isset($order_result['error'])) {
    error_log('PayPal get-order API error: ' . $order_result['error']);
    json_response(array('verified' => false, 'reason' => 'Failed to retrieve order: ' . $order_result['error']));
}

$order_data = $order_result['data'];
$order_http_code = $order_result['http_code'];

if ($order_http_code !== 200) {
    $reason = isset($order_data['message']) ? $order_data['message'] : 'Failed to get order (HTTP ' . $order_http_code . ')';
    error_log('PayPal get-order failed (HTTP ' . $order_http_code . '): ' . json_encode($order_data));
    json_response(array('verified' => false, 'reason' => $reason));
}

// Extract expected amount from order (before capture)
$order_amount = null;
$order_currency = null;

if (isset($order_data['purchase_units'][0]['amount'])) {
    $amount_obj = $order_data['purchase_units'][0]['amount'];
    if (isset($amount_obj['value'])) {
        $order_amount = floatval($amount_obj['value']);
    }
    if (isset($amount_obj['currency_code'])) {
        $order_currency = $amount_obj['currency_code'];
    }
}

// Verify amount from order matches expected (within 0.01 tolerance)
if ($order_amount === null) {
    error_log('Could not extract amount from order: ' . $order_id);
    json_response(array('verified' => false, 'reason' => 'Could not verify order amount'));
}

$diff = abs($order_amount - $expected_total);
if ($diff > 0.01) {
    error_log('Pre-capture amount mismatch: order=' . $order_amount . ' expected=' . $expected_total . ' order=' . $order_id);
    json_response(array(
        'verified' => false,
        'reason' => 'Amount mismatch: order shows ' . $order_amount . ' but expected ' . $expected_total,
    ));
}

// Verify currency matches
if ($order_currency !== null && $order_currency !== $expected_currency) {
    error_log('Currency mismatch: order=' . $order_currency . ' expected=' . $expected_currency . ' order=' . $order_id);
    json_response(array(
        'verified' => false,
        'reason' => 'Currency mismatch: ' . $order_currency . ' vs ' . $expected_currency,
    ));
}

// Step 2: Now capture the verified order
$capture_result = paypal_api_request('POST', '/v2/checkout/orders/' . urlencode($order_id) . '/capture', null);

if (isset($capture_result['error'])) {
    error_log('PayPal capture API error: ' . $capture_result['error']);
    json_response(array('verified' => false, 'reason' => 'Failed to capture payment: ' . $capture_result['error']));
}

$capture_data = $capture_result['data'];
$capture_http_code = $capture_result['http_code'];

if ($capture_http_code !== 201 && $capture_http_code !== 200) {
    $reason = isset($capture_data['message']) ? $capture_data['message'] : 'Capture failed (HTTP ' . $capture_http_code . ')';
    error_log('PayPal capture failed (HTTP ' . $capture_http_code . '): ' . json_encode($capture_data));
    json_response(array('verified' => false, 'reason' => $reason, 'http_code' => $capture_http_code));
}

// Step 3: Verify the captured amount
$status = isset($capture_data['status']) ? $capture_data['status'] : '';

if ($status !== 'COMPLETED') {
    json_response(array(
        'verified' => false,
        'reason' => 'Payment status is ' . $status . ', not COMPLETED',
        'status' => $status,
    ));
}

// Extract captured amount from the response
$captured_amount = null;
$captured_currency = null;

if (isset($capture_data['purchase_units'][0]['payments']['captures'][0])) {
    $capture_obj = $capture_data['purchase_units'][0]['payments']['captures'][0];
    if (isset($capture_obj['amount']['value'])) {
        $captured_amount = floatval($capture_obj['amount']['value']);
    }
    if (isset($capture_obj['amount']['currency_code'])) {
        $captured_currency = $capture_obj['amount']['currency_code'];
    }
}

// Verify amount after capture (within 0.01 tolerance)
if ($captured_amount === null) {
    error_log('Could not extract captured amount: ' . $order_id);
    json_response(array('verified' => false, 'reason' => 'Could not verify captured amount'));
}

$diff = abs($captured_amount - $expected_total);
if ($diff > 0.01) {
    error_log('Post-capture amount mismatch: captured=' . $captured_amount . ' expected=' . $expected_total . ' order=' . $order_id);
    json_response(array(
        'verified' => false,
        'reason' => 'Amount mismatch: captured ' . $captured_amount . ' vs expected ' . $expected_total,
        'status' => 'COMPLETED',
    ));
}

// Verify currency matches
if ($captured_currency !== null && $captured_currency !== $expected_currency) {
    error_log('Currency mismatch: captured=' . $captured_currency . ' expected=' . $expected_currency . ' order=' . $order_id);
    json_response(array(
        'verified' => false,
        'reason' => 'Currency mismatch: ' . $captured_currency . ' vs ' . $expected_currency,
        'status' => 'COMPLETED',
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

// Send order confirmation email (logged for now, can enable actual sending later)
send_order_confirmation_email($order_record, $capture_data);

// Success
json_response(array(
    'verified' => true,
    'status' => 'COMPLETED',
    'order_id' => $order_id,
    'amount' => $captured_amount,
    'currency' => $captured_currency,
));
