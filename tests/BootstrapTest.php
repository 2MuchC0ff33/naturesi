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
    public static function createImmutable($dir)
    {
        return new self();
    }

    public function load()
    {
        // mark that the phpdotenv branch executed
        putenv('DOTENV_USED=1');
        $_ENV['DOTENV_USED'] = '1';
        $_SERVER['DOTENV_USED'] = '1';
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

    public function testBootstrapPrefersPhpDotenv(): void
    {
        require_once __DIR__ . '/../php/bootstrap.php';

        $this->assertSame('ok', getenv('TEST_BOOTSTRAP'));
        $this->assertSame('1', getenv('DOTENV_USED'), 'expected phpdotenv branch to run');
    }
}
