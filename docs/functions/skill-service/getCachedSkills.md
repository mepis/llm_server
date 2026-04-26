tags: [skills, caching]
role: backend-developer

# getCachedSkills()

Returns cached skills with a 30-second TTL cache. Cache is invalidated (`_cachedSkills = null`) on skill create, update, or delete operations.

**Cache lifecycle:**

```
  getCachedSkills() called
        │
  Cached data exists? ── YES
  Age < 30 seconds? ──── YES ──→ return cached copy
        │ NO
        ▼
  Call discoverSkills()
        │
  Store in _cachedSkills
  Set _cacheTimestamp = Date.now()
        │
  Return fresh data
```

---
[Back to Skill Service Functions](./skill-service-functions.md)
