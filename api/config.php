<?php
// api/config.php — Central PayPal configuration and API helpers
// Reads .env from site root, provides PayPal API helper functions.
// No Composer dependencies. PHP 7.0+ with cURL required.

// Block direct access
if (realpath($_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)) {
    http_response_code(403);
    exit('Direct access not allowed.');
}

// ─── .env Parser ──────────────────────────────────────────────
function parse_env_file($path) {
    $config = array();
    if (!file_exists($path)) {
        return $config;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }
        $eqPos = strpos($line, '=');
        if ($eqPos === false) {
            continue;
        }
        $key = trim(substr($line, 0, $eqPos));
        $value = trim(substr($line, $eqPos + 1));
        // Strip surrounding quotes
        if (strlen($value) >= 2 && $value[0] === '"' && substr($value, -1) === '"') {
            $value = substr($value, 1, -1);
        }
        if (strlen($value) >= 2 && $value[0] === "'" && substr($value, -1) === "'") {
            $value = substr($value, 1, -1);
        }
        $config[$key] = $value;
    }
    return $config;
}

// Resolve .env path (relative to this file's location)
$env_path = dirname(__DIR__) . '/.env';
$env = parse_env_file($env_path);

// ─── Configuration Constants ──────────────────────────────────
define('PAYPAL_MODE', isset($env['PAYPAL_MODE']) ? $env['PAYPAL_MODE'] : 'sandbox');

if (PAYPAL_MODE === 'live') {
    define('PAYPAL_CLIENT_ID', isset($env['PAYPAL_LIVE_CLIENT_ID']) ? $env['PAYPAL_LIVE_CLIENT_ID'] : '');
    define('PAYPAL_SECRET', isset($env['PAYPAL_LIVE_SECRET']) ? $env['PAYPAL_LIVE_SECRET'] : '');
    define('PAYPAL_API_BASE', 'https://api-m.paypal.com');
    define('PAYPAL_WEBHOOK_ID', isset($env['PAYPAL_LIVE_WEBHOOK_ID']) ? $env['PAYPAL_LIVE_WEBHOOK_ID'] : '');
} else {
    define('PAYPAL_CLIENT_ID', isset($env['PAYPAL_SANDBOX_CLIENT_ID']) ? $env['PAYPAL_SANDBOX_CLIENT_ID'] : '');
    define('PAYPAL_SECRET', isset($env['PAYPAL_SANDBOX_SECRET']) ? $env['PAYPAL_SANDBOX_SECRET'] : '');
    define('PAYPAL_API_BASE', 'https://api-m.sandbox.paypal.com');
    define('PAYPAL_WEBHOOK_ID', isset($env['PAYPAL_SANDBOX_WEBHOOK_ID']) ? $env['PAYPAL_SANDBOX_WEBHOOK_ID'] : '');
}

define('PAYPAL_WEBHOOK_URL', isset($env['PAYPAL_WEBHOOK_URL']) ? $env['PAYPAL_WEBHOOK_URL'] : '');
define('DATA_DIR', dirname(__DIR__) . '/data');
define('ORDERS_DIR', DATA_DIR . '/orders');
define('WEBHOOK_LOG_DIR', DATA_DIR . '/webhook-log');

// Ensure data directories exist
if (!is_dir(ORDERS_DIR)) {
    @mkdir(ORDERS_DIR, 0755, true);
}
if (!is_dir(WEBHOOK_LOG_DIR)) {
    @mkdir(WEBHOOK_LOG_DIR, 0755, true);
}

// ─── Helper Functions ─────────────────────────────────────────

// Get OAuth2 bearer token from PayPal
function paypal_get_bearer_token() {
    $ch = curl_init();
    curl_setopt_array($ch, array(
        CURLOPT_URL            => PAYPAL_API_BASE . '/v1/oauth2/token',
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => 'grant_type=client_credentials',
        CURLOPT_USERPWD        => PAYPAL_CLIENT_ID . ':' . PAYPAL_SECRET,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => array(
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
        ),
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_2_0,
    ));
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_error) {
        error_log('PayPal token request cURL error: ' . $curl_error);
        return null;
    }
    if ($http_code !== 200) {
        error_log('PayPal token request failed with HTTP ' . $http_code . ': ' . $response);
        return null;
    }

    $data = json_decode($response, true);
    if (!isset($data['access_token'])) {
        error_log('PayPal token response missing access_token: ' . $response);
        return null;
    }

    return $data['access_token'];
}

// Generic PayPal API request
function paypal_api_request($method, $endpoint, $body = null) {
    $token = paypal_get_bearer_token();
    if (!$token) {
        return array('error' => 'Failed to obtain PayPal bearer token', 'http_code' => 0);
    }

    $url = PAYPAL_API_BASE . $endpoint;
    $ch = curl_init();

    $headers = array(
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'Accept: application/json',
        'Prefer: return=representation',
    );

    curl_setopt_array($ch, array(
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_2_0,
    ));

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }
    } elseif ($method === 'GET') {
        curl_setopt($ch, CURLOPT_HTTPGET, true);
    } elseif ($method === 'PATCH') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }
    }

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_error) {
        error_log('PayPal API cURL error (' . $endpoint . '): ' . $curl_error);
        return array('error' => $curl_error, 'http_code' => 0);
    }

    $decoded = json_decode($response, true);
    return array(
        'data'      => $decoded,
        'http_code' => $http_code,
        'raw'       => $response,
    );
}

