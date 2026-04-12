#!/bin/sh
# scripts/jq/validate-paypal.jq — Validate paypal.json structure
# Purpose: Ensure paypal.json has correct production credentials (SDK mode)
# Usage: jq -f scripts/jq/validate-paypal.jq assets/js/data/paypal.json
# Or: cat assets/js/data/paypal.json | jq -f scripts/jq/validate-paypal.jq
# Exit: 0 = valid, 1 = invalid

def check_required:
  if .env == null then "ERROR: .env is required"
  elif (.useSdk == true) and (.clientId | length) == 0 then
    "ERROR: useSdk=true requires clientId"
  elif (.useSdk == true) and (.clientId | test("^(null|undefined)$")) then
    "ERROR: clientId cannot be null or undefined"
  else empty
  end;

def check_production:
  if .env == "production" then
    if .email != null and (.email | test("example\\.com$")) then
      "ERROR: production .email should not be example.com"
    elif (.sandboxMerchant | length) > 0 then
      "WARN: .sandboxMerchant should be removed in production mode"
    else empty
    end
  elif .env == "sandbox" then
    if .sandboxMerchant == null or .sandboxMerchant == "" then
      "WARN: sandbox mode without .sandboxMerchant"
    else empty
    end
  else
    "ERROR: .env must be \"production\" or \"sandbox\""
  end;

def check_email:
  if .email != null and (.email | test("@")) | not then
    "ERROR: .email appears invalid (no @)"
  else empty
  end;

def check_intent_case:
  if .useSdk == true and .intent != null then
    if (.intent | test("^[A-Z]+$")) then
      "ERROR: intent must be lowercase (e.g. \"capture\"), got: \"\(.intent)\""
    elif (.intent | test("capture|sale|authorize")) | not then
      "WARN: intent \"\(.intent)\" is not a known value (expected: capture, sale, authorize)"
    else empty
    end
  else empty
  end;

def check_sdk_url_params:
  if .useSdk == true and .clientId != null and (.clientId | test("^(null|undefined)$")) | not then
    if .intent != null and (.intent | test("^[A-Z]+$")) then
      "ERROR: SDK URL would include uppercase intent=\"\(.intent)\" — PayPal SDK rejects this"
    else empty
    end
  else empty
  end;

def check_sdk_mode:
  if .useSdk == true then
    if .intent == null then
      "WARN: useSdk=true should specify intent (default: capture)"
    else empty
    end
  else empty
  end;

"Checking paypal.json...",
check_required,
check_production,
check_email,
check_intent_case,
check_sdk_url_params,
check_sdk_mode,
"OK: paypal.json is valid"
