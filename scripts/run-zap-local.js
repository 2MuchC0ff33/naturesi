#!/usr/bin/env node
const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

// Purpose: attempt to run zap-baseline.py from PATH. This avoids Docker; users must install ZAP locally.
// On Windows, users can install ZAP and ensure zap-baseline.py is on the PATH, or run the full ZAP GUI and then use the script.

const REPORT_DIR = path.resolve(process.cwd(), 'reports');
const REPORT_FILE = path.join(REPORT_DIR, 'zap-baseline.html');

const args = process.argv.slice(2);
const diagnose = args.includes('--diagnose');

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const ps = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    ps.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('exit ' + code))));
    ps.on('error', reject);
  });
}

(async () => {
  try {
    // Check for a Python script on PATH
    // Try a few candidate commands that may exist on different systems
    const candidates = ['zap-baseline.py', 'zap-baseline', 'zap.bat'];
    let found = null;
    for (const c of candidates) {
      try {
        await runCmd('which', [c]);
        found = c;
        break;
      } catch (e) {
        // not found via which; try type on windows
        try {
          await runCmd('where', [c]);
          found = c;
          break;
        } catch (e2) {
          // continue
        }
      }
    }

    if (!found) {
      if (diagnose) {
        console.error('\nZAP baseline script not found on PATH.');
        console.error(
          'Please install OWASP ZAP locally and ensure zap-baseline.py is available on your PATH.'
        );
        console.error(
          'Windows users: install ZAP from https://www.zaproxy.org/download/ and add the scripts folder to PATH.'
        );
        console.error(
          'Alternatively, run the Docker-based scanner or use MCP servers as an alternative.'
        );
        process.exit(2);
      }

      // final attempt: run python -m with the script if user has Python and ZAP scripts in common location
      console.error('Could not find zap-baseline.py on PATH. Run with --diagnose for guidance.');
      process.exit(2);
    }

    // Ensure reports dir exists
    if (!existsSync(REPORT_DIR)) {
      require('fs').mkdirSync(REPORT_DIR, { recursive: true });
    }

    console.log('Running OWASP ZAP baseline using', found);
    // Template command: zap-baseline.py -t http://127.0.0.1:8080 -r reports/zap-baseline.html
    await runCmd(found, ['-t', 'http://127.0.0.1:8080', '-r', REPORT_FILE]);
    console.log('\nZAP baseline completed. Report:', REPORT_FILE);
    process.exit(0);
  } catch (err) {
    console.error('\nZAP baseline runner failed:', err.message || err);
    console.error('If you do not have OWASP ZAP installed locally, you can:');
    console.error(' - Install ZAP GUI from https://www.zaproxy.org/download/');
    console.error(
      ' - Ensure zap-baseline.py is available on your PATH, or run with --diagnose for help.'
    );
    process.exit(3);
  }
})();
