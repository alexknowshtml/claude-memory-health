---
name: memory-health
description: Audit Claude Code's MEMORY.md index — check size, orphaned files, broken links, and staleness candidates. Keeps the memory index clean and under the 200-line hard limit.
---

# /memory-health

Audit Claude Code's MEMORY.md index. Catches size creep, orphaned files, broken links, and stale entries before they silently get truncated out of context.

**Limit:** Claude Code loads up to 200 lines of MEMORY.md at session start. Lines past 200 are silently truncated. Soft warn at 175, hard limit at 200. Aim to stay ≤195.

## Setup

This skill assumes you're using Claude Code's file-based memory system:

```
~/.claude/projects/<your-project>/memory/
├── MEMORY.md          # index file — one pointer per memory
├── feedback_*.md      # individual memory files
├── project_*.md
└── ...
```

Set your memory directory:
```bash
MEMDIR="$HOME/.claude/projects/$(basename $PWD)/memory"
```

Or hard-code it if your project has a fixed path.

---

## Phase 1 — MEMORY.md Audit

### Step 1 — Check Size
```bash
wc -l "$MEMDIR/MEMORY.md"
```
Report the count. Soft warn at 175, hard limit at 200.

### Step 2 — Audit Inline Bloat

Find sections with 3+ lines of inline content and no file link — these are extraction candidates. Run:

```bash
bun run scripts/check-bloat.ts
```

Set `MEMDIR` to override the default memory directory path. See [`scripts/check-bloat.ts`](./scripts/check-bloat.ts) for the full script.

### Step 3 — Audit Orphans

Find memory files not referenced in MEMORY.md. If you're using a `cold-storage/` folder (see [cold-storage/_index.md](./cold-storage/_index.md)), also scans those files — a demoted entry isn't an orphan, it's just cold.

```bash
bun run scripts/check-orphans.ts
```

Set `MEMDIR` and `COLDDIR` env vars to override defaults. See [`scripts/check-orphans.ts`](./scripts/check-orphans.ts) for the full script.

### Step 4 — Audit Broken Links

Find index entries that point to non-existent files:

```bash
cd "$MEMDIR" && grep -oP '\(([^)]+\.md)\)' MEMORY.md | tr -d '()' | while read f; do
  [ ! -f "$f" ] && echo "BROKEN LINK: $f"
done
```

### Step 5 — Flag Staleness

Scan for and present staleness candidates:
- Lines with explicit past dates (e.g. "expires YYYY-MM-DD", "soak delete after YYYY-MM-DD")
- Lines containing "awaiting", "pending approval", or "TODO" that are old
- Completed one-off operations described as active
- Sections for projects/features that no longer exist
- Deprecated systems — entries for tools/services replaced or removed
- One-time debug fixes — single incident root causes, not recurring patterns
- Redundant with code — rules now baked into config or skill files directly

Present candidates with a brief reason for each. **Do not remove anything without explicit approval.**

### Step 6 — Present Findings

Report all findings as a structured list:
- **Inline bloat candidates**: section name, line count, proposed new filename
- **Orphans**: filename, brief description of what it contains
- **Broken links**: entry text, what file is missing
- **Staleness candidates**: entry, reason it might be stale
- **Section-merge candidates**: pairs of small related sections where collapsing saves 2+ lines (each `## Header` + blank line costs ~2 lines)

Ask the user which items to act on. Get explicit approval for each category before proceeding.

### Step 7 — Execute Approved Changes

**For inline bloat extraction:**
1. Create a new file `{type}_{slug}.md` with proper frontmatter:
   ```markdown
   ---
   name: <descriptive name>
   description: <one-line description used for relevance matching>
   type: user|feedback|project|reference
   ---

   <content>
   ```
2. Replace the multi-line section in MEMORY.md with a single pointer:
   `- [Description](filename.md) — one-line summary`

**For orphans:** Either add a pointer to MEMORY.md in the correct section, or if truly stale, confirm with user before deleting.

**For broken links:** Either fix the path or remove the dead entry.

**For staleness:** Remove the flagged lines/sections after explicit user approval.

### Step 8 — Verify

```bash
wc -l "$MEMDIR/MEMORY.md"
```

Confirm: under 200 lines (aim for ≤195), no orphans, no broken links. If still over ~160 lines after cleanup, proceed to Phase 2.

---

## Phase 2 — Cold Storage Demotion

When the index is clean but still large, demote individual memory files to domain-specific cold storage files and remove their index entries. See [`cold-storage/_index.md`](./cold-storage/_index.md) for the pattern and example domain files.

**Autonomous alternative:** Run `bun run scripts/scheduler.ts` to demote without user interaction. The scheduler invokes Claude CLI headlessly — Claude reads the files, makes semantic decisions, and executes the file operations using real tools. Use `DRY_RUN=true` to check the line count without triggering demotion. Requires the Claude CLI installed and authenticated. See [`scripts/scheduler.ts`](./scripts/scheduler.ts).

### Step D1 — Record starting line count

```bash
wc -l "$MEMDIR/MEMORY.md"
```

### Step D2 — Classify entries

Read MEMORY.md. For each `[Title](filename.md)` entry, read the linked file and classify as `keep` or `demote`.

**Keep** (always-on behavioral rules):
- Always/never rules that apply across many sessions
- Communication anti-patterns and tone corrections
- Safety gates and critical protocols
- Lessons from repeated mistakes (corrected 2+ times across sessions)

**Demote** (non-behavioral):
- Technical facts: port numbers, API fields, credential formats, command syntax
- Project context: active migrations, one-time decisions, completed events
- Single-incident root cause fixes
- Situational knowledge that only applies in specific rare contexts

For each demotion, identify which domain file it belongs to (e.g. `cold-storage/infrastructure.md`, `cold-storage/development.md`).

### Step D3 — Execute demotions

For each entry to demote:

1. Read `$MEMDIR/FILENAME.md`
2. Strip the YAML frontmatter (content between and including the two `---` delimiters)
3. Append to the appropriate `cold-storage/DOMAIN.md`:
   ```
   ### entry-slug

   <body content>
   ```
4. Delete `$MEMDIR/FILENAME.md`
5. Remove the corresponding line from `MEMORY.md`

If no matching domain file exists, create one following the format in `cold-storage/_index.md`.

### Step D4 — Commit

```bash
git add cold-storage/ && git add "$MEMDIR" && git commit -m "chore(memory): demote N entries to cold storage"
```

Replace N with the actual count.

### Step D5 — Verify

```bash
wc -l "$MEMDIR/MEMORY.md"
```

Report: final line count, how many entries demoted, which domain files received entries.

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| feedback | `feedback_{slug}.md` | `feedback_verify_before_acting.md` |
| reference | `reference_{slug}.md` | `reference_discord_thread_ids.md` |
| project | `project_{slug}.md` | `project_auth_rewrite.md` |
| user | `user_{slug}.md` | `user_timezone_preference.md` |

## What NOT to Extract

- Single-line entries — already index format, leave them
- Sections that already link to a file — even with a couple extra inline lines, the file is canonical; move extras there instead

## Memory System Rules

- MEMORY.md = index only. No content, only pointers.
- Each memory file has frontmatter: `name`, `description`, `type`
- Keep index under the 200-line hard limit; ~195 is the practical working ceiling
- Transitive links are fine (file A links to file B — both don't need to be in the index)
