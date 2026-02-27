<?php
// php/bootstrap.php
// Optional bootstrap: set PHP include_path from environment variable.
// Include this early in your app (e.g., public/index.php) or via auto_prepend_file.

$path = getenv('PHP_INCLUDE_PATH');
if ($path !== false && $path !== '') {
  ini_set('include_path', $path . PATH_SEPARATOR . get_include_path());
}

// If you use vlucas/phpdotenv, load it before calling getenv():
// Dotenv\Dotenv::createImmutable(__DIR__ . '/../')->load();
