# Issue 2: Query Performance

## Anti-pattern

Per-post `getPostCounts()` duplicated across feed, posts, search, and bookmarks services. Each call = 3 SQL queries (like count, comment count, isLiked).

## Before (N=10 posts, authenticated)

| Operation | Queries |
|-----------|---------|
| Home feed | 2 + (3 × 10) = **32** |
| User profile page | 5 (profile) + 1 (posts list) + (3 × 10) = **36** |
| Bookmarks (10 items) | 1 + (4 × 10) = **41** |

## After

Shared `enrichPostsWithCounts()` in `post-enrichment.ts` batches counts with 3 queries total regardless of N.

| Operation | Queries |
|-----------|---------|
| Home feed | 2 + 3 = **5** |
| User profile posts | 1 + 3 = **4** (+ 5 profile metadata) |
| Bookmarks | 1 + 1 + 3 = **5** |

## Pattern for future developers

Always use `enrichPostsWithCounts()` when returning posts with engagement metadata. Never loop with per-item count queries.
