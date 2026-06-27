# claude-memory-health

A Claude Code skill and scheduler for keeping your memory index focused — auditing `MEMORY.md` for bloat and stale entries, then autonomously demoting lower-priority notes to cold storage so the most valuable context loads every session.

---

## Install via Claude Code

Paste this into Claude Code to install:

```
Install the memory-health skill from https://github.com/alexknowshtml/claude-memory-health:

Clone or copy the repo into .claude/skills/memory-health/ in the project root.
The scripts and cold-storage templates are included in the repo — no separate copies needed.

To set up cold storage: copy .claude/skills/memory-health/cold-storage/ to cold-storage/
in the project root as a starting point, then customize the domain files for your project.

Set MEMDIR to ~/.claude/projects/[your-project-name]/memory
Set COLDDIR to [project-root]/cold-storage

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

Install the whole repo as `.claude/skills/memory-health/` — everything lives together.

```
.claude/skills/memory-health/
  SKILL.md                    # /memory-health interactive audit skill
  scripts/
    check-bloat.ts            # find sections with inline content that should be files
    check-orphans.ts          # find memory files not referenced anywhere
    scheduler.ts              # scheduled demotion via headless Claude invocation
  cold-storage/               # template — copy to your project root and customize
    _index.md                 # domain list with "when to load" trigger keywords
    development.md            # example: build tools, debugging
    infrastructure.md         # example: ports, certs, deployment
    relationships.md          # example: communication preferences, contacts
    projects.md               # example: decisions, constraints, milestones
```

Your actual cold storage lives in your project root (`cold-storage/`), separate from the skill. The copies in the skill directory are templates to start from.

## Getting Started

**1. Find your memory directory.**

Claude Code names project memory dirs after the mangled absolute path — not just the folder name. Run this to see what exists:

```bash
ls ~/.claude/projects/
```

Pick the entry that matches your project and set `MEMDIR` to it:

```bash
export MEMDIR=~/.claude/projects/-home-you-myproject/memory
```

**2. Set up cold storage.**

Copy the templates from the skill to your project root:

```bash
cp -r .claude/skills/memory-health/cold-storage/ cold-storage/
```

Then customize the domain files for your project. Set `COLDDIR`:

```bash
export COLDDIR=/path/to/your/project/cold-storage
```

**3. Do a dry run.**

```bash
cd .claude/skills/memory-health
DRY_RUN=true MEMDIR=$MEMDIR COLDDIR=$COLDDIR bun run scripts/scheduler.ts
```

You'll see the current line count and whether it would trigger demotion. No files are touched.

**4. Run for real when ready.**

```bash
MEMDIR=$MEMDIR COLDDIR=$COLDDIR bun run scripts/scheduler.ts
```

## Usage

**Interactive audit** — run from Claude Code:
```
/memory-health
```

**Manual audit scripts** (run from `.claude/skills/memory-health/`):
```bash
bun run scripts/check-bloat.ts     # find inline content that should be extracted
bun run scripts/check-orphans.ts   # find orphaned memory files
```

**Autonomous demotion** (runs Claude headlessly, classifies and demotes without interaction):
```bash
DRY_RUN=true bun run scripts/scheduler.ts   # check line count, skip demotion
bun run scripts/scheduler.ts                # run for real
```

> **Note:** The scheduler invokes Claude with `--dangerously-skip-permissions`. This is intentional — scheduled demotion is a pre-authorized autonomous operation. Claude reads memory files, classifies them, and writes to cold storage without interactive prompts. Review the classification rules in `scripts/scheduler.ts` before setting up a cron job.

**Schedule it:**
```bash
# daily at 7am — demotes automatically when MEMORY.md exceeds threshold
0 7 * * * cd /path/to/project/.claude/skills/memory-health && MEMDIR=~/.claude/projects/your-project/memory COLDDIR=/path/to/project/cold-storage bun run scripts/scheduler.ts >> /path/to/project/logs/memory-health.log 2>&1
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
