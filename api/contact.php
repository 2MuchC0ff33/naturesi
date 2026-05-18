<?php
// api/contact.php — Contact form handler with Zoho SMTP
// POST: name, email, request_type, message
// Returns: { "success": true } or { "error": "..." }

// Security: prevent caching of this response
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Content-Type: application/json');

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('error' => 'Method not allowed'));
    exit;
}

// ─── Load .env ──────────────────────────────────────────────
require_once __DIR__ . '/config.php';

$env = parse_env_file(dirname(__DIR__) . '/.env');

$smtp_host = isset($env['SMTP_HOST']) ? $env['SMTP_HOST'] : '';
$smtp_port = isset($env['SMTP_PORT']) ? intval($env['SMTP_PORT']) : 587;
$smtp_user = isset($env['SMTP_USER']) ? $env['SMTP_USER'] : '';
$smtp_pass = isset($env['SMTP_PASS']) ? $env['SMTP_PASS'] : '';
$contact_from = isset($env['CONTACT_FROM']) ? $env['CONTACT_FROM'] : 'noreply@naturesinfusions.com.au';
$contact_to = isset($env['CONTACT_TO']) ? $env['CONTACT_TO'] : 'tea@naturesinfusions.com.au';

// Validate SMTP config
if (!$smtp_host || !$smtp_user || !$smtp_pass) {
    error_log('Contact form: SMTP configuration missing');
    http_response_code(500);
    echo json_encode(array('error' => 'Service unavailable. Please try again later.'));
    exit;
}

// ─── Honeypot anti-spam ─────────────────────────────────────
$gotcha = isset($_POST['_gotcha']) ? trim($_POST['_gotcha']) : '';
if ($gotcha !== '') {
    error_log('Contact form: honeypot triggered');
    // Return success to avoid tipping off bots
    echo json_encode(array('success' => true));
    exit;
}

// ─── Session-based rate limiting ────────────────────────────
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$rate_window = 600; // 10 minutes
$max_submissions = 3;
$now = time();

if (!isset($_SESSION['contact_submissions'])) {
    $_SESSION['contact_submissions'] = array();
}

// Prune old entries
$_SESSION['contact_submissions'] = array_values(array_filter(
    $_SESSION['contact_submissions'],
    function ($ts) use ($now, $rate_window) {
        return ($now - $ts) < $rate_window;
    }
));

if (count($_SESSION['contact_submissions']) >= $max_submissions) {
    error_log('Contact form: rate limit exceeded');
    http_response_code(429);
    echo json_encode(array('error' => 'Too many submissions. Please wait 10 minutes before trying again.'));
    exit;
}

$_SESSION['contact_submissions'][] = $now;

