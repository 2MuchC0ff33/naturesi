h30599
s 00076/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
#!/bin/sh
# scripts/awk/csv-stats.awk — Compute statistics from products.csv
# Usage: awk -f scripts/awk/csv-stats.awk assets/js/data/products.csv
# Output: per-category product counts, avg price, min/max prices

BEGIN {
    FS = "|"
    IGNORECASE = 1
    total_products = 0
    total_price = 0
    min_price = 999999
    max_price = 0
}

NR == 1 {
    # Header row: skip
    next
}

NF > 0 {
    # Fields: id|name|slug|category|description|image|inStock|price|options|ingredients
    product_id = $1
    product_name = $2
    category = $4
    price = $8 + 0  # Force numeric

    if (price > 0) {
        total_products++
        total_price += price

        if (price < min_price) min_price = price
        if (price > max_price) max_price = price

        # Per-category stats
        cat_count[category]++
        cat_price_sum[category] += price
        if (!min_cat_price[category] || price < min_cat_price[category]) {
            min_cat_price[category] = price
        }
        if (price > max_cat_price[category]) {
            max_cat_price[category] = price
        }
    }
}

END {
    # Print summary
    printf "=== Products Summary ===\n"
    printf "Total products: %d\n", total_products
    if (total_products > 0) {
        printf "Overall avg price: $%.2f\n", total_price / total_products
        printf "Price range: $%.2f - $%.2f\n", min_price, max_price
    }
    printf "\n=== By Category ===\n"

    # Print per-category stats sorted by category name
    n = 0
    for (c in cat_count) {
        cats[n++] = c
    }
    # Simple sort
    for (i = 0; i < n - 1; i++) {
        for (j = i + 1; j < n; j++) {
            if (cats[i] > cats[j]) {
                tmp = cats[i]; cats[i] = cats[j]; cats[j] = tmp
            }
        }
    }

    for (i = 0; i < n; i++) {
        c = cats[i]
        count = cat_count[c]
        avg = cat_price_sum[c] / count
        printf "%-25s count=%d avg=$%.2f range=$%.2f-$%.2f\n", c, count, avg, min_cat_price[c]+0, max_cat_price[c]+0
    }
}
E 1
