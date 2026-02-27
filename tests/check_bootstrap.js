const fs = require('fs');
const { execSync } = require('child_process');

function assert(condition, message) {
  if (!condition) {
    console.error('Assertion failed:', message);
    process.exit(1);
  }
}

// ensure composer autoloader is present
assert(fs.existsSync('vendor/autoload.php'), 'vendor/autoload.php must exist; run composer install first');

// create a temporary .env with a known value; bootstrap should read this via phpdotenv
fs.writeFileSync('.env', 'TEST_BOOTSTRAP=ok\n', 'utf-8');

let output;
try {
  output = execSync("php -r \"require 'php/bootstrap.php';\n" +
    "echo getenv('TEST_BOOTSTRAP');\"", { encoding: 'utf-8' });
} catch (e) {
  console.error('php command failed:', e.message);
  process.exit(1);
}

output = output.trim();
assert(output === 'ok', `bootstrap did not load TEST_BOOTSTRAP (got '${output}')`);

console.log('bootstrap dotenv loading works');
