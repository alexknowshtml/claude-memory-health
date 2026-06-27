# Cold Storage: Infrastructure

Ports, servers, certs, hosting, and deployment specifics.
**When to load:** working on server config, debugging connectivity, managing deployments, troubleshooting certs.

## Service Ports

Document your local service port assignments here — one source of truth so you're not grepping process lists.

- API server: `3000`
- Worker/queue: `3001`
- Metrics: `9090`

**How to apply:** Check this file before scanning `lsof`/`netstat` for port conflicts. Update whenever a service port changes.

## TLS / Certificate Renewal

- **Cert renewal is automated — manual trigger for emergencies only.** Auto-renew runs via cron. Manual: `certbot renew --dry-run` to test, drop `--dry-run` to apply.
- After renewal, restart the reverse proxy to pick up the new cert.
- Wildcard certs require DNS challenge, not HTTP challenge.

## Deployment Process

- **Use wrapper scripts, not raw process manager commands** — raw `restart`/`delete`/`start` commands bypass safety checks and can leave services in inconsistent state.

**Why:** Direct process manager commands don't verify the build succeeded, don't check config validity, and don't leave an audit trail. Wrapper scripts enforce these gates.
**How to apply:**
- Code changes → wrapper with standard restart
- Config changes → wrapper with config-reload flag
- Full rebuild → run from a clean shell session, not inside an agent/IDE terminal
- After any deploy: verify all services are green before closing the session
