import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'playwright-report',
  'test-results',
  'tests',
  'scripts',
]);

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(res);
    } else if (entry.isFile() && res.endsWith('.html')) {
      yield res;
    }
  }
}

function findInlineScriptIssues(content: string) {
  const issues: string[] = [];
  // Find <script> tags without src and not application/ld+json
  const scriptTagRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptTagRegex.exec(content))) {
    const attrs = m[1];
    const body = m[2];
    if (/type\s*=\s*"application\/ld\+json"/i.test(attrs)) continue;
    if (/\bsrc\s*=\s*"[^"]+"/i.test(attrs)) continue;
    // Non-empty body implies inline script
    if (body && body.trim().length > 0) {
      issues.push(`Inline <script> tag detected${attrs ? ` (attrs: ${attrs.trim()})` : ''}`);
    }
  }
  return issues;
}

function findInlineStyleIssues(content: string) {
  const issues: string[] = [];
  // Find style="..." occurrences
  const styleRegex = /style\s*=\s*"([^"]*)"/gi;
  let m: RegExpExecArray | null;
  while ((m = styleRegex.exec(content))) {
    const value = m[1];
    // Ignore style attributes that are only inside <svg ...> elements by a simple heuristic:
    // If the nearest preceding '<svg' appears after the nearest preceding '<' for the element, we'll assume svg context.
    // This is a best-effort heuristic for small static files.
    // For now, we will flag all styles to encourage moving them into CSS partials.
    issues.push(`Inline style attribute detected: "${value.replace(/\s+/g, ' ').trim()}"`);
  }
  return issues;
}

function findInlineEventHandlerIssues(content: string) {
  const issues: string[] = [];
  // Find attributes like onclick=, onsubmit=, onmouseover=, etc.
  const inlineEventRegex = /\son[a-z0-9_-]+\s*=\s*"[^"]*"/gi;
  let m: RegExpExecArray | null;
  while ((m = inlineEventRegex.exec(content))) {
    issues.push(`Inline event handler detected: ${m[0].trim()}`);
  }
  return issues;
}

describe('HTML inline policy', () => {
  it('has no inline script/style/event handlers in source HTML files', async () => {
    const violations: { file: string; problems: string[] }[] = [];
    for await (const file of walk(process.cwd())) {
      const content = await fs.readFile(file, 'utf8');
      const problems: string[] = [];
      problems.push(...findInlineScriptIssues(content));
      problems.push(...findInlineStyleIssues(content));
      problems.push(...findInlineEventHandlerIssues(content));
      if (problems.length) {
        violations.push({ file: path.relative(process.cwd(), file), problems });
      }
    }

    if (violations.length > 0) {
      let message = '\nInline policy violations detected in HTML files:\n';
      for (const v of violations) {
        message += `\n- ${v.file}:\n`;
        for (const p of v.problems) {
          message += `    • ${p}\n`;
        }
      }
      // Provide guidance to the developer
      message +=
        '\nGuidance: Move inline scripts to assets/js/modules and inline styles to assets/css/partials. JSON-LD <script type="application/ld+json"> is allowed.\n';
      throw new Error(message);
    }

    expect(violations.length).toBe(0);
  });
});
