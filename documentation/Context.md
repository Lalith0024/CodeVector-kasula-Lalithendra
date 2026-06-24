# CodeVector Internship — Product Browser Backend

## What you're actually building

A paginated product catalog API for ~200k products. The core engineering challenge is **stable cursor-based pagination** — i.e., even if rows are inserted/updated while a user browses, they must see every product exactly once in a consistent order (newest first). Category filtering must compose with pagination cleanly.

---

## Tech Stack Decision

**Recommended: React + Node/Express + MySQL (hosted on PlanetScale or Railway)**

You asked about Supabase vs MongoDB. Here's the honest breakdown:

| Option | Verdict |
|--------|---------|
| MySQL (PlanetScale / Railway free tier) | Best fit. You know it, composite indexes on `(created_at, id)` are exactly what cursor pagination needs, and the SQL is straightforward |
| Supabase (PostgreSQL) | Fine choice too. Same composite index approach works. Supabase free tier is generous. The UI is friendlier than raw MySQL consoles |
| MongoDB | Not ideal here. Cursor pagination on sorted collections works but requires careful use of `_id` + sort combos. The schema is simple enough that a document DB adds no value |

**Decision**: Stick with MySQL. Use **Railway** (free tier, no credit card) for hosting the DB, or **PlanetScale** (also free, MySQL-compatible). Supabase is PostgreSQL — totally viable but introduces a new tool for no gain when you're already comfortable with MySQL. Don't switch for the sake of it.

---

## Data Model

### `products` table

```sql
CREATE TABLE products (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255)   NOT NULL,
  category     VARCHAR(100)   NOT NULL,
  price        DECIMAL(10,2)  NOT NULL,
  created_at   BIGINT UNSIGNED NOT NULL,  -- Unix ms timestamp
  updated_at   BIGINT UNSIGNED NOT NULL
);

-- The two indexes that make everything fast
CREATE INDEX idx_category_created ON products (category, created_at DESC, id DESC);
CREATE INDEX idx_created_id       ON products (created_at DESC, id DESC);
```

Why `BIGINT` for timestamps instead of `DATETIME`? Easier to compare in cursor logic — you pass a number, no timezone confusion.

### `categories` table (optional but clean)

```sql
CREATE TABLE categories (
  name          VARCHAR(100) PRIMARY KEY,
  product_count INT DEFAULT 0
);
```

You can skip this and just `SELECT DISTINCT category FROM products` on startup, then cache it. But a real system would maintain this.

---

## The Core Engineering Problem: Stable Pagination

### Why OFFSET is wrong

If you use `LIMIT 20 OFFSET 100` and 50 products are inserted while the user is on page 3, pages 4+ shift by 50 rows — the user sees duplicates and misses items. This is the whole point of the task.

### Cursor-based pagination (what you must build)

The idea: instead of a page number, the client holds a **cursor** — a bookmark pointing to the last item they saw. The server fetches the next page *after* that cursor.

For "newest first" ordering, your cursor encodes `(created_at, id)` of the last item on the previous page:

```
GET /products?cursor=eyJjcmVhdGVkX2F0IjoxNzA...&limit=20
```

The cursor is just `base64(JSON.stringify({ created_at, id }))`. On the server, decode it and query:

```sql
-- Without category filter
SELECT * FROM products
WHERE (created_at < :last_created_at)
   OR (created_at = :last_created_at AND id < :last_id)
ORDER BY created_at DESC, id DESC
LIMIT :limit + 1;

-- With category filter
SELECT * FROM products
WHERE category = :category
  AND (
    (created_at < :last_created_at)
    OR (created_at = :last_created_at AND id < :last_id)
  )
ORDER BY created_at DESC, id DESC
LIMIT :limit + 1;
```

Fetch `limit + 1` rows. If you get `limit + 1` back, there's a next page — return the first `limit` rows and set `next_cursor` to the last of those. If you get `limit` or fewer, you're on the last page, return `next_cursor: null`.

**Why this survives inserts/updates**: New products inserted while browsing have a newer `created_at` — they appear before your cursor, not after. You never see them mid-browse. Products you've already passed stay behind your cursor. You get exactly what you saw, nothing more, nothing less.

---

## API Design