// Write JSON data to a file atomically (write to temp, then rename)
function write_json_file($filepath, $data) {
    $dir = dirname($filepath);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    $tmp = $filepath . '.tmp.' . getmypid();
    $result = file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
    if ($result === false) {
        error_log('Failed to write file: ' . $filepath);
        return false;
    }
    return @rename($tmp, $filepath);
}

// Sanitize a string for use in filenames
function sanitize_filename($str) {
    return preg_replace('/[^a-zA-Z0-9._-]/', '-', $str);
}

// Log an event to the webhook log
function log_webhook_event($event_data) {
    $event_id = isset($event_data['id']) ? $event_data['id'] : 'unknown-' . time();
    $filename = sanitize_filename($event_id) . '.json';
    $filepath = WEBHOOK_LOG_DIR . '/' . $filename;
    return write_json_file($filepath, $event_data);
}

// Send a JSON response and exit
function json_response($data, $http_code = 200) {
    http_response_code($http_code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Send order confirmation email
// Returns true if email sent (or queued), false on failure
function send_order_confirmation_email($order_data, $capture_data) {
    // Extract customer info from PayPal response
    $payer = isset($capture_data['payer']) ? $capture_data['payer'] : array();
    $customer_email = isset($payer['email_address']) ? $payer['email_address'] : '';
    $customer_name = '';
    if (isset($payer['name'])) {
        $name_parts = $payer['name'];
        $customer_name = trim(($name_parts['given_name'] ?? '') . ' ' . ($name_parts['surname'] ?? ''));
    }

    // Extract order details
    $purchase_units = isset($capture_data['purchase_units']) ? $capture_data['purchase_units'] : array();
    $amount = isset($purchase_units[0]['amount']) ? $purchase_units[0]['amount'] : array();
    $total = isset($amount['value']) ? $amount['value'] : '0.00';
    $currency = isset($amount['currency_code']) ? $amount['currency_code'] : 'AUD';
    $breakdown = isset($amount['breakdown']) ? $amount['breakdown'] : array();
    $shipping = isset($breakdown['shipping']['value']) ? $breakdown['shipping']['value'] : '0.00';

    // Extract items
    $items = array();
    if (isset($purchase_units[0]['items'])) {
        foreach ($purchase_units[0]['items'] as $item) {
            $items[] = $item['quantity'] . 'x ' . $item['name'] . ' - ' . $currency . ' ' . $item['unit_amount']['value'];
        }
    }

    // Build email to merchant
    $merchant_to = defined('PAYPAL_EMAIL') && PAYPAL_EMAIL ? PAYPAL_EMAIL : 'tea@naturesinfusions.com.au';
    $merchant_subject = 'New Order: ' . $total . ' ' . $currency . ' - ' . date('d/m/Y H:i');
    $merchant_body = "New order received\n";
    $merchant_body .= "==================\n\n";
    $merchant_body .= "Customer: " . ($customer_name ?: 'N/A') . "\n";
    $merchant_body .= "Email: " . ($customer_email ?: 'N/A') . "\n";
    $merchant_body .= "Total: " . $currency . ' ' . $total . "\n";
    $merchant_body .= "Shipping: " . $currency . ' ' . $shipping . "\n\n";
    $merchant_body .= "Items:\n";
    foreach ($items as $item) {
        $merchant_body .= "- " . $item . "\n";
    }
    $merchant_body .= "\nOrder ID: " . ($order_data['order_id'] ?? 'N/A') . "\n";
    $merchant_body .= "Capture ID: " . ($capture_data['id'] ?? 'N/A') . "\n";

    // Log merchant email instead of sending (for safety on shared hosting)
    error_log('MERCHANT ORDER EMAIL: To=' . $merchant_to . ' Subject=' . $merchant_subject . ' Body=' . substr($merchant_body, 0, 500));

    // If customer email available, try to send confirmation
    if ($customer_email) {
        $customer_subject = 'Order Confirmation - Nature\'s Infusions';
        $customer_body = "Thank you for your order!\n\n";
        $customer_body .= "Order Total: " . $currency . ' ' . $total . "\n";
        $customer_body .= "Items ordered:\n";
        foreach ($items as $item) {
            $customer_body .= "- " . $item . "\n";
        }
        $customer_body .= "\nYou will receive a separate email with tracking details once your order is dispatched.\n";
        $customer_body .= "\nThank you for choosing Nature's Infusions!\n";

        error_log('CUSTOMER ORDER EMAIL: To=' . $customer_email . ' Subject=' . $customer_subject);
    }

    return true;
}
