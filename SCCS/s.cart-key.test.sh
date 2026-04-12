h16139
s 00029/00000/00000
d D 1.1 26/04/12 13:56:45 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:45 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
#!/bin/sh
# test/unit/cart-key.test.sh — unit test: consistent cart key naming
# Checks: all JS files reference the same cart storage key

KEY_PATTERN='naturesi[_-]cart'
KEY_COUNT=$(grep -rE "$KEY_PATTERN" assets/js/ --include='*.js' 2>/dev/null | wc -l | tr -d ' ')

if [ "$KEY_COUNT" -eq 0 ] 2>/dev/null; then
    printf 'ok 1 no cart key references found (skip)\n'
    exit 0
fi

printf 'ok 1 found %s cart key reference(s)\n' "$KEY_COUNT"

# Extract all unique cart key values used
KEYS=$(grep -rhE "$KEY_PATTERN" assets/js/ --include='*.js' 2>/dev/null \
    | grep -oE "['\"][a-z_-]+['\"]" \
    | grep -iE 'naturesi' \
    | sort | uniq)

UNIQUE=$(printf '%s\n' "$KEYS" | wc -l | tr -d ' ')
if [ "$UNIQUE" -le 1 ] 2>/dev/null; then
    printf 'ok 2 all cart keys are consistent: %s\n' "$KEYS"
else
    printf 'not ok 2 %s different cart key value(s) found:\n' "$UNIQUE"
    printf '%s\n' "$KEYS" | head -10
fi

exit 0
E 1
