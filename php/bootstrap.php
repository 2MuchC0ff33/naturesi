<?php
// php/bootstrap.php
// Optional bootstrap: set PHP include_path from environment variable.
// Include this early in your app (e.g., public/index.php) or via auto_prepend_file.
//
// When Composer is installed, some callers execute this file standalone
// (notably the post-install-cmd script).  In those cases the autoloader
// isn’t yet loaded and class_exists('Dotenv\\Dotenv') will always return
// false, causing the naive .env parser to be used.  Load the autoloader if
// it’s present so dependencies like vlucas/phpdotenv are discoverable.

$autoload = __DIR__ . '/../vendor/autoload.php';
if (is_readable($autoload)) {
  require_once $autoload;
}

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
    // composer-installed dotenv is available.  The real library reads the
    // file and then writes variables into $_ENV/$_SERVER but (by design)
    // doesn’t call putenv().  Since some callers (and our tests) expect
    // getenv() to work, we mirror the results here and set a marker
    // variable so automated checks can tell which branch executed.
    $dotenvClass = 'Dotenv\\Dotenv';
    // load() returns the array of variables it wrote.  Accept anything but
    // treat non-array results as an empty set (the stub in tests uses
    // this behaviour).
    $loaded = $dotenvClass::createImmutable(__DIR__ . '/../')->load();
    if (is_array($loaded)) {
      foreach ($loaded as $k => $v) {
        if ($v !== null) {
          putenv("$k=$v");
          $_ENV[$k] = $v;
          $_SERVER[$k] = $v;
        }
      }
    }

    // mark that the phpdotenv branch executed
    putenv('DOTENV_USED=1');
    $_ENV['DOTENV_USED'] = '1';
    $_SERVER['DOTENV_USED'] = '1';
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
