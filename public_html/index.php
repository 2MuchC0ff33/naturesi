<?php
// index.php

// bootstrap returns Slim app and Plates engine for convenience in tests
$loaded = require __DIR__ . '/../php/bootstrap.php';
/** @var \Slim\App $app */
$app = $loaded['app'];
/** @var \League\Plates\Engine $templates */
$templates = $loaded['templates'];

// routes are registered in bootstrap.php; nothing additional needed here

$app->run();
