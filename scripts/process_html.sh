#!/bin/bash
# Process HTML files with Tidy (run once, fail fast on errors)

# Create Tidy config file inline
cat > tidy_config.txt <<EOF
force-output: yes
clean: yes
accessibility-check: 1
indent: auto
wrap: 0
quiet: yes
EOF

# Find HTML files, excluding verification files
files=($(find . -name "*.html" -not -name "google-site-verification.html" -not -name "yandex_*.html" | sort))

# Function to run tidy once
run_tidy() {
    local file="$1"
    local rel_file="${file#./}"  # Remove leading ./
    mkdir -p "dist/$(dirname "$rel_file")"
    local log_file="tidy_errors_${rel_file//\//_}.log"

    tidy -config tidy_config.txt -o "dist/$rel_file" "$rel_file" 2>"$log_file"
    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo "Fixed $file successfully (no errors/warnings)"
        rm -f "$log_file"
        return 0
    elif [ $exit_code -eq 2 ]; then
        echo "Errors in $file. Log: $PWD/$log_file"
        echo "Key errors:"
        head -20 "$log_file"  # Print first 20 lines of log for visibility
        rm -f tidy_config.txt
        exit 1  # Fail fast
    else
        echo "Warnings in $file, proceeding. Log: $PWD/$log_file"
        echo "Key warnings:"
        head -10 "$log_file"
        return 0
    fi
}

# Run tidy on all files
for file in "${files[@]}"; do
    run_tidy "$file"
done

# Clean up config
rm -f tidy_config.txt

# Run minify on all tidied files
for file in "${files[@]}"; do
    rel_file="${file#./}"
    minify -o "dist/$rel_file" "dist/$rel_file"
    echo "Minified dist/$rel_file"
done

echo "All processing complete. Outputs in dist/"
