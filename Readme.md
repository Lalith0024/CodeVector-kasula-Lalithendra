# Product Catalog API — CodeVector Internship Task

## Overview
This project is a high-performance paginated product catalog API designed to handle over 200,000 products correctly. The core constraint addressed is stable cursor-based pagination. Unlike traditional OFFSET pagination, which breaks under concurrent writes (causing duplicate or skipped items), the cursor approach ensures that products maintain stable positions while the data changes.

## Live URLs
- **Backend**: [(Render Link)](https://codevector-kasula-lalithendra.onrender.com)
- **Frontend**: [(Vercel Link)](https://code-vector-kasula-lalithendra.vercel.app/)

## Tech Choices and Why

### MySQL on Railway
A relational database like MySQL combined with composite indexes on `(category, created_at, id)` makes cursor pagination incredibly fast and mathematically correct. Instead of scanning and discarding thousands of rows, the database directly seeks to the exact position of the last seen row using the index, leading to consistent O(1) page loads regardless of the dataset size.

### Cursor vs OFFSET
When 50 new products get inserted while a user is on page 3, every subsequent OFFSET-based query shifts by 50 rows. This causes the user to see duplicate products they've already viewed, or skip items entirely. Cursor pagination anchors to a specific row (via `created_at` and `id`). Any inserts newer than that row will naturally land before the cursor, never affecting the sequence of items requested after the cursor.

## How to Run Locally

```bash
# Clone and install
cd backend && npm install
cd ../frontend && npm install

# Set up env
cp backend/.env.example backend/.env
# (Fill in your Railway MySQL credentials in backend/.env)

# Create schema and seed
cd backend && node db/seed.js

# Start backend
node app.js

# Start frontend (separate terminal)
cd frontend && npm run dev
```

## API Reference

| Endpoint | Method | Params | Description |
|----------|--------|--------|-------------|
| `/api/products` | GET | `category` (optional)<br>`cursor` (optional)<br>`limit` (default: 20, max: 100) | Fetches a paginated list of products. |
| `/api/categories` | GET | None | Fetches an array of all distinct categories. |

### Example Response: `/api/products`
```json
{
  "data": [
    {
      "id": 199982,
      "name": "Precision Wireless Keyboard",
      "category": "Electronics",
      "price": "149.99",
      "created_at": 1718956800000,
      "updated_at": 1718960000000
    }
  ],
  "next_cursor": "eyJjcmVhdGVkX2F0IjoxNzE4OTU2ODAwMDAwLCJpZCI6MTk5OTgyfQ",
  "total": 200000
}
```

## Performance
The database utilizes composite indexes on both `(created_at DESC, id DESC)` and `(category, created_at DESC, id DESC)`. This allows cursor queries to execute in roughly 5–20ms. The `COUNT(*)` query, which is expensive on large InnoDB tables, is executed asynchronously in the background and cached in-memory. This prevents blocking requests while still offering highly accurate metrics.

## What I'd Improve With More Time
- **Bidirectional Cursor**: Implementing a `prev_cursor` to allow navigating backwards natively via the API instead of relying on frontend caching.
- **Caching**: Integrating Redis to handle the category list and total counts across horizontal server instances.
- **Validation**: Adding request validation middleware (like Zod or Joi) to strictly enforce API param schemas.
- **Search**: Integrating full-text product search via a dedicated search index (e.g., Elasticsearch or Typesense) instead of client-side filtering.
- **Rate Limiting**: Implementing API rate limits to prevent abuse on public endpoints.

## How I Used AI
I used Claude to draft the initial boilerplate structures and sanity-check the cursor SQL logic constraints. After generation, I reviewed every single line and verified the behavior to ensure I understood how each piece works cohesively. I will be fully able to walk through, modify, and explain any part of this codebase live.
