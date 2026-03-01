<?php

use PHPUnit\Framework\TestCase;
use Slim\Psr7\Factory\ServerRequestFactory;

class SlimRoutesTest extends TestCase
{
    private $app;

    protected function setUp(): void
    {
        $loaded = require __DIR__ . '/../php/bootstrap.php';
        $this->app = $loaded['app'];
    }

    private function handle(string $method, string $path)
    {
        $req = (new ServerRequestFactory())->createServerRequest($method, $path);
        return $this->app->handle($req);
    }

    public function testHomePage(): void
    {
        $res = $this->handle('GET', '/');
        $this->assertSame(200, $res->getStatusCode());
        $body = (string)$res->getBody();
        $this->assertStringContainsString('Welcome to Nature', $body);
    }

    public function testAboutPage(): void
    {
        $res = $this->handle('GET', '/about');
        $this->assertSame(200, $res->getStatusCode());
        $this->assertStringContainsString('<h1>About Us</h1>', (string)$res->getBody());
    }

    public function testStorePage(): void
    {
        $res = $this->handle('GET', '/store');
        $this->assertSame(200, $res->getStatusCode());
        $this->assertStringContainsString('Browse our products', (string)$res->getBody());
    }

    public function testStaticFallback(): void
    {
        // create a temp static page file with a unique name to avoid conflicts
        $slug = 'foo_' . bin2hex(random_bytes(8));
        $path = __DIR__ . '/../pages/' . $slug . '.html';

        try {
            file_put_contents($path, '<p>fallback content</p>');

            $res = $this->handle('GET', '/' . $slug);
            $this->assertSame(200, $res->getStatusCode());
            $this->assertStringContainsString('fallback content', (string)$res->getBody());

            // also exercise .html variant
            $res2 = $this->handle('GET', '/' . $slug . '.html');
            $this->assertSame(200, $res2->getStatusCode());
            $this->assertStringContainsString('fallback content', (string)$res2->getBody());
        } finally {
            if (file_exists($path)) {
                unlink($path);
            }
        }
    }

    public function testMissingPageReturnsNotFound(): void
    {
        $res = $this->handle('GET', '/nonexistent');
        $this->assertSame(404, $res->getStatusCode());
    }
}
