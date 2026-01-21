#!/usr/bin/env node
// Minimal, dependency-free tool downloader for optional binaries
import fs from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const toolsDir = new URL('../.tools/', import.meta.url);
if (!fs.existsSync(toolsDir)) fs.mkdirSync(toolsDir, { recursive: true });

const { spawnSync } = await import('node:child_process');

const tools = [
  {
    name: 'zombie',
    type: 'npm',
    note: 'Please run `npm install` to install devDependencies (zombie).',
  },
  {
    // prefer portable archive (7z) so we can extract a runnable binary into .tools/
    name: 'wkhtmltox',
    url: 'https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/wkhtmltox-0.12.6-1.mxe-cross-win64.7z',
    filename: 'wkhtmltox-0.12.6-1.mxe-cross-win64.7z',
    expectedExecutables: ['wkhtmltoimage.exe', 'wkhtmltopdf.exe'],
  },
  {
    name: 'quickjs-win',
    url: 'https://bellard.org/quickjs/binary_releases/quickjs-win-x86_64-2025-09-13.zip',
    filename: 'quickjs-win-x86_64-2025-09-13.zip',
    expectedExecutables: ['qjs.exe', 'qjs'],
  },
];

function hasCommand(cmd) {
  try {
    if (process.platform === 'win32') {
      const r = spawnSync('where', [cmd], { stdio: 'ignore' });
      return r.status === 0;
    }
    const r = spawnSync('command', ['-v', cmd], { stdio: 'ignore' });
    return r.status === 0;
  } catch (e) {
    return false;
  }
}

async function tryExtract(archivePath, destDir) {
  // destDir is a filesystem path
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  // Extraction strategies
  const strategies = [];
  if (process.platform === 'win32') {
    strategies.push({ cmd: '7z', args: ['x', archivePath, `-o${destDir}`] });
    strategies.push({
      cmd: 'powershell',
      args: [
        '-NoProfile',
        '-Command',
        `Expand-Archive -Path '${archivePath}' -DestinationPath '${destDir}' -Force`,
      ],
    });
  } else {
    strategies.push({ cmd: '7z', args: ['x', archivePath, `-o${destDir}`] });
    strategies.push({ cmd: 'unzip', args: [archivePath, '-d', destDir] });
    strategies.push({ cmd: 'tar', args: ['-xf', archivePath, '-C', destDir] });
  }

  for (const s of strategies) {
    if (!hasCommand(s.cmd)) continue;
    console.log(`  attempting extraction with ${s.cmd} ...`);
    try {
      const r = spawnSync(s.cmd, s.args, { stdio: 'inherit' });
      if (r.status === 0) return true;
    } catch (e) {
      // ignore and try next
    }
  }
  return false;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400)
          return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

(async () => {
  console.log('Installing optional tools into .tools/ (skips if present)');
  for (const t of tools) {
    if (t.type === 'npm') {
      console.log(`- ${t.name}: npm devDependency; run 'npm install' if not installed.`);
      continue;
    }
    const dest = new URL(t.filename, toolsDir).pathname;
    if (fs.existsSync(dest)) {
      console.log(`- ${t.name}: already present (${t.filename})`);
      continue;
    }
    try {
      console.log(`- downloading ${t.name} -> ${dest}`);
      await download(t.url, dest);
      console.log(`  downloaded: ${t.filename}`);

      // If the downloaded artifact looks like an archive and the tool
      // exposes expected executables, try to extract so the binary can be
      // invoked directly from .tools/ (portable usage).
      if (t.expectedExecutables && t.expectedExecutables.length > 0) {
        const extracted = await (async () => {
          const destDir = new URL(`./${t.name}/`, toolsDir).pathname;
          const ok = await tryExtract(dest, destDir);
          if (ok) {
            console.log(`  extracted ${t.filename} to ${destDir}`);
            return true;
          }
          // not extracted: leave archive and instruct user
          console.warn(
            `  could not extract ${t.filename} automatically. Please extract it into ${destDir}`
          );
          return false;
        })();
        if (!extracted) {
          console.log(
            `  Note: ${t.name} can still be used if you extract the downloaded archive into .tools/${t.name}/`
          );
        }
      }
    } catch (err) {
      console.warn(`  failed to download ${t.name}: ${err.message}`);
      console.warn(`  You can download it manually from: ${t.url}`);
    }
  }
  console.log('\nDone. Run `npm run tools:check` to verify presence.');
})();
