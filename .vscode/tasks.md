# VS Code tasks — Apache (httpd) + Chrome Debugging ⚙️

Purpose: brief usage notes for the `start-httpd`, `wait-for-httpd`, `dev-httpd`, and `stop-httpd` tasks used by the "Launch Chrome" debug configuration.

## Tasks
- `start-httpd` — runs `apachectl start` via the Cygwin shim (`type: "process"`).
- `wait-for-httpd` — runs `scripts/wait-for-port.cjs 8000 30` (Node script — cross-platform, preferred) and exits when port 8000 is reachable. (Fallback: the original `wait-for-port.sh` exists, but the Node script avoids Cygwin invocation issues.)
- `dev-httpd` — composite task (`dependsOn`) that runs `start-httpd` then `wait-for-httpd` (used as `preLaunchTask`).
- `stop-httpd` — runs `apachectl stop` via the Cygwin shim (`type: "process"`) after debugging finishes (`postDebugTask`).

## How to use
1. In VS Code: Run Task → select `dev-httpd` to start Apache and wait for port 8000.
2. Or use the Run & Debug panel and start the **Launch Chrome** configuration — it uses `dev-httpd` as `preLaunchTask` and will stop httpd with `stop-httpd` after debugging.
3. For manual testing:
   - Start: `apachectl start` (Cygwin)
   - Stop: `apachectl stop`
   - Test port: `./scripts/wait-for-port.sh 8000 30`

## Permissions & common issues ⚠️
- Starting httpd may require elevated privileges on Windows/Cygwin. If `apachectl start` fails with permission errors, run the command in an elevated Cygwin terminal or run VS Code as Administrator for tasks that start the service.
- If port 8000 is already in use, change the listening port in your local Apache config or stop the conflicting process.
- Confirm the Cygwin shim path is correct: `C:\Users\galloa\scoop\shims\cygwin.exe` (used by the tasks). If your environment differs, update `.vscode/tasks.json`.

## Debugger notes
- The debug config uses `type: "pwa-chrome"` and `runtimeExecutable: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`.
- If the debugger fails to attach or restart, ensure Chrome exists at that path and `userDataDir` is writable (default: `${workspaceFolder}/.vscode/chrome`).

## Troubleshooting checklist
- [ ] Run `apachectl start` manually and confirm no permission errors.
- [ ] Run `./scripts/wait-for-port.sh 8000 30` to verify the wait helper works.
- [ ] Confirm `Launch Chrome` attaches after `dev-httpd` completes.
- [ ] If you see `bash: /d: No such file or directory` or `exit code 127` from the task: that means VS Code passed Windows-style `/d /c` arguments into the Cygwin shell. The fix used here is to invoke the Cygwin executable directly using `type: "process"` and `args: ["-i","-c","./scripts/wait-for-port.sh 8000 30"]` so the shim runs the script directly (check `.vscode/tasks.json`).
- [ ] If problems persist, run the command manually from an elevated Cygwin terminal to see full stderr messages.

---

If you'd like, I can add a short note to the main `README` explaining how to run the dev tasks (yes/no).
