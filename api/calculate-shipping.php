<?php
// api/calculate-shipping.php — Server-side shipping calculation
// POST: { "postcode": "6112", "items": [{"id": "product-calming", "qty": 1}], "weight_grams": 50 }
// Returns: { "rate": 13.00, "zone": "national", "parcel_type": "pouch" }

header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(array('error' => 'Method not allowed'), 405);
}

// Read JSON body
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!$input) {
    json_response(array('error' => 'Invalid JSON body'), 400);
}

$postcode = isset($input['postcode']) ? trim($input['postcode']) : '';
if ($postcode === '' || !preg_match('/^\d{4}$/', $postcode)) {
    json_response(array('error' => 'Invalid postcode. Must be 4 digits.'), 400);
}

// Parse postcode to get MMM (Metro/Major/Minor indicator)
$mmm = intval(substr($postcode, 0, 1));

// Determine zone based on WA store location (6147)
$store_postcode = '6147';
$store_mmm = intval(substr($store_postcode, 0, 1));

// Zone calculation logic (matches cartStore.js getPostcodeZone)
$zone = 'national';
if ($mmm === $store_mmm) {
    // Same metro area as store (WA metro = 6)
    $zone = 'sameCity';
} elseif ($mmm >= 2 && $mmm <= 3) {
    // Near metro (regional centers close to metro)
    $zone = 'nearMetro';
} elseif ($mmm >= 4) {
    // Outer Perth / regional
    $zone = 'outerPerth';
}

// Get weight from request (or calculate from items)
$total_weight = 0;
if (isset($input['weight_grams'])) {
    $total_weight = intval($input['weight_grams']);
} elseif (isset($input['items']) && is_array($input['items'])) {
    // Load products to get weights
    $products_path = dirname(__DIR__) . '/assets/js/data/products.json';
    $products_data = json_decode(file_get_contents($products_path), true);
    $products = isset($products_data['products']) ? $products_data['products'] : array();
    
    // Build product index by ID
    $product_index = array();
    foreach ($products as $p) {
        $id = $p['id'] ?? '';
        $sku = $p['sku'] ?? '';
        $product_index[$id] = $p;
        if ($sku && $sku !== $id) {
            $product_index[$sku] = $p;
        }
        // Index options
        if (isset($p['options']) && is_array($p['options'])) {
            foreach ($p['options'] as $opt) {
                $opt_id = $opt['id'] ?? '';
                if ($opt_id) {
                    $product_index[$opt_id] = $p;
                }
            }
        }
    }
    
    // Calculate total weight from items
    foreach ($input['items'] as $item) {
        $item_id = $item['id'] ?? '';
        $qty = intval($item['qty'] ?? 1);
        
        if ($item_id && isset($product_index[$item_id])) {
            $product = $product_index[$item_id];
            // Try to get weight from options first
            $item_weight = 0;
            if (isset($product['options']) && is_array($product['options'])) {
                foreach ($product['options'] as $opt) {
                    if (($opt['id'] ?? '') === $item_id && isset($opt['weight'])) {
                        $item_weight = parse_weight_grams($opt['weight']);
                        break;
                    }
                }
            }
            // Fall back to base product weight
            if ($item_weight === 0 && isset($product['weight'])) {
                $item_weight = parse_weight_grams($product['weight']);
            }
            // Default to 50g if no weight found
            if ($item_weight === 0) {
                $item_weight = 50;
            }
            $total_weight += $item_weight * $qty;
        }
    }
}

if ($total_weight <= 0) {
    $total_weight = 50; // Default minimum
}

// Parcel type based on weight (matches PARCEL_SPECS in cartStore.js)
$parcel_type = 'pouch';
$parcel_specs = array(
    array('type' => 'pouch', 'maxGrams' => 250),
    array('type' => 'satchel', 'maxGrams' => 500),
    array('type' => 'handbag', 'maxGrams' => 1000),
    array('type' => 'shoebox', 'maxGrams' => 3000),
    array('type' => 'briefcase', 'maxGrams' => 5000),
    array('type' => 'carryon', 'maxGrams' => 10000),
    array('type' => 'duffle', 'maxGrams' => 20000),
    array('type' => 'checkin', 'maxGrams' => 25000),
);

foreach ($parcel_specs as $spec) {
    if ($total_weight <= $spec['maxGrams']) {
        $parcel_type = $spec['type'];
        break;
    }
}

// Base rates (matches POSTAGE_RATES in cartStore.js)
$base_rates = array(
    'pouch' => array('sameCity' => 13, 'nearMetro' => 13, 'outerPerth' => 13, 'national' => 13),
    'satchel' => array('sameCity' => 15, 'nearMetro' => 15, 'outerPerth' => 15, 'national' => 15),
    'handbag' => array('sameCity' => 19, 'nearMetro' => 19, 'outerPerth' => 19, 'national' => 19),
    'shoebox' => array('sameCity' => 24, 'nearMetro' => 24, 'outerPerth' => 24, 'national' => 24),
    'briefcase' => array('sameCity' => 29, 'nearMetro' => 29, 'outerPerth' => 29, 'national' => 29),
    'carryon' => array('sameCity' => 35, 'nearMetro' => 35, 'outerPerth' => 35, 'national' => 35),
    'duffle' => array('sameCity' => 55, 'nearMetro' => 55, 'outerPerth' => 55, 'national' => 55),
    'checkin' => array('sameCity' => 75, 'nearMetro' => 75, 'outerPerth' => 75, 'national' => 75),
);

$regional_surcharge = array(
    'pouch' => 0, 'satchel' => 0, 'handbag' => 0, 'shoebox' => 0, 'briefcase' => 0,
    'carryon' => 0, 'duffle' => 0, 'checkin' => 0,
);

$remote_surcharge = array(
    'pouch' => 0, 'satchel' => 0, 'handbag' => 0, 'shoebox' => 0, 'briefcase' => 0,
    'carryon' => 0, 'duffle' => 0, 'checkin' => 0,
);

// Get base rate
$rate = 0;
if (isset($base_rates[$parcel_type]) && isset($base_rates[$parcel_type][$zone])) {
    $rate = $base_rates[$parcel_type][$zone];
}

// Add surcharges for regional/remote
if ($mmm === 4 && isset($regional_surcharge[$parcel_type])) {
    $rate += $regional_surcharge[$parcel_type];
}
if ($mmm >= 5 && isset($remote_surcharge[$parcel_type])) {
    $rate += $remote_surcharge[$parcel_type];
}

// Return result
json_response(array(
    'rate' => $rate,
    'zone' => $zone,
    'parcel_type' => $parcel_type,
    'weight_grams' => $total_weight,
    'postcode' => $postcode,
));

// Helper function to parse weight string to grams
function parse_weight_grams($wstr) {
    if (empty($wstr)) return 0;
    
    // Extract number from string
    if (preg_match('/([0-9.]+)/', $wstr, $matches)) {
        $val = floatval($matches[1]);
        // Check for unit
        if (stripos($wstr, 'kg') !== false) {
            return intval($val * 1000);
        }
        return intval($val);
    }
    return 0;
}