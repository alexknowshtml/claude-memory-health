# claude-memory-health

A Claude Code skill and scheduler for keeping your memory index focused — auditing `MEMORY.md` for bloat, orphans, and stale entries, then autonomously demoting lower-priority notes to cold storage so the most valuable context loads every session.

## The Problem

Claude Code's auto-memory saves a lot. Every correction, fact, and decision ends up in `MEMORY.md` — and it all gets injected at session start. Two problems compound over time:

**Signal dilution.** When everything is always-on, nothing is prioritized. A behavioral rule you need every session competes with an incident fix from three months ago.

**Silent truncation.** Claude Code loads up to 200 lines of `MEMORY.md` at session start. Lines past 200 are silently dropped. No warning, no error — your oldest memories quietly disappear as new ones accumulate.

The fix isn't to stop saving memories. It's to sort them.

## How It Works

**Hot** (`MEMORY.md`) — injected at every session start. Reserve for behavioral rules, communication patterns, safety gates: things Claude needs regardless of what you're working on.

**Cold** (`cold-storage/`) — domain-specific files loaded on demand. Not injected at session start, but discoverable via search. Use for technical facts, project context, API details, one-time decisions.

The skill audits your index and surfaces what should move. The scheduler runs Claude autonomously to handle demotion on a schedule — the same model that wrote your memories decides which ones to retire.

## What's Included

```
SKILL.md                    # /memory-health Claude Code skill
scripts/
  check-bloat.ts            # find sections with inline content that should be files
  check-orphans.ts          # find memory files not referenced in MEMORY.md or cold storage
  scheduler.ts              # scheduled demotion via headless Claude invocation
cold-storage/
  _index.md                 # domain list with "when to load" trigger keywords
  development.md            # example: build tools, debugging
  infrastructure.md         # example: ports, certs, deployment
  relationships.md          # example: communication preferences, key contacts
  projects.md               # example: decisions, constraints, milestones
```

## Requirements

- [Claude Code](https://claude.ai/code) — for the `/memory-health` skill and scheduler
- [Bun](https://bun.sh) — for the TypeScript scripts
- Claude Code's file-based memory system at `~/.claude/projects/<your-project>/memory/`

## Install

**Skill only:**
```bash
mkdir -p .claude/skills/memory-health
curl -o .claude/skills/memory-health/SKILL.md \
  https://raw.githubusercontent.com/alexknowshtml/claude-memory-health/main/SKILL.md
```

Then run `/memory-health` in Claude Code.

**With scripts and scheduler:**
```bash
git clone https://github.com/alexknowshtml/claude-memory-health /tmp/cmh
cp -r /tmp/cmh/scripts your-project/scripts/memory-health
cp /tmp/cmh/SKILL.md your-project/.claude/skills/memory-health/SKILL.md
cp -r /tmp/cmh/cold-storage your-project/cold-storage  # optional — create your own domains
```

Set env vars (or hardcode paths in the scripts):
```bash
export MEMDIR="$HOME/.claude/projects/your-project/memory"
export COLDDIR="path/to/your-project/cold-storage"
```

## Usage

**Interactive audit** (Claude Code):
```
/memory-health
```

**Manual audit scripts:**
```bash
bun run scripts/check-bloat.ts    # find inline bloat candidates
bun run scripts/check-orphans.ts  # find orphaned memory files
```

**Autonomous demotion:**
```bash
# Dry run — check count, skip demotion
DRY_RUN=true bun run scripts/scheduler.ts

# Run for real
bun run scripts/scheduler.ts

# Schedule daily at 7am
0 7 * * * cd /path/to/project && bun run scripts/scheduler.ts >> logs/memory-health.log 2>&1
```

The scheduler checks `MEMORY.md` line count. When over threshold (default: 100), it invokes Claude headlessly with a structured prompt — Claude reads your files, classifies each entry semantically, and executes the demotion using real file tools. Output is logged to stdout.

## Cold Storage

See [`cold-storage/_index.md`](./cold-storage/_index.md) for the domain format and decision guide, and the example domain files for the entry structure (H2 category groupings, **Why:** / **How to apply:** context where relevant).

Your cold storage lives in your project repo, not here. Set `COLDDIR` to point to it.

## Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `MEMDIR` | `~/.claude/projects/YOUR_PROJECT/memory` | Path to memory directory |
| `COLDDIR` | `cold-storage` | Path to cold storage directory |
| `MEMORY_HEALTH_THRESHOLD` | `100` | Line count that triggers autonomous demotion |
| `DRY_RUN` | `false` | Check count without invoking Claude |

## License

MIT
