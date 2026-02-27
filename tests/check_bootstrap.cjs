const fs = require('fs');
const { execSync } = require('child_process');

function assert(condition, message) {
  if (!condition) {
    console.error('Assertion failed:', message);
    process.exit(1);
  }
}

// ensure a vendor autoloader exists; if not, create a minimal one that defines
// Dotenv\Dotenv.  That class will set a marker variable when its load() method
// runs, allowing us to verify that the "composer" branch is taken.
if (!fs.existsSync('vendor/autoload.php')) {
  fs.mkdirSync('vendor', { recursive: true });
  const stub = `<?php
namespace Dotenv;

class Dotenv {
    public static function createImmutable($dir) {
        return new self();
    }
    public function load() {
        // mark that the phpdotenv branch executed
        putenv('DOTENV_USED=1');
        $_ENV['DOTENV_USED'] = '1';
        $_SERVER['DOTENV_USED'] = '1';
    }
}
`;
  fs.writeFileSync('vendor/autoload.php', stub, 'utf-8');
}

// create a temporary .env (not really used by the stub) just in case
fs.writeFileSync('.env', 'TEST_BOOTSTRAP=ok\n', 'utf-8');

let output;
try {
  // verify both that the branch ran and that getenv() sees the key
  output = execSync("php -r \"require 'php/bootstrap.php'; echo getenv('TEST_BOOTSTRAP');\"", { encoding: 'utf-8' });
} catch (e) {
  console.error('php command failed:', e.message);
  process.exit(1);
}

output = output.trim();
assert(output === 'ok', `bootstrap did not load TEST_BOOTSTRAP (got '${output}')`);

const used = execSync("php -r \"require 'php/bootstrap.php'; echo getenv('DOTENV_USED');\"", { encoding: 'utf-8' }).trim();
assert(used === '1', 'expected phpdotenv branch to run');

console.log('bootstrap dotenv loading works');
