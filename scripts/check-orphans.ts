#!/usr/bin/env bun
/**
 * Finds memory files not referenced in MEMORY.md or cold storage.
 * A file demoted to cold storage isn't an orphan — only true orphans are reported.
 *
 * Usage: bun run scripts/check-orphans.ts
 * Set MEMDIR and COLDDIR env vars to override defaults.
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const MEMDIR =
  process.env.MEMDIR ||
  join(homedir(), ".claude/projects/YOUR_PROJECT/memory");
const COLDDIR = process.env.COLDDIR || "cold-storage";

const allFiles = new Set(
  readdirSync(MEMDIR).filter((f) => f.endsWith(".md") && f !== "MEMORY.md")
);

const memContent = readFileSync(join(MEMDIR, "MEMORY.md"), "utf-8");
const memRefs = new Set(
  [...memContent.matchAll(/\(([\w_-]+\.md)\)/g)].map((m) => m[1])
);

const coldRefs = new Set<string>();
if (existsSync(COLDDIR)) {
  for (const f of readdirSync(COLDDIR).filter((f) => f.endsWith(".md"))) {
    const coldContent = readFileSync(join(COLDDIR, f), "utf-8");
    for (const m of coldContent.matchAll(/\(([\w_-]+\.md)\)/g)) {
      coldRefs.add(m[1]);
    }
  }
}

const inMemory = [...allFiles].filter((f) => memRefs.has(f));
const coldOnly = [...allFiles].filter((f) => coldRefs.has(f) && !memRefs.has(f));
const orphans = [...allFiles].filter((f) => !memRefs.has(f) && !coldRefs.has(f));

console.log(
  `Total: ${allFiles.size} | In MEMORY.md: ${inMemory.length} | Cold storage only: ${coldOnly.length} | True orphans: ${orphans.length}`
);
for (const f of orphans.sort()) {
  console.log(`ORPHAN: ${f}`);
}
