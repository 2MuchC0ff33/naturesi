h10099
s 00050/00000/00000
d D 1.1 26/04/12 13:56:43 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:43 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
# VS Code tasks — Apache (httpd) + Chrome Debugging ⚙️

Purpose: brief usage notes for the `start-httpd`, `wait-for-httpd`, `dev-httpd`, and `stop-httpd` tasks used by the "Launch Chrome" debug configuration.

## Tasks
- `start-httpd` — runs `apachectl start` (assumes Apache installed with apachectl in PATH).
- `wait-for-httpd` — runs `scripts/wait-for-port.cjs 8000 30` (Node script — cross-platform, preferred) and exits when port 8000 is reachable.
- `dev-httpd` — composite task (`dependsOn`) that runs `start-httpd` then `wait-for-httpd` (used as `preLaunchTask`).
- `stop-httpd` — runs `apachectl stop` (assumes Apache installed with apachectl in PATH) after debugging finishes (`postDebugTask`).
- `minify-current-file` — minifies the current file using `minify` (assumes minify in PATH).
- `lint-current-file-biome` — lints the current JS/JSON/CSS file with `biome` (assumes biome in PATH).
- `lint-current-file-html` — lints the current HTML file with `tidy` (assumes tidy in PATH).

## How to use
1. In VS Code: Run Task → select `dev-httpd` to start Apache and wait for port 8000.
2. Or use the Run & Debug panel and start the **Launch Chrome** configuration — it uses `dev-httpd` as `preLaunchTask` and will stop httpd with `stop-httpd` after debugging.
3. For manual testing:
   - Start: `apachectl start`
   - Stop: `apachectl stop`
   - Test port: `node scripts/wait-for-port.cjs 8000 30`

## Setup Requirements
Ensure the following tools are installed and in your PATH:
- Apache HTTP Server (with `apachectl` command)
- Node.js (for wait-for-httpd and other scripts)
- minify (for minification)
- biome (for linting JS/JSON/CSS)
- tidy (for linting HTML)

On Windows, you may need Cygwin or WSL for Unix-like commands. On macOS/Linux, use Homebrew or apt.

## Permissions & common issues ⚠️
- Starting httpd may require elevated privileges. If `apachectl start` fails with permission errors, run the command in an elevated terminal or run VS Code as Administrator.
- If port 8000 is already in use, change the listening port in your Apache config or stop the conflicting process.
- If tools are not in PATH, install them globally (e.g., `npm install -g minify biome`, or use package managers).

## Debugger notes
- The debug config uses `type: "pwa-chrome"` and `runtimeExecutable: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`.
- If the debugger fails to attach or restart, ensure Chrome exists at that path and `userDataDir` is writable (default: `${workspaceFolder}/.vscode/chrome`).

## Troubleshooting checklist
- [ ] Run `apachectl start` manually and confirm no permission errors.
- [ ] Run `node scripts/wait-for-port.cjs 8000 30` to verify the wait helper works.
- [ ] Confirm `Launch Chrome` attaches after `dev-httpd` completes.
- [ ] If tools are not found, check PATH or install them.
- [ ] If problems persist, run commands manually to see full stderr messages.

---

If you'd like, I can add a short note to the main `README` explaining how to run the dev tasks (yes/no).
E 1
