h06318
s 00032/00000/00000
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
# test/unit/json-parse.test.sh — unit test: all JSON files parse without error
# Uses jq for parsing validation

JSON_FILES=$(mktemp)
find . -name '*.json' -type f 2>/dev/null | grep -v '/node_modules/' | grep -v '/dist/' > "$JSON_FILES"
TOTAL=$(wc -l < "$JSON_FILES" | tr -d ' ')
COUNT=0
FAIL=0

if [ "$TOTAL" -eq 0 ] 2>/dev/null; then
    printf 'ok 1 no JSON files found (skip)\n'
    rm -f "$JSON_FILES"
    exit 0
fi

printf 'ok 1 found %d JSON file(s)\n' "$TOTAL"

while IFS= read -r FILE; do
    COUNT=$((COUNT + 1))
    if jq . "$FILE" >/dev/null 2>&1; then
        printf 'ok %d valid JSON: %s\n' $((COUNT + 1)) "$FILE"
    else
        printf 'not ok %d valid JSON: %s\n' $((COUNT + 1)) "$FILE"
        FAIL=$((FAIL + 1))
    fi
done < "$JSON_FILES"

rm -f "$JSON_FILES"
printf 'ok %d %d files checked (%d failures)\n' $((TOTAL + 2)) "$TOTAL" "$FAIL"

exit 0
E 1
