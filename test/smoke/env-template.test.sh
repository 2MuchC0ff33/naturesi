#!/usr/bin/env yash
# test/smoke/env-template.test.sh — smoke test: .env.template has expected keys
# Checks: all required keys are present in .env.template

TEMPLATE=".env.template"

if [ ! -f "$TEMPLATE" ]; then
    printf 'not ok 1 %s not found\n' "$TEMPLATE"
    exit 1
fi
printf 'ok 1 %s exists\n' "$TEMPLATE"

# Required keys (at minimum, PAYPAL_EMAIL and SITE_BASE_URL must be present)
REQUIRED="PAYPAL_EMAIL SITE_BASE_URL"
COUNT=2

for KEY in $REQUIRED; do
    if grep -qE "^${KEY}=" "$TEMPLATE" 2>/dev/null; then
        printf 'ok %d %s key present\n' "$COUNT" "$KEY"
    else
        printf 'not ok %d %s key present\n' "$COUNT" "$KEY"
    fi
    COUNT=$((COUNT + 1))
done

# .env.template should NOT contain real values (no @, no example.com patterns for email)
REAL_EMAIL=$(grep -E '^PAYPAL_EMAIL=[^ ]+@' "$TEMPLATE" 2>/dev/null | grep -v 'example.org\|your-' || true)
if [ -z "$REAL_EMAIL" ]; then
    printf 'ok %d PAYPAL_EMAIL does not contain a real email\n' "$COUNT"
else
    printf 'not ok %d PAYPAL_EMAIL contains a real email\n' "$COUNT"
fi

exit 0
