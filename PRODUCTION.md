# Production Deployment Guide

## Overview

This document describes how to deploy Bissi to production.

## Pre-Deployment Checklist

- [ ] All secrets are in your secrets manager (not in `.env`)
- [ ] Database backups are configured
- [ ] TLS/HTTPS certificate is ready
- [ ] API rate limits are tuned for expected traffic
- [ ] CORS origins are set correctly
- [ ] Admin password has been changed from default
- [ ] Monitoring & alerting is configured

## Docker Deployment

### Using Docker Compose (local production-like setup)

```bash
# Set production variables
export NODE_ENV=production
export DB_PASSWORD=$(openssl rand -base64 32)
export CORS_ORIGINS=https://app.yourdomain.com

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f api

# Database migration (if first-time)
docker-compose exec api pnpm --filter @workspace/db run push

# Seed admin user (first deployment only)
docker-compose exec api pnpm --filter @workspace/scripts run seed
```

### Environment Variables

Required in production:

- `DATABASE_URL` — Full PostgreSQL connection string (use managed DB)
- `PORT` — API port (default: 5001)
- `NODE_ENV` — Always `production`
- `CORS_ORIGINS` — Comma-separated list of allowed frontend domains
- `LOG_LEVEL` — `info` or `warn` for production

Optional:

- `DATABASE_SSL` — Set to `true` if using AWS RDS, Heroku, etc.
- `DB_POOL_MAX` — Max connections (default 20 for production)
- `RATE_LIMIT_MAX` — Requests per minute per IP (default 300)

## Cloud Platforms

### Vercel (Frontend) + Managed Database

1. Push to GitHub
2. Connect repo to Vercel
3. Set `NODE_ENV=production`, `DATABASE_URL` in Vercel Environment Variables
4. Deploy

### AWS ECS / Fargate

1. Build Docker image
2. Push to ECR
3. Create ECS task definition with environment variables
4. Set up load balancer + auto-scaling
5. Point RDS instance

### Railway / Fly.io

Both support `Dockerfile` directly:

```bash
fly deploy  # or railway up
```

## Database

### Schema Migration

Drizzle is configured to manage schema. On first deployment:

```bash
pnpm --filter @workspace/db run push
```

This creates all tables. For updates, modify `lib/db/src/schema/*.ts` and re-run.

### Backup Strategy

- **Automated**: Enable point-in-time recovery on your managed DB
- **Manual**: `pg_dump -U user -d bissi_db > backup.sql`
- **Restore**: `psql -U user -d bissi_db < backup.sql`

## Monitoring

### Health Checks

Both Docker and Kubernetes use:

```bash
curl http://localhost:5001/health
```

Returns `200 OK` if database is reachable.

### Logs

Use a log aggregator:

- **Datadog** — ship pino logs via agent
- **CloudWatch** — if on AWS
- **Loki** — self-hosted, Grafana compatible

### Key Metrics to Monitor

- API response time (p50, p95, p99)
- Error rate (5xx responses)
- Database connection pool usage
- Rate-limit rejections per minute
- Session expiry events

## Security

### TLS/HTTPS

Always use HTTPS in production. Options:

- **nginx reverse proxy** with Let's Encrypt
- **AWS ALB** with ACM certificate
- **Vercel** (automatic)

### Password Hashing

Passwords are hashed with bcrypt (cost 12). This is secure but slow (~100ms per hash).

### Session Security

- Sessions stored in `sessions` table, TTL 8 hours
- Accessible only server-side
- `httpOnly` flag set on cookies
- Secure flag set on HTTPS

### Rate Limiting

API endpoint rate limit: 300 requests/min per IP. Adjust `RATE_LIMIT_MAX` based on expected traffic.

### Secrets Management

**NEVER**:

- Commit `.env` with real values
- Expose `DATABASE_URL` in logs
- Share passwords via Slack/email

**DO**:

- Use your platform's secrets manager (AWS Secrets Manager, Vercel Env Vars, etc.)
- Rotate admin password on first login
- Use temporary tokens for database migrations

## Troubleshooting

### API won't start

```bash
# Check required env vars
echo $DATABASE_URL
echo $PORT

# Test DB connection
psql $DATABASE_URL -c "SELECT 1;"
```

### High memory usage

Increase Node.js heap:

```bash
node --max-old-space-size=512 ./dist/index.mjs
```

### Database connection pool exhausted

Increase `DB_POOL_MAX` in `.env`.

## Support

For issues, check:

- Server logs: `docker logs bissi-api`
- Database logs: `docker logs bissi-postgres`
- GitHub Issues: [repository link]