```
GET /api/products
  ?category=electronics    (optional)
  ?cursor=<base64string>   (optional, absent = first page)
  ?limit=20                (optional, default 20, max 100)

Response:
{
  "data": [ ...products ],
  "next_cursor": "eyJjc...",   // null if last page
  "total": 200000              // cached count, not live COUNT(*)
}

GET /api/categories
Response: ["electronics", "clothing", "books", ...]
```

---

## Seed Script

Don't loop and insert one by one — that takes minutes for 200k rows.

Use **bulk insert in batches of 1000–5000 rows** with a single `INSERT INTO products VALUES (...),(...),...`.

Or better: use `mysql2`'s connection.query with a values array.

Rough approach:
1. Define ~10 categories and ~500 product name templates
2. For each batch of 5000, generate rows with random combos
3. Spread `created_at` across the past 2 years (random timestamps)
4. Run in parallel batches if possible

Target: the seed script should finish in under 2 minutes.

---

## Project File Structure

```
/
├── server/
│   ├── index.js            # Express app entry
│   ├── routes/
│   │   └── products.js     # GET /products, GET /categories
│   ├── db/
│   │   ├── connection.js   # mysql2 pool setup
│   │   └── seed.js         # Seed script (committed separately)
│   └── utils/
│       └── cursor.js       # encode/decode cursor helpers
├── client/                 # Vite React app
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── ProductList.jsx
│           ├── FilterBar.jsx
│           └── Pagination.jsx
├── .env.example
└── README.md
```

---

## Expected API Behavior (what the recruiter is checking)

| Scenario | Expected behavior |
|----------|-------------------|
| First page load, no filter | Returns newest 20 products, `next_cursor` set |
| Click "next page" | Returns next 20, none duplicated from previous page |
| 50 products inserted while user is on page 3 | Pages 4+ are unaffected — user still sees every original product exactly once |
| Filter by category | Cursor pagination still works, filter composes cleanly |
| Reach last page | `next_cursor` is `null` |
| Invalid cursor | Return 400 with clear error message |

---

## Performance Expectations

With proper composite indexes on 200k rows:

- First page (no cursor): `~5–15ms`
- Subsequent pages with cursor: `~5–20ms`
- Filtered queries: `~5–20ms`

If you're seeing `>100ms`, your indexes aren't being used. Run `EXPLAIN SELECT ...` to check.

---

## What to Cache

Don't do `SELECT COUNT(*) FROM products` on every request — it's slow on large tables. Either:
- Cache it in memory on server start and refresh every 60s
- Store it in a `metadata` table updated by the seed script
- Compute it once and hardcode it in your response

---

## Deployment

| Part | Platform | Notes |
|------|----------|-------|
| Backend | Render (free web service) | Set env vars for DB credentials |
| Database | Railway (free MySQL) or PlanetScale | Copy the connection string into Render's env |
| Frontend | Vercel or Netlify | Just `vite build`, deploy `dist/` |

On Railway: create a new project → add MySQL → copy `DATABASE_URL` → done. No credit card.

---

## What to Write in Your Cover Note

They asked for: what you chose and why, what you'd improve with more time, how you used AI.

**What you chose and why**: MySQL with cursor-based pagination. Cursor pagination solves the stated "no duplicates/no skips" requirement in a way OFFSET fundamentally cannot. Composite index on `(category, created_at, id)` keeps every filtered + sorted query under 20ms.

**What you'd improve**: true bidirectional pagination (prev_cursor), a Redis cache layer for category counts, rate limiting, input validation middleware.

**How you used AI**: be honest — say you used it to draft boilerplate and sanity-check the cursor SQL, but understood and could explain every line. That's exactly what they want to hear.

---

## Things That Will Get You Points

1. The cursor logic is correct — no duplicates, no missed items under concurrent writes
2. The seed script uses bulk inserts and completes fast
3. Your `EXPLAIN` output shows index usage (mention this in your note)
4. The API returns a clean, consistent response shape
5. Error handling on bad cursors

## Things That Will Lose You Points

1. Using OFFSET — automatic disqualifier for the core requirement
2. Seed script that loops row by row
3. `SELECT COUNT(*)` on every request
4. No indexes on the products table
5. Category filter that breaks the cursor logic



