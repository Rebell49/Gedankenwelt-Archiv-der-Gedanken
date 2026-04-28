# Scaling & Performance Guide

This document details strategies for scaling Gedankenwelt from 100 to 10K+ concurrent users.

## Performance Metrics & Goals

| Metric | Target | Scaling Lever |
|--------|--------|---|
| API Response Time (p95) | <200ms | Database indexing, caching, query optimization |
| UI Render Time | <2s | Code splitting, lazy loading, image optimization |
| 3D Rendering FPS | 45-60 FPS | LOD, instancing, object pooling, reduced shadows |
| Backend Memory/Instance | <500MB | Query optimization, connection pooling, streaming |
| Database CPU | <70% | Indexes, read replicas, query analysis |

---

## Phase 1: 100–500 Concurrent Users (Development → Early Production)

**Infrastructure**:
- Single backend instance
- Single database instance
- No Redis (optional)
- Load: ~10 RPS (requests per second)

**Optimizations**:
1. **Database**
   - Enable connection pooling in Prisma (default: 10 connections)
   - Add indexes on frequently queried fields
   ```prisma
   profile.email @@index
   thought.planetId @@index
   thought.createdAt @@index
   ```
   - Enable query result caching (TanStack React Query: 5min stale time)

2. **Frontend**
   - Code-split lazy load 3D scene: `React.lazy(() => import('./UniverseView.jsx'))`
   - Lazy load admin panel
   - Enable compression in Vite

3. **Backend**
   - Enable gzip compression: `app.use(compression())`
   - Set reasonable API timeouts (10-15s)
   - Log slow queries: `prisma.queryRaw('EXPLAIN ANALYZE ...')`

**Monitoring**: Basic logging + manual spot-checks

---

## Phase 2: 500–2K Concurrent Users (Early Scale)

**Infrastructure**:
- 2–3 backend instances (load-balanced)
- Single primary + 1 read replica database
- Redis cache enabled
- Load: ~50–100 RPS

**Optimizations**:
1. **Database**
   - Implement PgBouncer connection pooling (transaction mode)
   - Add read replica for analytics/reporting queries
   - Analyze and optimize slow queries:
   ```sql
   SELECT query, mean_exec_time, calls FROM pg_stat_statements
   ORDER BY mean_exec_time DESC LIMIT 10;
   ```

2. **Caching Strategy**
   - Cache API responses (5–10min)
   - User session data in Redis
   - Moderation results (avoid re-processing identical submissions)
   ```javascript
   // backend/services/cache.service.js
   const userProfiles = await redis.getex(`user:${id}`, 'EX', 600);
   ```

3. **Moderation Queue**
   - Defer AI moderation to background job queue (Bull.js or BullMQ)
   - Allow user submission while moderation runs async
   - Batch moderation requests (process 10 at a time)

4. **Frontend 3D Optimization**
   - Reduce planet count on initial load (stream additional data)
   - Implement Level of Detail (LOD) for 3D objects
   - Disable expensive effects (bloom, shadows) on low-end devices

5. **API Rate Limiting**
   - 100 req/min per IP
   - 1000 req/min per authenticated user
   - Use token bucket algorithm with Redis

**Monitoring**: 
- Basic APM (DataDog, New Relic)
- Database query tracking
- Error tracking (Sentry)

---

## Phase 3: 2K–10K Concurrent Users (Scaling Out)

**Infrastructure**:
- 5–10 backend instances (auto-scaling group)
- Primary DB + 2–3 read replicas
- Redis cluster (3+ nodes)
- Separate worker instances for moderation (2–5 workers)
- Load: ~200–500 RPS

**Optimizations**:
1. **Database Sharding** (if user base >500K)
   - Shard by region or user ID hash
   - Implement routing layer to direct queries

2. **Advanced Caching**
   - Cache user roles/permissions (invalidate on change)
   - Cache popular planets/thoughts (hot data)
   - Implement cache invalidation strategy (tags, dependent keys)

3. **Query Optimization**
   - Batch requests (e.g., fetch 10 planets in 1 query)
   - Use Prisma `select` to limit fields
   - Implement cursor-based pagination (avoid offset)
   ```javascript
   const thoughts = await db.thought.findMany({
     take: 20,
     skip: 1,
     cursor: { id: lastThoughtId },
   });
   ```

4. **Streaming & Pagination**
   - Stream large datasets instead of returning JSON blob
   - Implement GraphQL Subscriptions for real-time updates
   - Paginate 3D object data (load planets on viewport entry)

5. **Moderation Workers**
   - 2–5 dedicated worker instances (separate from API)
   - Queue system with priority (spam > offensive > other)
   - Batch processing: 20–50 requests per batch
   - Fallback: offline moderation until AI is available

