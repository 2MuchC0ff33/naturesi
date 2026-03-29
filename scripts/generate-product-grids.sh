#!/usr/bin/env sh
# scripts/generate-product-grids.sh — POSIX script to generate static HTML product grids from CSV
# Reads products.csv, generates .inc.html partials for each category with products
# Output: assets/html/partials/products/*.inc.html
# Usage: scripts/generate-product-grids.sh [csv_path]

CSV="${1:-assets/js/data/products.csv}"
OUT_DIR="assets/html/partials/products"

if [ ! -f "$CSV" ]; then
    printf 'ERROR: CSV file not found: %s\n' "$CSV" >&2
    exit 1
fi

# Create temp dir for category data
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT INT TERM

# Supported categories (order matters)
CATEGORIES="wellness-blends artisan-blends ice-tea black-tea green-tea balms creams selfcare accessories herbal-infusions"

mkdir -p "$OUT_DIR"

escape_html() {
    printf '%s' "$1" | sed -e 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g; s/'"'"'/\&#39;/g'
}

get_disclaimer() {
    case "$1" in
        balms|creams|selfcare)
            printf '%s' 'For external use only. Avoid contact with eyes. Discontinue use if irritation occurs. Not intended to diagnose, treat, cure, or prevent any disease.'
            ;;
        *)
            printf '%s' 'This product is not intended to diagnose, treat, cure, or prevent any disease. Always consult with a healthcare provider before starting any new supplement or wellness regimen.'
            ;;
    esac
}

get_disclaimer_title() {
    case "$1" in
        balms|creams|selfcare)
            printf '%s' 'Important Information'
            ;;
        *)
            printf '%s' 'Important Disclaimer'
            ;;
    esac
}

