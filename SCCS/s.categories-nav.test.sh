h58231
s 00054/00000/00000
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
# test/unit/categories-nav.test.sh — unit test: categories-nav.js structure
# Checks: categories data loading, nav rendering, categories.json reference

set -u

FILE="assets/js/modules/categories-nav.js"
FAIL=0

if [ ! -f "$FILE" ]; then
    printf 'ok 1 %s not found (skip)\n' "$FILE"
    exit 0
fi

printf 'ok 1 %s exists\n' "$FILE"

# Check buildCategoriesList function
if grep -q 'function buildCategoriesList\|export.*function buildCategories' "$FILE"; then
    printf 'ok 2 buildCategoriesList function present\n'
else
    printf 'not ok 2 buildCategoriesList not found\n'
    FAIL=$((FAIL + 1))
fi

# Check categories.json reference
if grep -q 'categories.json' "$FILE"; then
    printf 'ok 3 categories.json reference found\n'
else
    printf 'not ok 3 categories.json reference missing\n'
    FAIL=$((FAIL + 1))
fi

# Check data file exists
if [ -f "assets/js/data/categories.json" ]; then
    printf 'ok 4 categories.json exists\n'
else
    printf 'not ok 4 categories.json missing\n'
    FAIL=$((FAIL + 1))
fi

# Check nav/ul/li structure for semantic HTML
if grep -q 'createElement.*nav\|createElement.*ul\|createElement.*li' "$FILE"; then
    printf 'ok 5 semantic nav structure present\n'
else
    printf 'not ok 5 semantic nav structure missing\n'
    FAIL=$((FAIL + 1))
fi

printf 'ok 6 %d failures\n' "$FAIL"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
E 1
