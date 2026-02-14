#!/bin/bash
# List of HTML files to process (excluding google-site-verification.html and yandex_7847a6427bfa1388.html)
files=(
	"404.html"
	"index.html"
	"offline.html"
	"search.html"
	"pages/about.html"
	"pages/cart.html"
	"pages/checkout.html"
	"pages/contact.html"
	"pages/payment/fail.html"
	"pages/payment/success.html"
	"pages/shipping-estimate.html"
	"pages/social.html"
	"pages/stockists.html"
	"pages/store.html"
	"pages/store/accessories.html"
	"pages/store/artisan-blends.html"
	"pages/store/balms.html"
	"pages/store/black-tea.html"
	"pages/store/creams.html"
	"pages/store/green-tea.html"
	"pages/store/herbal-infusions.html"
	"pages/store/ice-tea.html"
	"pages/store/selfcare.html"
	"pages/store/wellness-blends.html"
	"pages/terms.html"
)

# Function to run tidy iteratively
run_tidy() {
	local file="$1"
	local rel_file="$file"
	mkdir -p "dist/$(dirname "$rel_file")"
	local log_file="tidy_errors_${file//\//_}.log"
	local attempts=0
	while [ $attempts -lt 3 ]; do
		tidy -o "dist/$rel_file" "$rel_file" 2>"$log_file"
		local exit_code=$?
		if [ $exit_code -eq 0 ]; then
			echo "Fixed $file successfully (no errors/warnings)"
			rm -f "$log_file"
			return 0
		elif [ $exit_code -eq 2 ]; then
			echo "Errors in $file (attempt $((attempts + 1))), re-running"
			attempts=$((attempts + 1))
		else
			echo "Warnings in $file, but proceeding as they are not fixable by tidy. Check $log_file"
			return 0
		fi
	done
	echo "Max attempts reached for $file due to errors, manual review needed. Check $log_file"
}

# Run tidy on all files
for file in "${files[@]}"; do
	run_tidy "$file"
done

# Run minify on all tidied files
for file in "${files[@]}"; do
	rel_file="$file"
	minify -o "dist/$rel_file" "dist/$rel_file"
	echo "Minified dist/$rel_file"
done

echo "All processing complete. Check dist/ for outputs and any error logs."