6. **Frontend Optimization**
   - Implement virtual scrolling for large planet lists
   - Prefetch data on hover/route transition
   - Request compression (gzip, brotli)
   - Service Worker for offline capability

**Monitoring**:
- Real-time dashboards (Grafana)
- Distributed tracing (Jaeger, DataDog)
- Custom metrics (submission rate, moderation latency)
- Alerts for: response time >500ms, error rate >1%, DB CPU >80%

---

## Phase 4: 10K+ Concurrent Users (Advanced Scale)

**Infrastructure**:
- Kubernetes cluster (10+ nodes)
- PostgreSQL: Citus (distributed, auto-sharding)
- Redis Cluster (6+ nodes)
- Moderation service: 10+ workers + Queue (RabbitMQ)
- Load: >500 RPS

**Optimizations**:
1. **Database at Extreme Scale**
   - Use Citus for automatic sharding
   - Implement read-write separation
   - Asynchronous replication (accept eventual consistency)

2. **Message Queue (RabbitMQ / Kafka)**
   - Decouple moderation from API
   - Event-driven architecture
   - Publish-subscribe for real-time updates

3. **API Gateway**
   - Request batching (GraphQL Dataloader)
   - Request deduplication
   - Throttling per endpoint
   - Circuit breaker for downstream services

4. **Content Delivery**
   - CDN for static assets (Cloudflare, Akamai)
   - Edge caching for API responses (reduce origin requests)
   - Image optimization (WebP, responsive formats)

5. **3D Rendering at Scale**
   - Tile-based planet streaming (load only visible zones)
   - Server-side LOD calculation (send appropriate detail level)
   - Texture compression (DXT, ASTC)
   - Instancing for 1000+ objects per planet

6. **Observability**
   - Distributed tracing on every request
   - Custom spans for critical paths
   - Logs aggregation (ELK, Datadog, Splunk)
   - Real-time alerting and incident response

**Example Scaling Timeline**:
- Month 1–2: 100–500 users → Phase 1 setup
- Month 3–4: 500–2K users → Phase 2 (Redis, read replicas, queue)
- Month 5–8: 2K–10K users → Phase 3 (sharding, streaming, APM)
- Month 9+: 10K+ users → Phase 4 (Kubernetes, Citus, Kafka)

---

## Performance Tuning Checklist

### Backend
- [ ] Enable `compression` middleware
- [ ] Configure connection pooling (Prisma or PgBouncer)
- [ ] Add indexes to frequently queried fields
- [ ] Implement query result caching (Redis)
- [ ] Rate limiting enabled (express-rate-limit)
- [ ] Gzip compression for API responses
- [ ] API timeouts set (10–15s default)
- [ ] Error handling and circuit breakers
- [ ] Database query monitoring (slow query log)
- [ ] Memory limits set in Docker/Kubernetes

### Frontend
- [ ] Code-split lazy loading enabled
- [ ] Tree-shaking working (check build report)
- [ ] Images optimized (WebP, responsive)
- [ ] Lazy loading for off-screen images
- [ ] Service Worker for offline caching (optional)
- [ ] Compression enabled (Brotli preferred)
- [ ] Bundle size < 500KB (gzipped)
- [ ] 3D instancing enabled for 100+ objects
- [ ] LOD for 3D meshes

### Database
- [ ] Indexes on `email`, `planetId`, `userId`, `createdAt`
- [ ] Connection pooling: `max: 20, min: 5`
- [ ] Query logging to file (for analysis)
- [ ] Slow query threshold: 500ms
- [ ] Backups: daily minimum, tested restoration
- [ ] Replication lag monitoring: <1s
- [ ] Disk space alerts at 80%

---

## Cost Optimization

| Action | Savings | Complexity |
|--------|---------|---|
| Enable caching | 30–40% DB load | Low |
| Connection pooling | 20–30% DB CPU | Low |
| Batch API requests | 20–30% backend load | Medium |
| Image optimization | 40–60% bandwidth | Low |
| CDN for assets | 50–70% bandwidth | Low |
| Delete old data (retention policy) | 10–20% storage | Medium |
| Read replicas for reporting | 30% primary DB CPU | Medium |

---

## Disaster Recovery

1. **Automated Backups**
   - Daily full backups + hourly incremental
   - Test restoration monthly
   - Keep 7 days of backups

2. **Failover**
   - Automated promotion of read replica to primary (5min RTO)
   - Health checks every 30s

3. **Data Consistency**
   - Use transactions for multi-step operations
   - Implement idempotency keys (POST requests)

---

## References
- [Prisma Performance](https://www.prisma.io/docs/concepts/rdbms-connectors/connection-pool)
- [Three.js Performance Tips](https://threejs.org/manual/#en/optimize-lots-of-objects)
- [PostgreSQL Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
