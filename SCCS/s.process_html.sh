h30692
s 00071/00000/00000
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
# scripts/process_html.sh — POSIX: process HTML files with Tidy (run once, fail fast)

set -u

# Create Tidy config file inline
cat > tidy_config.txt <<'EOF'
force-output: yes
clean: yes
accessibility-check: 1
indent: auto
wrap: 0
quiet: yes
EOF

# Find HTML files, excluding verification files
# Use a temp file to avoid arrays
TMP_FILES=$(mktemp)
find . -name '*.html' \
    ! -name 'google-site-verification.html' \
    ! -name 'yandex_*.html' | sort > "$TMP_FILES"

# Function to run tidy once
run_tidy() {
    file="$1"
    rel_file="${file#./}"  # Remove leading ./
    mkdir -p "dist/$(dirname "$rel_file")"
    # Replace slashes with underscores for log file name
    log_file=$(printf '%s' "tidy_errors_${rel_file}" | tr '/' '_')

    tidy -config tidy_config.txt -o "dist/$rel_file" "$rel_file" 2>"$log_file"
    exit_code=$?

    if [ "$exit_code" -eq 0 ]; then
        echo "Fixed $file successfully (no errors/warnings)"
        rm -f "$log_file"
    elif [ "$exit_code" -eq 2 ]; then
        echo "Errors in $file. Log: $PWD/$log_file"
        echo "Key errors:"
        head -20 "$log_file"  # Print first 20 lines of log for visibility
        rm -f tidy_config.txt "$TMP_FILES"
        exit 1  # Fail fast
    else
        echo "Warnings in $file, proceeding. Log: $PWD/$log_file"
        echo "Key warnings:"
        head -10 "$log_file"
    fi
}

# Run tidy on all files
while IFS= read -r file; do
    run_tidy "$file"
done < "$TMP_FILES"

# Clean up config and temp file
rm -f tidy_config.txt "$TMP_FILES"

# Run minify on all tidied files
TMP_FILES2=$(mktemp)
find . -name '*.html' \
    ! -name 'google-site-verification.html' \
    ! -name 'yandex_*.html' | sort > "$TMP_FILES2"

while IFS= read -r file; do
    rel_file="${file#./}"
    minify -o "dist/$rel_file" "dist/$rel_file"
    echo "Minified dist/$rel_file"
done < "$TMP_FILES2"

rm -f "$TMP_FILES2"
echo "All processing complete. Outputs in dist/"
E 1
