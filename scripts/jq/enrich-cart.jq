def enrich_item(prods):
  . as $item |
  prods | map(select(.id == $item.id or .sku == $item.id)) | .[0] as $p
  | if $p then
      $item + {
        name: ($p.name // $item.name),
        image: ($p.image // null),
        category: ($p.category // null),
        options: ($p.options // [])
      }
    else $item
    end;

($products.products // $products) as $prods |
.items | map(enrich_item($prods))
