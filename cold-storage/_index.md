# Cold Storage Index

Reference lookup for domain-specific knowledge demoted from `MEMORY.md`.
`MEMORY.md` holds only always-on behavioral rules. Load a domain file when you need specific technical or contextual details for a given area.

**Content is inline** — all knowledge lives directly in the domain files below. No separate memory files to chase.

## Domains

| File | When to load |
|------|--------------|
| `development.md` | debugging, build tools, dev environment, container runtime |
| `infrastructure.md` | ports, certs, deployment, hosting, server processes |
| `integrations.md` | external APIs, webhooks, third-party service configs |
| `relationships.md` | drafting outreach, meeting prep, contact preferences |
| `projects.md` | picking up a project, reviewing scope, key decisions |
| `task-management.md` | project tracking, triage, workflow patterns |

These are starter domains — add, rename, or split as your project grows. The goal is one file per area of concern, not one file per memory.

## Usage

```bash
# Search across all cold storage:
grep -r "keyword" cold-storage/

# Read a specific domain:
cat cold-storage/infrastructure.md
```

## Entry Format

Each entry in a domain file:

```markdown
### entry-slug

Brief description of what this covers.

- Key fact or rule
- Another fact
- Command or value: `example-value`
```

## Demotion Guide

**Keep in MEMORY.md** (always-on):
- Always/never rules that apply across many sessions
- Communication anti-patterns and tone corrections
- Safety gates and critical protocols
- Lessons from repeated mistakes

**Move to cold storage** (on-demand):
- Port numbers, API field names, credential formats
- Active migration context, one-time decisions
- Single-incident root cause fixes
- Anything only relevant in specific rare contexts

## Maintenance

- Target: keep `MEMORY.md` well under the 200-line hard limit — aim for ≤100 lines so you have room to grow before truncation becomes a risk
- Add new entries to domain files when demoting from `MEMORY.md`
- Run `/memory-health` to audit line count and surface demotion candidates
- If 3+ sessions in a row produce no-match entries for a topic, create a new domain file for it
