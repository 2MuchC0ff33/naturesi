h58158
s 00018/00000/00000
d D 1.1 26/04/12 13:56:45 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:45 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
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
E 1
