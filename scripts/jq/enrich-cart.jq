# scripts/jq/enrich-cart.jq  Enrich cart items with product metadata
# Usage: jq -f scripts/jq/enrich-cart.jq --argfile products products.json cart.json
# Given cart items and products, adds name, image, options to cart items

def enrich_item(item):
  .products | map(select(.id == item.id or .sku == item.id)) | .[0] as $p
  | if $p then
      item + {
        name: ($p.name // item.name),
        image: ($p.image // null),
        category: ($p.category // null),
        options: ($p.options // [])
      }
    else item
    end;

.products as $products |
.items | map(enrich_item($products))
