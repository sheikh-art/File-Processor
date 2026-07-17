# Security Policy

## Reporting a Vulnerability

Please do **NOT** open a public GitHub issue for security vulnerabilities. Instead, email security details privately.

## Security Features

### Authentication & Authorization

- Passwords hashed with bcrypt (cost 12) — ~100ms per hash
- Session tokens stored in database with 8-hour TTL
- Admin-only routes protected via middleware
- Rate limiting on `/api/auth/login`: 10 requests/15 min per IP

### Data Protection

- All database connections use parameterized queries (Drizzle ORM)
- No raw SQL queries except read-only dashboards
- CORS restricted to allowed origins in production
- HTTP security headers via `helmet` middleware

### API Security

- Express 5.x with built-in security features
- Rate limiting on all `/api/*` endpoints (default 300 req/min per IP)
- Input validation via Zod schemas
- CORS, CSP, X-Frame-Options headers set by default

### Session Management

- Sessions stored server-side (no JWT tokens)
- `httpOnly` cookie flag prevents XSS token theft
- Secure flag on HTTPS enforces SSL
- Session purge on logout
- No session refresh/extend implemented — users must re-authenticate

### Database

- PostgreSQL 16+ with strong typing via Drizzle
- Prepared statements prevent SQL injection
- Connection pool limits prevent resource exhaustion
- Regular backups recommended

## Best Practices

### Development

- Never commit `.env` files with real secrets
- Use `.env.example` for template
- Run `pnpm audit` before committing
- Keep dependencies updated weekly

### Production

- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- Enable database SSL/TLS
- Set `DATABASE_SSL=true`
- Rotate admin password immediately after first login
- Monitor rate-limit rejection logs for DDoS attempts
- Enable database audit logging
- Use VPN or firewall to restrict database access

### Deployment

- Always use HTTPS in production
- Use TLS 1.2+ only
- Set strong CORS_ORIGINS (never `*`)
- Enable HSTS headers (consider nginx)
- Use managed PostgreSQL (AWS RDS, Azure Database, etc.)
- Enable automated backups with 30-day retention

## Known Limitations

- No two-factor authentication (2FA) implemented
- Session refresh not supported — users must re-login after 8 hours
- No API key authentication (only session-based)
- No audit trail for admin actions
- Rate limiting is per-IP, not per-user

## Upcoming Security Improvements

- [ ] 2FA support
- [ ] API key authentication
- [ ] Admin action audit log
- [ ] Database encryption at rest
- [ ] Session refresh tokens

## Security Updates

- Subscribe to GitHub security advisories for `drizzle-orm`, `express`, `bcryptjs`
- Run `pnpm audit` weekly
- Update Node.js to latest LTS
