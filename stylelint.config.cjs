// minimal configuration so the VS Code extension stops trying to load package.json
// and therefore avoids the "Invalid package config" error on Windows.
// Expand this file with project‑specific rules as needed.

module.exports = {
  // No preset is installed by default; add "extends" once a shared config
  // dependency is added, e.g. stylelint-config-standard.
  rules: {
    // custom rules can go here, e.g.:
    // 'at-rule-no-unknown': [true, { ignoreAtRules: ['tailwind'] }],
  },
};
