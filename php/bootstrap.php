<?php
// php/bootstrap.php
// Optional bootstrap: set PHP include_path from environment variable.
// Include this early in your app (e.g., public/index.php) or via auto_prepend_file.

$path = getenv('PHP_INCLUDE_PATH');
if ($path !== false && $path !== '') {
  ini_set('include_path', $path . PATH_SEPARATOR . get_include_path());
}

// Environment file loader. We try to use vlucas/phpdotenv if
// available; otherwise fall back to a tiny in‑house parser that meets our
// Phase 0 requirement of "is .env read in?".  The parser is intentionally
// simple and will treat each non‑comment, non‑empty line as KEY=VALUE.  It
// strips surrounding quotes but does not perform advanced escaping.

if (file_exists(__DIR__ . '/../.env')) {
  if (class_exists('Dotenv\\Dotenv')) {
    // composer-installed dotenv is available
    // Reference the class name as a string to avoid static-analysis
    // warnings about an undefined type while still calling it at runtime.
    $dotenvClass = 'Dotenv\\Dotenv';
    $dotenvClass::createImmutable(__DIR__ . '/../')->load();
  } else {
    // naive parser fallback
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $ln) {
      $ln = trim($ln);
      if ($ln === '' || $ln[0] === '#') {
        continue;
      }
      if (strpos($ln, '=') === false) {
        continue;
      }
      list($key, $val) = explode('=', $ln, 2);
      $key = trim($key);
      $val = trim($val);
      // remove surrounding quotes if present
      if ((strlen($val) >= 2) && (($val[0] === '"' && substr($val, -1) === '"') || ($val[0] === "'" && substr($val, -1) === "'"))) {
        $val = substr($val, 1, -1);
      }
      putenv("$key=$val");
      $_ENV[$key] = $val;
      $_SERVER[$key] = $val;
    }
  }
}
