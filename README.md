# claude-memory-health

A Claude Code skill and scheduler for keeping your memory index focused — auditing `MEMORY.md` for bloat and stale entries, then autonomously demoting lower-priority notes to cold storage so the most valuable context loads every session.

---

## Install via Claude Code

Paste this into Claude Code to install:

```
Install the memory-health skill from https://github.com/alexknowshtml/claude-memory-health:

1. Copy SKILL.md to .claude/skills/memory-health/SKILL.md
2. Copy the scripts/ folder to scripts/memory-health/ in the project root
3. Copy cold-storage/ to cold-storage/ in the project root (or create your own domain files)
4. Set MEMDIR to ~/.claude/projects/[your-project-name]/memory
5. Set COLDDIR to [project-root]/cold-storage

Once installed, run /memory-health to audit the memory index.
```

> Requires [Claude Code](https://claude.ai/code) and [Bun](https://bun.sh).

---

## The Problem

Claude Code's auto-memory saves a lot. Every correction, fact, and decision ends up in `MEMORY.md` — and it all gets injected at session start. Two problems compound over time:

**Signal dilution.** When everything is always-on, nothing is prioritized. A behavioral rule you need every session competes with an incident fix from three months ago.

**Silent truncation.** Claude Code loads up to 200 lines of `MEMORY.md` at session start. Lines past 200 are silently dropped — no warning, no error. Your oldest memories quietly disappear as new ones accumulate.

The fix isn't to stop saving memories. It's to sort them.

## How It Works

**Hot** (`MEMORY.md`) — injected at every session start. Reserve for behavioral rules, communication patterns, safety gates: things Claude needs regardless of what you're working on.

**Cold** (`cold-storage/`) — domain-specific files loaded on demand. Not injected automatically, but searchable when working in a specific area. Use for technical facts, project context, API details, one-time decisions.

The skill audits your index interactively. The scheduler runs Claude headlessly to handle demotion on a schedule — the same model that wrote your memories classifies which ones to retire.

## What's Included

```
SKILL.md                    # /memory-health interactive audit skill
scripts/
  check-bloat.ts            # find sections with inline content that should be files
  check-orphans.ts          # find memory files not referenced anywhere
  scheduler.ts              # scheduled demotion via headless Claude invocation
cold-storage/
  _index.md                 # domain list with "when to load" trigger keywords
  development.md            # example domain: build tools, debugging
  infrastructure.md         # example domain: ports, certs, deployment
  relationships.md          # example domain: communication preferences, contacts
  projects.md               # example domain: decisions, constraints, milestones
```

## Usage

**Interactive audit** — run from Claude Code:
```
/memory-health
```

**Manual audit scripts:**
```bash
bun run scripts/check-bloat.ts     # find inline content that should be extracted
bun run scripts/check-orphans.ts   # find orphaned memory files
```

**Autonomous demotion** (runs Claude headlessly, classifies and demotes without interaction):
```bash
DRY_RUN=true bun run scripts/scheduler.ts   # check line count, skip demotion
bun run scripts/scheduler.ts                # run for real
```

**Schedule it:**
```bash
# daily at 7am — demotes automatically when MEMORY.md exceeds threshold
0 7 * * * cd /path/to/project && bun run scripts/scheduler.ts >> logs/memory-health.log 2>&1
```

## Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `MEMDIR` | `~/.claude/projects/YOUR_PROJECT/memory` | Path to memory directory |
| `COLDDIR` | `cold-storage` | Path to cold storage directory |
| `MEMORY_HEALTH_THRESHOLD` | `100` | Line count that triggers autonomous demotion |
| `DRY_RUN` | `false` | Check count without running Claude |

## Cold Storage

See [`cold-storage/_index.md`](./cold-storage/_index.md) for the domain format and decision guide. The example domain files show the entry structure: H2 category groupings, entries with **Why:** / **How to apply:** context where the reasoning matters.

Your cold storage belongs in your project repo, not here. Point `COLDDIR` to it.

## License

MIT
