#!/bin/sh
# scripts/lint-accessibility.sh — Accessibility checks
# FAIL on: invalid ARIA roles, positive tabindex, aria-hidden on focusable

set -u

# Valid ARIA roles (from WAI-ARIA spec - comprehensive list)
VALID_ROLES='alert alertdialog application article banner button cell checkbox columnheader combobox complementary contentinfo definition dialog directory document feed figure form grid gridcell group heading img list listbox listitem log main marquee math menu menubar menuitem menuitemcheckbox menuitemradio navigation none note option paragraph presentation progressbar radio radiogroup row rowgroup scrollbar search searchbox separator slider spinbutton status switch tab table tablist tabpanel textbox timer toolbar tooltip tree treegrid treeitem'

ERRORS=0

usage() {
    printf 'usage: %s [file.html...]\n' "$0"
    exit 1
}

if [ $# -eq 0 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    find . -name '*.html' -type f 2>/dev/null | grep -v '/node_modules/' | while IFS= read -r f || [ -n "$f" ]; do
        "$0" "$f"
    done
    exit 0
fi

for FILE in "$@"; do
    if [ ! -f "$FILE" ]; then
        printf 'ERROR: file not found: %s\n' "$FILE" >&2
        ERRORS=$((ERRORS + 1))
        continue
    fi

    printf 'Checking: %s\n' "$FILE"

    # 1. Invalid ARIA role values
    ROLES=$(grep -oE 'role="[^"]+"' "$FILE" 2>/dev/null | sed 's/role="//;s/"//g' | sort | uniq)
    if [ -n "$ROLES" ]; then
        BAD_ROLES=""
        for ROLE in $ROLES; do
            if ! printf '%s' "$VALID_ROLES" | grep -qw "$ROLE"; then
                BAD_ROLES="$BAD_ROLES  $ROLE\n"
            fi
        done
        if [ -n "$BAD_ROLES" ]; then
            printf '  FAIL: invalid ARIA role(s) found:\n'
            printf '%b' "$BAD_ROLES" | head -10
            ERRORS=$((ERRORS + 1))
        else
            printf '  OK: all ARIA roles are valid\n'
        fi
    else
        printf '  OK: no ARIA roles found\n'
    fi

    # 2. Positive tabindex (tabindex="1", tabindex="2", etc.)
    POS_TAB=$(grep -nE 'tabindex\s*=\s*["'\''][1-9][0-9]*["'\'']' "$FILE" 2>/dev/null || true)
    if [ -n "$POS_TAB" ]; then
        printf '  FAIL: positive tabindex found\n'
        printf '%s\n' "$POS_TAB" | head -5
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: no positive tabindex\n'
    fi

    # 3. aria-hidden="true" on focusable elements
    FOCUSABLE_WITH_HIDDEN=$(grep -nE '<(button|a|input|select|textarea)[^>]+aria-hidden\s*=\s*["'\'']true' "$FILE" 2>/dev/null \
        | head -5 || true)
    if [ -n "$FOCUSABLE_WITH_HIDDEN" ]; then
        printf '  FAIL: aria-hidden on focusable element\n'
        printf '%s\n' "$FOCUSABLE_WITH_HIDDEN" | head -5
        ERRORS=$((ERRORS + 1))
    else
        printf '  OK: no aria-hidden on focusable elements\n'
    fi

    # 4. Invalid ARIA states/properties (basic pattern check)
    # Check for common typos like aria-labelld, aria-describedby, etc.
    BAD_ARIA=$(grep -oE 'aria-[a-z]+=' "$FILE" 2>/dev/null \
        | sed 's/=//' \
        | grep -vE '^(aria-label|aria-labelledby|aria-describedby|aria-expanded|aria-hidden|aria-disabled|aria-selected|aria-pressed|aria-checked|aria-current|aria-details|aria-dropeffect|aria-grabbed|aria-haspopup|aria-invalid|aria-level|aria-live|aria-modal|aria-multiline|aria-multiselectable|aria-orientation|aria-owns|aria-placeholder|aria-posinset|aria-readonly|aria-relevant|aria-required|aria-roledescription|aria-rowcount|aria-rowindex|aria-rowspan|aria-selected|aria-setsize|aria-sort|aria-valuemax|aria-valuemin|aria-valuenow|aria-valuetext|aria-controls|aria-autocomplete|aria-activedescendant|aria-atomic|aria-busy|aria-colcount|aria-colindex|aria-colindextext|aria-colspan|aria-controls|aria-describedby|aria-description|aria-errormessage|aria-flowto|aria-keyshortcuts|aria-label|aria-labelledby)$' \
        | head -10 || true)
    if [ -n "$BAD_ARIA" ]; then
        printf '  WARN: potentially invalid aria-* attribute(s)\n'
        printf '%s\n' "$BAD_ARIA" | head -5
    else
        printf '  OK: aria-* attributes appear valid\n'
    fi

    # 5. <a href="#"> should be <button> (informational)
    BAD_HASH_LINKS=$(grep -nE '<a\s+href\s*=\s*["'\'']#["'\''][^>]*>' "$FILE" 2>/dev/null \
        | grep -v 'href="#top"' | head -5 || true)
    if [ -n "$BAD_HASH_LINKS" ]; then
        COUNT=$(printf '%s' "$BAD_HASH_LINKS" | wc -l | tr -d ' ')
        printf '  INFO: %d <a href="#"> found (consider <button> instead)\n' "$COUNT"
    fi

    # 6. Images without alt (should have alt or role="presentation")
    IMGS_WITHOUT_ALT=$(grep -nE '<img[^>]+>' "$FILE" 2>/dev/null \
        | grep -v 'alt=' \
        | grep -v 'role="presentation"' \
        | head -5 || true)
    if [ -n "$IMGS_WITHOUT_ALT" ]; then
        COUNT=$(printf '%s' "$IMGS_WITHOUT_ALT" | wc -l | tr -d ' ')
        printf '  WARN: %d image(s) missing alt attribute\n' "$COUNT"
    else
        IMG_COUNT=$(grep -cE '<img[^>]+>' "$FILE" 2>/dev/null || echo 0)
        printf '  OK: all %d images have alt or role="presentation"\n' "$IMG_COUNT"
    fi

    # 7. Form inputs without labels
    INPUTS=$(grep -cE '<input[^>]*>' "$FILE" 2>/dev/null || echo 0)
    LABEL_FOR=$(grep -cE '<label[^>]+for=' "$FILE" 2>/dev/null || echo 0)
    if [ -n "$INPUTS" ] && [ "$INPUTS" -gt 0 ] 2>/dev/null; then
        if [ -z "$LABEL_FOR" ] || [ "$LABEL_FOR" -eq 0 ] 2>/dev/null; then
            printf '  WARN: %d input(s) found but no <label for=> bindings\n' "$INPUTS"

    else
        printf '  OK: form inputs have label bindings\n'
    fi
        printf '  WARN: %d input(s) found but no <label for=> bindings\n' "$INPUTS"
    else
        printf '  OK: form inputs have label bindings\n'
    fi

    printf '\n'
done

if [ "$ERRORS" -gt 0 ] 2>/dev/null; then
    printf '%d error(s) found.\n' "$ERRORS" >&2
    exit 1
fi

printf 'All checks passed.\n'
exit 0