// ─── Read and validate POST body ────────────────────────────
$post_size = strlen($_SERVER['CONTENT_LENGTH'] ?? '') > 0 ? intval($_SERVER['CONTENT_LENGTH']) : 0;
if ($post_size > 5120) {
    error_log('Contact form: payload too large (' . $post_size . ' bytes)');
    http_response_code(413);
    echo json_encode(array('error' => 'Request too large.'));
    exit;
}

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$request_type = isset($_POST['request_type']) ? trim($_POST['request_type']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

// Strip CR/LF to prevent header injection (all fields)
$name = preg_replace('/[\r\n]+/', '', $name);
$email = preg_replace('/[\r\n]+/', '', $email);
$request_type = preg_replace('/[\r\n]+/', '', $request_type);
$message = preg_replace('/[\r\n]+/', '', $message);

// Validate required fields
if ($name === '' || strlen($name) > 100) {
    http_response_code(400);
    echo json_encode(array('error' => 'Please enter a valid name.'));
    exit;
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    http_response_code(400);
    echo json_encode(array('error' => 'Please enter a valid email address.'));
    exit;
}

$valid_types = array('order-support', 'payment-issues', 'stockist-info', 'wholesale-enquiry', 'other');
if ($request_type === '' || !in_array($request_type, $valid_types, true)) {
    http_response_code(400);
    echo json_encode(array('error' => 'Please select a request type.'));
    exit;
}

if ($message === '' || strlen($message) < 20 || strlen($message) > 2000) {
    http_response_code(400);
    echo json_encode(array('error' => 'Message must be between 20 and 2000 characters.'));
    exit;
}

// ─── Build email content ────────────────────────────────────
$subject = 'Contact: ' . htmlspecialchars($request_type, ENT_QUOTES, 'UTF-8') . ' - ' . date('d/m/Y H:i');
$friendly_type = str_replace('-', ' ', $request_type);
$friendly_type = ucwords($friendly_type);

$text_body = "New contact form submission\n";
$text_body .= "================================\n\n";
$text_body .= "Name: " . $name . "\n";
$text_body .= "Email: " . $email . "\n";
$text_body .= "Type: " . $friendly_type . "\n\n";
$text_body .= "Message:\n" . $message . "\n\n";
$text_body .= "---\n";
$text_body .= "Sent from naturesinfusions.com.au\n";
$text_body .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

$html_body = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body>";
$html_body .= "<h2>New Contact Form Submission</h2>";
$html_body .= "<table border=\"0\" cellpadding=\"4\" cellspacing=\"0\">";
$html_body .= "<tr><td><strong>Name:</strong></td><td>" . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . "</td></tr>";
$html_body .= "<tr><td><strong>Email:</strong></td><td><a href=\"mailto:" . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . "\">" . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . "</a></td></tr>";
$html_body .= "<tr><td><strong>Type:</strong></td><td>" . htmlspecialchars($friendly_type, ENT_QUOTES, 'UTF-8') . "</td></tr>";
$html_body .= "</table>";
$html_body .= "<h3>Message</h3><p>" . nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8')) . "</p>";
$html_body .= "<hr><p><small>Sent from naturesinfusions.com.au | IP: " . htmlspecialchars($_SERVER['REMOTE_ADDR'] ?? 'unknown', ENT_QUOTES, 'UTF-8') . "</small></p>";
$html_body .= "</body></html>";

// ─── Send via Zoho SMTP ─────────────────────────────────────
function smtp_send($host, $port, $user, $pass, $from, $to, $subject, $text_body, $html_body) {
    // Connect
    $fp = @fsockopen($host, $port, $errno, $errstr, 30);
    if (!$fp) {
        error_log('Contact SMTP: connection failed - ' . $errstr);
        return false;
    }
    stream_set_timeout($fp, 30);

    // Read server banner
    $response = smtp_read($fp);
    if (strpos($response, '220') !== 0) {
        error_log('Contact SMTP: bad banner - ' . $response);
        fclose($fp);
        return false;
    }

    // EHLO
    $domain = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'naturesinfusions.com.au';
    smtp_command($fp, 'EHLO ' . $domain);
    $response = smtp_read($fp);

    // Check for STARTTLS support
    if (strpos($response, 'STARTTLS') !== false) {
        smtp_command($fp, 'STARTTLS');
        $response = smtp_read($fp);
        if (strpos($response, '220') !== 0) {
            error_log('Contact SMTP: STARTTLS failed - ' . $response);
            fclose($fp);
            return false;
        }
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            error_log('Contact SMTP: TLS negotiation failed');
            fclose($fp);
            return false;
        }
        // Re-EHLO after TLS
        smtp_command($fp, 'EHLO ' . $domain);
        smtp_read($fp);
    }

    // AUTH LOGIN
    smtp_command($fp, 'AUTH LOGIN');
    $response = smtp_read($fp);
    if (strpos($response, '334') !== 0) {
        error_log('Contact SMTP: AUTH LOGIN rejected - ' . $response);
        fclose($fp);
        return false;
    }

    smtp_command($fp, base64_encode($user));
    $response = smtp_read($fp);
    if (strpos($response, '334') !== 0) {
        error_log('Contact SMTP: username rejected - ' . $response);
        fclose($fp);
        return false;
    }

    smtp_command($fp, base64_encode($pass));
    $response = smtp_read($fp);
    if (strpos($response, '235') !== 0 && strpos($response, '250') !== 0) {
        error_log('Contact SMTP: password rejected - ' . $response);
        fclose($fp);
        return false;
    }

    // MAIL FROM
    smtp_command($fp, 'MAIL FROM:<' . $from . '>');
    $response = smtp_read($fp);
    if (strpos($response, '250') !== 0) {
        error_log('Contact SMTP: MAIL FROM rejected - ' . $response);
        fclose($fp);
        return false;
    }

    // RCPT TO
    smtp_command($fp, 'RCPT TO:<' . $to . '>');
    $response = smtp_read($fp);
    if (strpos($response, '250') !== 0 && strpos($response, '251') !== 0) {
        error_log('Contact SMTP: RCPT TO rejected - ' . $response);
        fclose($fp);
        return false;
    }

    // DATA
    smtp_command($fp, 'DATA');
    $response = smtp_read($fp);
    if (strpos($response, '354') !== 0) {
        error_log('Contact SMTP: DATA rejected - ' . $response);
        fclose($fp);
        return false;
    }

    // Build email headers and body
    $boundary = md5(uniqid((string)time(), true));
    $email_data = "Date: " . date('r') . "\r\n";
    $email_data .= "From: Nature's Infusions <" . $from . ">\r\n";
    $email_data .= "Reply-To: " . $from . "\r\n";
    $email_data .= "Sender: " . $from . "\r\n";
    $email_data .= "Return-Path: " . $from . "\r\n";
    $email_data .= "Message-ID: <" . md5(uniqid((string)time(), true)) . "@naturesinfusions.com.au>\r\n";
    $email_data .= "To: " . $to . "\r\n";
    $email_data .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $email_data .= "MIME-Version: 1.0\r\n";
    $email_data .= "Content-Type: multipart/alternative; boundary=\"" . $boundary . "\"\r\n";
    $email_data .= "\r\n";
    $email_data .= "--" . $boundary . "\r\n";
    $email_data .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $email_data .= "Content-Transfer-Encoding: 8bit\r\n";
    $email_data .= "\r\n";
    $email_data .= $text_body . "\r\n";
    $email_data .= "--" . $boundary . "\r\n";
    $email_data .= "Content-Type: text/html; charset=UTF-8\r\n";
    $email_data .= "Content-Transfer-Encoding: 8bit\r\n";
    $email_data .= "\r\n";
    $email_data .= $html_body . "\r\n";
    $email_data .= "--" . $boundary . "--\r\n";
    $email_data .= ".\r\n";

    fwrite($fp, $email_data);
    $response = smtp_read($fp);
    if (strpos($response, '250') !== 0) {
        error_log('Contact SMTP: message rejected - ' . $response);
        fclose($fp);
        return false;
    }

    // QUIT
    smtp_command($fp, 'QUIT');
    fclose($fp);
    return true;
}

function smtp_command($fp, $cmd) {
    fwrite($fp, $cmd . "\r\n");
}

function smtp_read($fp) {
    $response = '';
    while (($line = fgets($fp, 512)) !== false) {
        $response .= $line;
        if (substr($line, 3, 1) === ' ') {
            break;
        }
    }
    return trim($response);
}

// ─── Execute SMTP send ──────────────────────────────────────
$sent = smtp_send($smtp_host, $smtp_port, $smtp_user, $smtp_pass, $contact_from, $contact_to, $subject, $text_body, $html_body);

if ($sent) {
    error_log('Contact form: email sent from ' . $email . ' (' . $request_type . ')');
    echo json_encode(array('success' => true));
} else {
    error_log('Contact form: SMTP send failed');
    http_response_code(500);
    echo json_encode(array('error' => 'Failed to send message. Please try again or email us directly.'));
}
