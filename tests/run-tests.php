<?php
// helper invoked by Composer's "test" script.  When phpunit is available in
// vendor/bin we forward to it; otherwise print guidance and exit successfully.

$phpunit = __DIR__ . '/../vendor/bin/phpunit';
if (file_exists($phpunit) && is_executable($phpunit)) {
  // use passthru so exit code propagates
  passthru($phpunit . ' --colors=always', $rv);
  exit($rv);
}
echo "phpunit binary not found; skip PHP tests\n";
echo "Install development dependencies (composer install --dev)\n";
echo "or run the Node sanity checks at tests/check_bootstrap.cjs and tests/check_css_build.cjs\n";
exit(0);
