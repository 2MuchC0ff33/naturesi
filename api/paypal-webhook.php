<?php
// api/paypal-webhook.php — Receives and verifies PayPal webhook events
// POST: PayPal webhook payload with signature headers
// Returns: HTTP 200 empty body (PayPal requirement) or HTTP 400 for invalid signatures

require_once __DIR__ . '/config.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

// Read raw body
$raw_body = file_get_contents('php://input');
$event_data = json_decode($raw_body, true);

if (!$event_data) {
    http_response_code(400);
    exit;
}

// Extract PayPal signature headers
$transmission_id = isset($_SERVER['HTTP_PAYPAL_TRANSMISSION_ID']) ? $_SERVER['HTTP_PAYPAL_TRANSMISSION_ID'] : '';
$transmission_time = isset($_SERVER['HTTP_PAYPAL_TRANSMISSION_TIME']) ? $_SERVER['HTTP_PAYPAL_TRANSMISSION_TIME'] : '';
$cert_url = isset($_SERVER['HTTP_PAYPAL_CERT_URL']) ? $_SERVER['HTTP_PAYPAL_CERT_URL'] : '';
$auth_algo = isset($_SERVER['HTTP_PAYPAL_AUTH_ALGO']) ? $_SERVER['HTTP_PAYPAL_AUTH_ALGO'] : '';
$transmission_sig = isset($_SERVER['HTTP_PAYPAL_TRANSMISSION_SIG']) ? $_SERVER['HTTP_PAYPAL_TRANSMISSION_SIG'] : '';

// If webhook ID is not configured, just log and return 200 (allow during setup)
if (PAYPAL_WEBHOOK_ID === '') {
    error_log('PayPal webhook received but PAYPAL_WEBHOOK_ID not configured. Event: ' . json_encode($event_data));
    log_webhook_event(array_merge($event_data, array('_unverified' => true, '_received_at' => date('c'))));
    http_response_code(200);
    exit;
}

// If signature headers are missing, log and return 200
if ($transmission_id === '' || $transmission_sig === '' || $cert_url === '') {
    error_log('PayPal webhook missing signature headers. Event: ' . json_encode($event_data));
    log_webhook_event(array_merge($event_data, array('_unsigned' => true, '_received_at' => date('c'))));
    http_response_code(200);
    exit;
}

// Verify webhook signature via PayPal API
$verify_result = paypal_api_request('POST', '/v1/notifications/verify-webhook-signature', array(
    'transmission_id' => $transmission_id,
    'transmission_time' => $transmission_time,
    'cert_url' => $cert_url,
    'auth_algo' => $auth_algo,
    'transmission_sig' => $transmission_sig,
    'webhook_id' => PAYPAL_WEBHOOK_ID,
    'webhook_event' => $event_data,
));

$verification_status = 'FAILURE';

if (isset($verify_result['data']['verification_status'])) {
    $verification_status = $verify_result['data']['verification_status'];
}

// Add verification metadata
$event_data['_verified'] = ($verification_status === 'SUCCESS');
$event_data['_verification_status'] = $verification_status;
$event_data['_received_at' ] = date('c');
$event_data['_paypal_mode'] = PAYPAL_MODE;

// Log the event regardless of verification
log_webhook_event($event_data);

// If verification failed, log error and return 400
if ($verification_status !== 'SUCCESS') {
    error_log('PayPal webhook verification FAILED (' . $verification_status . '): ' . json_encode($event_data));
    http_response_code(400);
    exit;
}

// Process verified events
$event_type = isset($event_data['event_type']) ? $event_data['event_type'] : '';

switch ($event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment successfully captured
        $resource = isset($event_data['resource']) ? $event_data['resource'] : array();
        $capture_id = isset($resource['id']) ? $resource['id'] : '';
        $amount = isset($resource['amount']['value']) ? $resource['amount']['value'] : '';
        $currency = isset($resource['amount']['currency_code']) ? $resource['amount']['currency_code'] : '';
        error_log('PAYMENT.CAPTURE.COMPLETED: capture_id=' . $capture_id . ' amount=' . $amount . ' ' . $currency);
        break;

    case 'PAYMENT.CAPTURE.DENIED':
        $resource = isset($event_data['resource']) ? $event_data['resource'] : array();
        $capture_id = isset($resource['id']) ? $resource['id'] : '';
        error_log('PAYMENT.CAPTURE.DENIED: capture_id=' . $capture_id);
        break;

    case 'PAYMENT.CAPTURE.REFUNDED':
        $resource = isset($event_data['resource']) ? $event_data['resource'] : array();
        $capture_id = isset($resource['id']) ? $resource['id'] : '';
        $refund_amount = isset($resource['amount']['value']) ? $resource['amount']['value'] : '';
        error_log('PAYMENT.CAPTURE.REFUNDED: capture_id=' . $capture_id . ' amount=' . $refund_amount);
        break;

    case 'CUSTOMER.DISPUTE.CREATED':
        $resource = isset($event_data['resource']) ? $event_data['resource'] : array();
        $dispute_id = isset($resource['dispute_id']) ? $resource['dispute_id'] : '';
        $reason = isset($resource['reason']) ? $resource['reason'] : '';
        error_log('CUSTOMER.DISPUTE.CREATED: dispute_id=' . $dispute_id . ' reason=' . $reason);
        break;

    default:
        error_log('PayPal webhook: unhandled event type: ' . $event_type);
        break;
}

// PayPal expects empty 200 response
http_response_code(200);
exit;
