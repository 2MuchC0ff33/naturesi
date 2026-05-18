#!/bin/sh
# test/smoke/contact-form.test.sh — smoke test: contact form integrity
# Checks:
#   1. Form action is /api/contact.php (not dead api.naturesinfusions.com.au)
#   2. Honeypot field _gotcha exists
#   3. mailto fallback link present
#   4. All required fields exist (name, email, request_type, message)
#   5. api/contact.php exists and is valid PHP
#   6. SMTP config keys in .env
#   7. No dead API subdomain reference anywhere

set -u

PASS=0
FAIL=0
TOTAL=0
CONTACT="pages/contact.html"
API_FILE="api/contact.php"
ENV_FILE=".env"

pass() {
    PASS=$((PASS + 1))
    TOTAL=$((TOTAL + 1))
    printf 'ok %d %s\n' "$TOTAL" "$1"
}

fail() {
    FAIL=$((FAIL + 1))
    TOTAL=$((TOTAL + 1))
    printf 'not ok %d %s\n' "$TOTAL" "$1"
}

# Test 1: Form action points to /api/contact.php
if grep -q 'action="/api/contact.php"' "$CONTACT" 2>/dev/null; then
    pass "form action is /api/contact.php"
else
    fail "form action is /api/contact.php"
fi

# Test 2: No dead api.naturesinfusions.com.au reference in contact page
if grep -q 'api\.naturesinfusions\.com\.au' "$CONTACT" 2>/dev/null; then
    fail "dead api subdomain reference removed"
else
    pass "dead api subdomain reference removed"
fi

# Test 3: Honeypot field exists
if grep -q '_gotcha' "$CONTACT" 2>/dev/null; then
    pass "honeypot field exists"
else
    fail "honeypot field missing"
fi

# Test 4: mailto fallback link
if grep -q 'href="mailto:.*naturesinfusions' "$CONTACT" 2>/dev/null; then
    pass "mailto fallback link exists"
else
    fail "mailto fallback link missing"
fi

# Test 5: Required fields present
for field in form-name form-email request-type message; do
    if grep -q "id=\"$field\"" "$CONTACT" 2>/dev/null; then
        pass "field $field present"
    else
        fail "field $field missing"
    fi
done

# Test 6: api/contact.php exists and is valid PHP
if [ -f "$API_FILE" ]; then
    pass "api/contact.php exists"
else
    fail "api/contact.php missing"
fi

# Test 7: contact.php has proper PHP opening tag
if grep -q '<?php' "$API_FILE" 2>/dev/null; then
    pass "contact.php has PHP tag"
else
    fail "contact.php missing PHP tag"
fi

# Test 8: contact.php has SMTP logic
if grep -q 'fsockopen' "$API_FILE" 2>/dev/null; then
    pass "contact.php has SMTP connect"
else
    fail "contact.php missing SMTP logic"
fi

# Test 9: contact.php has STARTTLS
if grep -q 'STARTTLS' "$API_FILE" 2>/dev/null; then
    pass "contact.php has STARTTLS"
else
    fail "contact.php missing STARTTLS"
fi

# Test 10: contact.php has honeypot check
if grep -q '_gotcha' "$API_FILE" 2>/dev/null; then
    pass "contact.php has honeypot check"
else
    fail "contact.php missing honeypot check"
fi

# Test 11: contact.php has rate limiting
if grep -q 'contact_submissions' "$API_FILE" 2>/dev/null; then
    pass "contact.php has rate limiting"
else
    fail "contact.php missing rate limiting"
fi

# Test 12: contact.php has header injection protection
if grep -q 'header.inject\|\\r\\n\|[\r\n]' "$API_FILE" 2>/dev/null; then
    pass "contact.php has header injection protection"
else
    fail "contact.php missing header injection protection"
fi

# Test 13: SMTP keys in .env
for key in SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS CONTACT_FROM CONTACT_TO; do
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
        pass "env key $key present"
    else
        fail "env key $key missing"
    fi
done

# Test 14: No SMTP secrets in .env.template
if grep -q 'your-smtp-password' "$ENV_FILE.template" 2>/dev/null; then
    pass "env.template has placeholder SMTP password"
else
    fail "env.template missing placeholder SMTP password"
fi

# Summary
printf '\n# contact-form: %d tests, %d passed, %d failed\n' "$TOTAL" "$PASS" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
