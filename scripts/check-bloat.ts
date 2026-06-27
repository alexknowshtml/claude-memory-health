#!/usr/bin/env bun
/**
 * Finds MEMORY.md sections with 3+ lines of inline content and no file link.
 * These are extraction candidates — content that should live in a separate memory file.
 *
 * Usage: bun run scripts/check-bloat.ts
 * Set MEMDIR env var to override the default memory directory path.
 */

import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const MEMDIR =
  process.env.MEMDIR ||
  join(homedir(), ".claude/projects/YOUR_PROJECT/memory");

const content = readFileSync(join(MEMDIR, "MEMORY.md"), "utf-8");
const lines = content.split("\n");

interface Section {
  name: string;
  lines: string[];
  hasFileLink: boolean;
}

const sections: Section[] = [];
let current: Section | null = null;

for (const line of lines) {
  if (line.startsWith("## ")) {
    if (current) sections.push(current);
    current = { name: line.trim(), lines: [], hasFileLink: false };
  } else if (current) {
    current.lines.push(line);
    if (/\]\([^)]+\.md\)/.test(line)) current.hasFileLink = true;
  }
}
if (current) sections.push(current);

const candidates = sections
  .map((s) => ({ ...s, count: s.lines.filter((l) => l.trim()).length }))
  .filter((s) => s.count > 2)
  .sort((a, b) => b.count - a.count);

if (candidates.length === 0) {
  console.log("No inline bloat candidates found.");
} else {
  for (const s of candidates) {
    const status = s.hasFileLink ? "HAS FILE   " : "INLINE ONLY";
    console.log(`${String(s.count).padStart(3)} lines | ${status} | ${s.name}`);
  }
}
