<?php

use PHPUnit\Framework\TestCase;

class BootstrapTest extends TestCase
{
    private string $origEnvPath;

    protected function setUp(): void
    {
        // remember existing .env if any so we can restore it
        $this->origEnvPath = __DIR__ . '/../.env';
        if (file_exists($this->origEnvPath)) {
            rename($this->origEnvPath, $this->origEnvPath . '.bak');
        }

        // ensure vendor autoloader stub
        $autoload = __DIR__ . '/../vendor/autoload.php';
        if (!is_file($autoload)) {
            if (!is_dir(dirname($autoload))) {
                mkdir(dirname($autoload), 0777, true);
            }
            $stub = <<<'PHP'
<?php
namespace Dotenv;

class Dotenv
{
    private string $dir;

    public_html static function createImmutable($dir)
    {
        $instance = new self();
        $instance->dir = $dir;
        return $instance;
    }

    public_html function load()
    {
        // naive .env loader roughly matching our fallback logic above;
        // return an array so the bootstrap propagation loop can work.
        $result = [];
        $path = rtrim($this->dir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.env';
        if (is_file($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
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
                if ((strlen($val) >= 2) && (($val[0] === '"' && substr($val, -1) === '"') || ($val[0] === "'" && substr($val, -1) === "'"))) {
                    $val = substr($val, 1, -1);
                }
                putenv("$key=$val");
                $_ENV[$key] = $val;
                $_SERVER[$key] = $val;
                $result[$key] = $val;
            }
        }
        // mark that the phpdotenv branch executed
        putenv('DOTENV_USED=1');
        $_ENV['DOTENV_USED'] = '1';
        $_SERVER['DOTENV_USED'] = '1';
        return $result;
    }
}
PHP;
            file_put_contents($autoload, $stub);
        }

        // create .env file with known key
        file_put_contents(__DIR__ . '/../.env', "TEST_BOOTSTRAP=ok\n");

        // clear any existing environment variable
        putenv('DOTENV_USED');
        unset($_ENV['DOTENV_USED'], $_SERVER['DOTENV_USED']);
        // also clear TEST_BOOTSTRAP so prior runs don't interfere
        putenv('TEST_BOOTSTRAP');
        unset($_ENV['TEST_BOOTSTRAP'], $_SERVER['TEST_BOOTSTRAP']);
    }

    protected function tearDown(): void
    {
        // restore or remove .env
        if (file_exists(__DIR__ . '/../.env')) {
            unlink(__DIR__ . '/../.env');
        }
        if (file_exists($this->origEnvPath . '.bak')) {
            rename($this->origEnvPath . '.bak', $this->origEnvPath);
        }
    }

    public_html function testBootstrapPrefersPhpDotenv(): void
    {
        // phpunit.xml already includes php/bootstrap.php via the bootstrap
        // attribute, so the file has been loaded before setUp() ran.  That
        // initial invocation saw no .env file.  We explicitly require the
        // script again (not once) to force a second pass now that our test
        // has created the file and cleared the environment.
        require __DIR__ . '/../php/bootstrap.php';

        $this->assertSame('ok', getenv('TEST_BOOTSTRAP'));
        $this->assertSame('1', getenv('DOTENV_USED'), 'expected phpdotenv branch to run');
    }
}
