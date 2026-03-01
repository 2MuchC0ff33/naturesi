<?php
$basePath = rtrim($_SERVER['BASE_PATH'] ?? getenv('BASE_PATH') ?? '', '/');
?>
<header>
    <nav>
        <ul>
            <li><a href="<?= $basePath === '' ? '/' : $basePath . '/' ?>">Home</a></li>
            <li><a href="<?= $basePath . '/about' ?>">About</a></li>
            <li><a href="<?= $basePath . '/store' ?>">Store</a></li>
        </ul>
    </nav>
</header>
