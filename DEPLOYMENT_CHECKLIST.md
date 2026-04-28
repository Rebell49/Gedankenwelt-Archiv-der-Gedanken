# Pre-Deployment Checklist

Use this checklist before deploying to production.

## Security

- [ ] **Environment Variables**
  - [ ] Generate new JWT secrets: `openssl rand -base64 32`
  - [ ] OPENAI_API_KEY is valid (test with API call)
  - [ ] DATABASE_URL uses strong password (test connection)
  - [ ] No secrets in source code or .env committed to git
  - [ ] `.env` is in `.gitignore`

- [ ] **Database**
  - [ ] All migrations applied: `npx prisma migrate deploy`
  - [ ] Database user has minimal permissions (read/write, no admin)
  - [ ] Backups enabled (daily minimum)
  - [ ] Automated backup restoration tested

- [ ] **API Security**
  - [ ] CORS enabled only for expected origins (no wildcard `*`)
  - [ ] JWT token expiration set < 30 minutes
  - [ ] Refresh token rotation enabled
  - [ ] Rate limiting enabled on auth endpoints
  - [ ] Input validation using Zod on all routes
  - [ ] SQL injection tests passed (use parameterized queries only)
  - [ ] XSS protection enabled (set Content-Security-Policy headers)

- [ ] **Frontend Security**
  - [ ] No hardcoded API keys or secrets
  - [ ] HTTPS only (no http://)
  - [ ] Secure cookies: HttpOnly + Secure + SameSite=Strict
  - [ ] Content Security Policy headers set

- [ ] **Dependency Security**
  - [ ] Run `npm audit` (zero vulnerabilities or justified exceptions)
  - [ ] Review production dependencies only (no dev tools in prod)
  - [ ] Lock file committed (package-lock.json or pnpm-lock.yaml)

---

## Performance

- [ ] **Frontend Build**
  - [ ] Production build tested: `npm run build && npm run preview`
  - [ ] Bundle size checked (target: <500KB gzipped)
  - [ ] Code splitting verified (check Network tab in DevTools)
  - [ ] Images optimized (no >2MB images)
  - [ ] Service Worker enabled (if offline support needed)

- [ ] **Backend Performance**
  - [ ] Database indexes created on high-query fields
  - [ ] Connection pooling configured (max: 20, min: 5)
  - [ ] Slow query logging enabled
  - [ ] API response times < 200ms (p95)
  - [ ] Compression middleware enabled
  - [ ] Caching headers set on static assets (Cache-Control)

- [ ] **Database**
  - [ ] Query optimization completed (EXPLAIN ANALYZE on slow queries)
  - [ ] Backup/restore tested (< 5 minutes RTO)
  - [ ] Connection pool tested under load

---

## Functionality

- [ ] **Core Features**
  - [ ] User authentication works (sign up, login, logout, refresh)
  - [ ] Creating/viewing planets functional
  - [ ] Submitting thoughts works
  - [ ] AI moderation processes submissions
  - [ ] Admin panel loads and functions
  - [ ] Error handling shows user-friendly messages

- [ ] **API Integration**
  - [ ] Frontend connects to production API
  - [ ] VITE_API_URL correctly set in frontend
  - [ ] JWT tokens refreshed automatically
  - [ ] Network requests use HTTPS

- [ ] **3D Rendering**
  - [ ] Universe view loads without errors
  - [ ] 3D objects render on various browsers (Chrome, Firefox, Safari)
  - [ ] Performance acceptable on mid-range devices
  - [ ] Mobile rendering optimized (reduced quality)

---

## Infrastructure & DevOps

- [ ] **Deployment**
  - [ ] Backend deployed and health check passing: `curl https://api.yourdomain.com/api/health`
  - [ ] Frontend deployed and loads without errors
  - [ ] Database migrations applied to production DB
  - [ ] Seed data loaded (or manual setup completed)

- [ ] **Environment**
  - [ ] Node.js version consistent (v18+ or v20 LTS)
  - [ ] PostgreSQL version >= 14
  - [ ] Redis (if used) is accessible
  - [ ] All external services (OpenAI, etc.) are accessible

- [ ] **Monitoring & Logging**
  - [ ] Error tracking enabled (Sentry or DataDog)
  - [ ] Logs aggregated and searchable
  - [ ] Monitoring dashboard set up
  - [ ] Alerts configured for: error rate >1%, response time >500ms, DB CPU >80%

- [ ] **Backups & Recovery**
  - [ ] Database backups automated and tested
  - [ ] Backup storage secured and encrypted
  - [ ] Disaster recovery plan documented
  - [ ] RTO/RPO defined and acceptable

---

## Documentation

- [ ] **System Documentation**
  - [ ] Architecture diagram in place
  - [ ] API documentation up-to-date
  - [ ] Deployment instructions documented
  - [ ] Database schema documented

- [ ] **Runbooks**
  - [ ] How to deploy a new version
  - [ ] How to rollback a failed deployment
  - [ ] How to scale horizontally (add more instances)
  - [ ] How to respond to outages

---

## Testing

- [ ] **Automated Tests**
  - [ ] Unit tests pass: `npm test`
  - [ ] Integration tests pass (if any): `npm run test:integration`
  - [ ] Backend test coverage > 70%
  - [ ] Frontend test coverage > 60%

- [ ] **Manual Testing**
  - [ ] Sign up flow works end-to-end
  - [ ] Create and submit a thought
  - [ ] Test with valid/invalid inputs (edge cases)
  - [ ] Admin panel functionality tested
  - [ ] Test on mobile device

- [ ] **Load Testing**
  - [ ] Load test conducted (simulate expected traffic)
  - [ ] No timeouts or crashes at expected peak load
  - [ ] Database remains responsive (< 200ms response time)

---

## Post-Deployment

These should be done after deployment and in the first 24 hours:

- [ ] Monitor error logs for first hour (check Sentry/DataDog)
- [ ] Verify API response times are acceptable
- [ ] Check database connection pool status
- [ ] Validate that backups are running
- [ ] Test authentication (sign up new user, login)
- [ ] Monitor resource utilization (CPU, memory, disk)
- [ ] Verify CORS is working correctly
- [ ] Check for any unexpected 500 errors
- [ ] Validate email notifications (if applicable)
- [ ] Document any issues and create follow-up tasks

---

## Deployment Rollback Plan

If critical issues occur post-deployment:

1. **Immediate**: Revert to previous version
   ```bash
   # Backend
   git revert <commit-hash>
   git push

   # Frontend
   vercel rollback  # If using Vercel
   ```

2. **Database**: Restore from backup
   ```bash
   DATABASE_URL="..." npx prisma db pull
   ```

3. **Communication**: Notify users of incident + ETA
4. **Post-Mortem**: Document what went wrong and how to prevent

---

## Sign-Off

- [ ] **Team Lead**: Reviewed and approved
- [ ] **QA**: Tested and verified
- [ ] **Security**: Security review completed
- [ ] **Ops**: Infrastructure ready and monitored

**Deployed By**: _________________  
**Deployment Date**: _________________  
**Version**: _________________  