gen_product() {
    _id="$1"
    _name="$2"
    _cat="$3"
    _desc="$4"
    _img="$5"
    _inStock="$6"
    _opts="$7"
    _ing="$8"

    id_esc=$(escape_html "$_id")
    name_esc=$(escape_html "$_name")
    cat_esc=$(escape_html "$_cat")
    desc_esc=$(escape_html "$_desc")
    img_esc=$(escape_html "$_img")
    ing_esc=$(escape_html "$_ing")

    if [ "$_inStock" = "true" ]; then
        stock_text="In Stock"
        stock_icon="&#10003; "
        availability='href="https://schema.org/InStock"'
    else
        stock_text="Out of Stock"
        stock_icon=""
        availability='href="https://schema.org/OutOfStock"'
    fi

    disclaimer=$(get_disclaimer "$_cat")
    disclaimer_title=$(get_disclaimer_title "$_cat")
    disclaimer_esc=$(escape_html "$disclaimer")

    options_html=""
    if [ -n "$_opts" ] && printf '%s' "$_opts" | grep -qE '^\['; then
        opts_count=$(printf '%s' "$_opts" | tr -d '\n' | grep -o '"id"' | wc -l | tr -d ' \n')
        if [ "${opts_count:-0}" -gt 1 ]; then
            _opts_file="${TMPDIR}/opts_$$_$(awk 'BEGIN{srand();printf "%d",rand()*32767}').tmp"
            printf '%s' "$_opts" | awk -v id_esc="$id_esc" -v checked=" checked" '
            BEGIN { RS="\\{"; FS="," }
            NF > 0 {
                gsub(/"/, "", $0)
                id_val = label_val = price_val = ""
                for (i = 1; i <= NF; i++) {
                    if ($i ~ /^id:/) { sub(/^id:/, "", $i); id_val = $i }
                    if ($i ~ /^label:/) { sub(/^label:/, "", $i); label_val = $i }
                    if ($i ~ /^price:/) { sub(/^price:/, "", $i); price_val = $i }
                }
                if (id_val != "" && label_val != "") {
                    printf "<label class=\"u-d-flex u-items-center u-gap-2\">"
                    printf "<input type=\"radio\" name=\"product-option-%s\" value=\"%s\"%s data-price=\"%s\">", id_esc, id_val, checked, price_val
                    printf "%s ($%s)</label>\n", label_val, price_val
                    checked = ""
                }
            }' > "$_opts_file"
            options_html=$(cat "$_opts_file")
            rm -f "$_opts_file"
        fi
    fi

    qty_html='      <div class="quantity-selector">
        <label for="qty-'${id_esc}'">Quantity:</label>
        <select id="qty-'${id_esc}'" name="quantity" min="1" max="10" required>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </div>'

    # Output the article HTML
    printf '%s\n' "<article id=\"${id_esc}\" class=\"product product-card\" itemprop=\"itemListElement\" itemscope itemtype=\"https://schema.org/Product\" data-image=\"${img_esc}\" data-sku=\"${id_esc}\">"
    printf '%s\n' "  <header>"
    printf '%s\n' "    <figure class=\"product-gallery product-card__media\">"
    printf '%s\n' "      <picture>"
    printf '%s\n' "        <source srcset=\"${img_esc}\" type=\"image/webp\">"
    printf '%s\n' "        <img src=\"${img_esc}\" alt=\"${name_esc}\" width=\"300\" height=\"300\" loading=\"lazy\" itemprop=\"image\" class=\"u-img-cover\">"
    printf '%s\n' "      </picture>"
    printf '%s\n' "    </figure>"
    printf '%s\n' "    <h3 itemprop=\"name\">${name_esc}</h3>"
    printf '%s\n' "    <div class=\"availability\" itemprop=\"offers\" itemscope itemtype=\"https://schema.org/Offer\">"
    printf '%s\n' "      <link itemprop=\"availability\" ${availability}>"
    printf '%s\n' "      <meta itemprop=\"priceCurrency\" content=\"AUD\">"
    printf '%s\n' "      <p>${stock_icon}<span itemprop=\"itemCondition\">${stock_text}</span></p>"
    printf '%s\n' "    </div>"
    printf '%s\n' "  </header>"
    printf '%s\n' "  <section class=\"product-description\" itemprop=\"description\">"
    printf '%s\n' "    <p>${desc_esc}</p>"
    printf '%s\n' "  </section>"
    printf '%s\n' "  <form action=\"/add-to-cart\" method=\"post\" class=\"product-options add-to-cart\" data-product=\"${id_esc}\" data-sku=\"${id_esc}\">"
    printf '%s\n' "    <fieldset>"
    printf '%s\n' "      <legend>Product Options</legend>"
    if [ -n "$options_html" ]; then
        printf '%s\n' "      <div class=\"product-options-list\" role=\"radiogroup\" aria-label=\"Select size\">${options_html}"
        printf '%s\n' "      </div>"
    fi
    printf '%s\n' "${qty_html}"
    printf '%s\n' "      <button type=\"submit\">Add to Cart</button>"
    printf '%s\n' "    </fieldset>"
    printf '%s\n' "  </form>"

    if [ -n "$_ing" ] && [ "$_ing" != "null" ] && [ "$_ing" != "" ]; then
        printf '%s\n' "  <section class=\"product-ingredients\" itemprop=\"nutrition\" itemscope itemtype=\"https://schema.org/NutritionInformation\">"
        printf '%s\n' "    <h4>Ingredients</h4>"
        printf '%s\n' "    <p itemprop=\"ingredients\">${ing_esc}</p>"
        printf '%s\n' "    <p><small>Sourced from multiple origins</small></p>"
        printf '%s\n' "  </section>"
        printf '%s\n' "  <footer class=\"product-disclaimer\">"
        printf '%s\n' "    <details>"
        printf '%s\n' "      <summary><small>${disclaimer_title}</small></summary>"
        printf '%s\n' "      <p itemprop=\"disambiguatingDescription\"><small>${disclaimer_esc}</small></p>"
        printf '%s\n' "    </details>"
        printf '%s\n' "  </footer>"
    fi

    printf '%s\n' "</article>"
}

# Read CSV and write each row to category-specific temp files
while IFS= read -r line; do
    # Skip header
    case "$line" in id\|*) continue ;; esac

    # Extract fields (pipe-separated)
    id=$(printf '%s' "$line" | cut -d'|' -f1)
    name=$(printf '%s' "$line" | cut -d'|' -f2)
    slug=$(printf '%s' "$line" | cut -d'|' -f3)
    cat=$(printf '%s' "$line" | cut -d'|' -f4)
    desc=$(printf '%s' "$line" | cut -d'|' -f5)
    img=$(printf '%s' "$line" | cut -d'|' -f6)
    inStock=$(printf '%s' "$line" | cut -d'|' -f7)
    opts=$(printf '%s' "$line" | cut -d'|' -f9)
    ing=$(printf '%s' "$line" | cut -d'|' -f10-)

    # Skip if no category or no id
    [ -z "$cat" ] && continue
    [ -z "$id" ] && continue

    # Store in temp file (one file per category)
    cat_file="${TMPDIR}/${cat}.tmp"
    printf '%s|%s|%s|%s|%s|%s|%s|%s\n' "$id" "$name" "$cat" "$desc" "$img" "$inStock" "$opts" "$ing" >> "$cat_file"

done < "$CSV"

# Generate HTML for each category
total=0
for cat in $CATEGORIES; do
    cat_file="${TMPDIR}/${cat}.tmp"

    if [ ! -s "$cat_file" ]; then
        continue
    fi

    out_file="${OUT_DIR}/${cat}.inc.html"
    printf 'Generating %s\n' "$out_file"

    {
        printf '<!-- Generated by scripts/generate-product-grids.sh from products.csv -->\n'
        printf '<div class="product-grid" data-category="%s">\n' "$cat"

        while IFS='|' read -r pid pname pcat pdesc pimg pinstock popts ping; do
            gen_product "$pid" "$pname" "$pcat" "$pdesc" "$pimg" "$pinstock" "$popts" "$ping"
        done < "$cat_file"

        printf '</div>\n'
    } > "$out_file"

    count=$(wc -l < "$cat_file" | tr -d ' \n')
    printf '  OK: %s product(s)\n' "$count"
    total=$((total + count))
done

printf 'Done. Generated %s product(s) in %s/\n' "$total" "$OUT_DIR"
