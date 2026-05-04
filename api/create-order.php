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

// Validate postcode (required for shipping calculation)
$postcode = isset($input['postcode']) ? trim($input['postcode']) : '';
if ($postcode === '') {
    json_response(array('error' => 'Postcode is required for shipping calculation'), 400);
}
if (!preg_match('/^\d{4}$/', $postcode)) {
    json_response(array('error' => 'Invalid postcode format. Must be 4 digits.'), 400);
}

// Validate shipping > 0 (prevent $0 shipping bug - transaction 8H768506LM018752U)
$shippingFloat = floatval($shipping);
if ($shippingFloat <= 0) {
    json_response(array('error' => 'Shipping cost must be greater than zero. Please go back to cart and enter your postcode to calculate shipping.'), 400);
}

// Load products.json for server-side price lookup and stock check
$products_path = dirname(__DIR__) . '/assets/js/data/products.json';
$products_data = json_decode(file_get_contents($products_path), true);
$products = isset($products_data['products']) ? $products_data['products'] : array();

// Build product index by ID and SKU for fast lookup
$product_index = array();
foreach ($products as $p) {
    $id = isset($p['id']) ? $p['id'] : '';
    $sku = isset($p['sku']) ? $p['sku'] : '';
    $product_index[$id] = $p;
    if ($sku && $sku !== $id) {
        $product_index[$sku] = $p;
    }
    // Also index by option IDs
    if (isset($p['options']) && is_array($p['options'])) {
        foreach ($p['options'] as $opt) {
            $opt_id = isset($opt['id']) ? $opt['id'] : '';
            if ($opt_id) {
                $product_index[$opt_id] = $p;
            }
        }
    }
}

// Validate items: look up prices server-side and check stock
$server_items = array();
$server_subtotal = 0.0;
$errors = array();

foreach ($items as $item) {
    $item_id = isset($item['id']) ? $item['id'] : '';
    $client_qty = isset($item['qty']) ? intval($item['qty']) : (isset($item['quantity']) ? intval($item['quantity']) : 1);

    // Skip empty items
    if ($item_id === '' || $client_qty <= 0) {
        continue;
    }

    // Look up product server-side
    if (!isset($product_index[$item_id])) {
        $errors[] = 'Product not found: ' . $item_id;
        continue;
    }

    $product = $product_index[$item_id];

    // Check stock status
    $in_stock = isset($product['inStock']) ? $product['inStock'] : false;
    if (!$in_stock) {
        $product_name = isset($product['name']) ? $product['name'] : $item_id;
        $errors[] = 'Product out of stock: ' . $product_name;
        continue;
    }

    // Get server-side price (base price or option price)
    $server_price = null;
    $product_name = isset($product['name']) ? $product['name'] : 'Item';

    // Check if this is an option-specific item
    if (isset($product['options']) && is_array($product['options'])) {
        foreach ($product['options'] as $opt) {
            if (isset($opt['id']) && $opt['id'] === $item_id) {
                $server_price = isset($opt['price']) ? floatval($opt['price']) : null;
                break;
            }
        }
    }

    // Fall back to base price if no option price found
    if ($server_price === null) {
        $server_price = isset($product['price']) ? floatval($product['price']) : 0;
    }

    if ($server_price <= 0) {
        $errors[] = 'Invalid price for product: ' . $product_name;
        continue;
    }

    $line_total = $server_price * $client_qty;
    $server_subtotal += $line_total;

    $server_items[] = array(
        'name' => substr($product_name, 0, 127),
        'unit_amount' => array(
            'currency_code' => $currency,
            'value' => number_format($server_price, 2, '.', ''),
        ),
        'quantity' => strval($client_qty),
    );
}

// Check for errors
if (!empty($errors)) {
    json_response(array('error' => implode('; ', $errors)), 400);
}

if (empty($server_items)) {
    json_response(array('error' => 'No valid items in order'), 400);
}

// Calculate expected total and verify against client-supplied total
$expected_total = $server_subtotal + $shippingFloat;
$total_diff = abs($totalFloat - $expected_total);
if ($total_diff > 0.10) {
    error_log('Price manipulation detected: client=' . $totalFloat . ' server=' . $expected_total);
    json_response(array('error' => 'Order total mismatch. Please refresh and try again.'), 400);
}

// Build purchase_units for PayPal API (using server-side validated prices)
$purchase_units = array(
    array(
        'amount' => array(
            'currency_code' => $currency,
            'value' => number_format($expected_total, 2, '.', ''),
            'breakdown' => array(
                'item_total' => array(
                    'currency_code' => $currency,
                    'value' => number_format($server_subtotal, 2, '.', ''),
                ),
                'shipping' => array(
                    'currency_code' => $currency,
                    'value' => number_format($shippingFloat, 2, '.', ''),
                ),
            ),
        ),
    ),
);

// Add server-validated line items
if (!empty($server_items)) {
    $purchase_units[0]['items'] = $server_items;
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
