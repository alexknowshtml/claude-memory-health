#!/usr/bin/env bun
/**
 * Memory health scheduler — checks MEMORY.md line count and invokes Claude
 * to autonomously demote entries to cold storage when over threshold.
 *
 * Works the same way as a Claude Code scheduled job: Claude reads the files,
 * makes semantic decisions, and executes the actual file operations using its tools.
 * No keyword heuristics — Claude classifies by understanding the content.
 *
 * Requirements:
 *   - Claude CLI installed and authenticated (https://claude.ai/code)
 *   - MEMDIR and COLDDIR configured below or via env vars
 *
 * Usage:
 *   bun run scripts/scheduler.ts
 *   DRY_RUN=true bun run scripts/scheduler.ts   # check count, skip Claude
 *
 * Cron example (daily at 7am):
 *   0 7 * * * cd /path/to/project && bun run scripts/scheduler.ts >> logs/memory-health.log 2>&1
 */

import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { homedir } from "os";
import { join } from "path";

const MEMDIR =
  process.env.MEMDIR ||
  join(homedir(), ".claude/projects/YOUR_PROJECT/memory");
const COLDDIR = process.env.COLDDIR || "cold-storage";
const THRESHOLD = parseInt(process.env.MEMORY_HEALTH_THRESHOLD ?? "100", 10);
const TARGET = Math.floor(THRESHOLD * 0.75);
const DRY_RUN = process.env.DRY_RUN === "true";

const memPath = join(MEMDIR, "MEMORY.md");
const content = readFileSync(memPath, "utf-8");
const lineCount = content.split("\n").length;
const timestamp = new Date().toISOString();

console.log(
  `[memory-scheduler] ${timestamp} — MEMORY.md: ${lineCount} lines (threshold: ${THRESHOLD})`
);

if (lineCount < THRESHOLD) {
  console.log(`[memory-scheduler] Under threshold — no action needed.`);
  process.exit(0);
}

if (DRY_RUN) {
  console.log(
    `[memory-scheduler] DRY_RUN=true — would invoke Claude for demotion (${lineCount} lines over threshold).`
  );
  process.exit(0);
}

const coldIndexPath = join(COLDDIR, "_index.md");
const hasColdIndex = existsSync(coldIndexPath);

const prompt = `[MEMORY-DEMOTION-TASK] Autonomously demote MEMORY.md entries to cold storage.

Timestamp: ${timestamp}
MEMORY.md path: ${memPath}
Cold storage directory: ${COLDDIR}
Current line count: ${lineCount} lines (threshold: ${THRESHOLD})
Target: reduce to ~${TARGET} lines

CRITICAL EXECUTION REQUIREMENTS:
- You MUST execute real file operations using your tools — do NOT generate placeholder output
- No human approval needed — this is a scheduled autonomous task
- Do NOT git commit, send notifications, or post to Discord

## What to do

Read MEMORY.md. For each pointer-style entry (format: \`- [Title](filename.md) — description\`):
1. Read the linked memory file
2. Classify as KEEP or DEMOTE based on the rules below
3. Execute the demotion if applicable

## Classification rules

**KEEP** — behavioral rules that apply in every session:
- Communication patterns, tone corrections, anti-patterns to avoid
- Safety gates, critical protocols, always/never rules
- Lessons from repeated mistakes (memory type: feedback or user)
- Anything the model needs loaded at session start to behave correctly

**DEMOTE** — reference knowledge, loaded on demand:
- Technical facts: ports, API fields, credential formats, command syntax
- Project context: one-time decisions, completed migrations, incident root causes
- Situational knowledge only relevant in specific contexts
- Memory types: reference, project, insight, learning

When in doubt, KEEP. Only demote what clearly fits the demote criteria.

## How to demote an entry

1. Read \`${MEMDIR}/FILENAME.md\`
2. Strip the YAML frontmatter (everything between and including the --- delimiters)
3. Determine the right domain file in \`${COLDDIR}/\`${hasColdIndex ? ` — check \`${coldIndexPath}\` for the domain list and their "when to load" descriptions` : " — create a new domain file if needed, named after the topic area (e.g. infrastructure.md, development.md)"}
4. Append to the domain file:
   \`\`\`
   ### entry-slug-from-memory-name

   <body content>
   \`\`\`
5. Delete \`${MEMDIR}/FILENAME.md\`
6. Remove its line from MEMORY.md

## After completing all demotions

Output this exact structure (replace bracketed values):

## Memory Demotion Summary — ${timestamp}

**Before:** ${lineCount} lines | **After:** [final count] lines | **Demoted:** [count] entries

### Demoted
- [domain-file] ← [entry name]: [one-line description from the memory's description field]

### Kept
- [entry name]: [why kept — e.g. "behavioral rule", "safety gate"]

### No-Match (left in MEMORY.md)
- [entry name]: [reason no domain fit]

(Write "None" for any empty section)`;

console.log(`[memory-scheduler] Invoking Claude for semantic demotion...`);

const result = spawnSync("claude", ["--print", prompt], {
  encoding: "utf-8",
  timeout: 600_000, // 10 minutes
  maxBuffer: 10 * 1024 * 1024,
});

if (result.error) {
  console.error(`[memory-scheduler] Failed to invoke Claude:`, result.error.message);
  console.error(
    "Ensure the Claude CLI is installed and authenticated: https://claude.ai/code"
  );
  process.exit(1);
}

if (result.status !== 0) {
  console.error(
    `[memory-scheduler] Claude exited with status ${result.status}`
  );
  if (result.stderr) console.error(result.stderr);
  process.exit(1);
}

console.log("\n--- Demotion Result ---\n");
console.log(result.stdout.trim());
