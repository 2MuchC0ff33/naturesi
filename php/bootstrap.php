
<?php
// php/bootstrap.php
// Optional bootstrap: set PHP include_path from environment variable.
// Include this early in your app (e.g., public_html/index.php) or via auto_prepend_file.
//
// When Composer is installed, some callers execute this file standalone
// (notably the post-install-cmd script).  In those cases the autoloader
// isn’t yet loaded and class_exists('Dotenv\\Dotenv') will always return
// false, causing the naive .env parser to be used.  Load the autoloader if
// it’s present so dependencies like vlucas/phpdotenv are discoverable.

use Slim\Factory\AppFactory;
use League\Plates\Engine;

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

// --- Phase 1: Slim & Plates setup ------------------------------------------------

if (!function_exists('asset')) {
    /**
     * URL helper for assets. Prefix with the configured BASE_PATH (if any)
     * and then `/assets/`.
     */
    function asset(string $path): string
    {
        $basePath = getenv('BASE_PATH') ?: '';
        if ($basePath !== '') {
            // Normalise to a single leading slash and no trailing slash.
            $basePath = '/' . trim($basePath, '/');
        }

        return $basePath . '/assets/' . ltrim($path, '/');
    }
}

if (!function_exists('uri')) {
    /**
     * Return the current request URI or empty string when none available.
     */
    function uri(?\Psr\Http\Message\ServerRequestInterface $req = null): string
    {
        if ($req === null) {
            return '';
        }
        return (string) $req->getUri();
    }
}

$app = AppFactory::create();
$basePath = getenv('BASE_PATH') ?: '';
if ($basePath !== '') {
    $app->setBasePath($basePath);
}
$app->addRoutingMiddleware();

// Configure error middleware based on APP_DEBUG; default to false for safety.
$debugFlag = getenv('APP_DEBUG');
$displayErrorDetails = filter_var(
    $debugFlag,
    FILTER_VALIDATE_BOOLEAN,
    ['options' => ['default' => false]]
);
$logErrors = $displayErrorDetails;
$logErrorDetails = $displayErrorDetails;
$app->addErrorMiddleware($displayErrorDetails, $logErrors, $logErrorDetails);
$templates = new Engine(__DIR__ . '/../views');
$templates->registerFunction('asset', 'asset');
$templates->registerFunction('uri', 'uri');

// pilot routes; index.php and tests both benefit from having these defined
$app->get('/', function ($req, $res) use ($templates) {
    $res->getBody()->write($templates->render('pages/index'));
    return $res;
});
$app->get('/about', function ($req, $res) use ($templates) {
    $res->getBody()->write($templates->render('pages/about'));
    return $res;
});
$app->get('/store', function ($req, $res) use ($templates) {
    $res->getBody()->write($templates->render('pages/store'));
    return $res;
});

// static fallback; note ordering is important (last defined)
$app->map(['GET', 'HEAD'], '/{path:.*}', function ($req, $res, $args) {
    $raw = $args['path'];
    if ($raw === '') {
        $path = 'index';
    } else {
        // allow direct .html requests by stripping extension
        if (substr($raw, -5) === '.html') {
            $raw = substr($raw, 0, -5);
        }
        $path = $raw;
    }

    // Resolve base pages directory and normalize the requested path to
    // prevent path traversal outside of pages/.
    $pagesDir = realpath(__DIR__ . '/../pages');
    if ($pagesDir === false) {
        // If the pages directory cannot be resolved, treat as not found.
        throw new \Slim\Exception\HttpNotFoundException($req);
    }

    // Normalize path segments and reject any attempts to traverse upwards.
    $segments = explode('/', $path);
    $normalizedSegments = [];
    foreach ($segments as $segment) {
        if ($segment === '' || $segment === '.') {
            continue;
        }
        if ($segment === '..') {
            // Explicitly reject traversal.
            throw new \Slim\Exception\HttpNotFoundException($req);
        }
        $normalizedSegments[] = $segment;
    }

    $normalizedPath = implode(DIRECTORY_SEPARATOR, $normalizedSegments);
    $file = $pagesDir . DIRECTORY_SEPARATOR . $normalizedPath . '.html';

    $realFile = realpath($file);
    if ($realFile !== false) {
        // Ensure the resolved file remains within the pages directory.
        $pagesDirWithSep = $pagesDir . DIRECTORY_SEPARATOR;
        if (strncmp($realFile, $pagesDirWithSep, strlen($pagesDirWithSep)) === 0 && is_file($realFile)) {
            $res->getBody()->write(file_get_contents($realFile));
            return $res->withHeader('Content-Type', 'text/html');
        }
    }
    throw new \Slim\Exception\HttpNotFoundException($req);
});

// expose instances for tests and simple scripts
$GLOBALS['app'] = $app;
$GLOBALS['templates'] = $templates;

return ['app' => $app, 'templates' => $templates];
