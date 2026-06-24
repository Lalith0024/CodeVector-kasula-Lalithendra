const express = require('express');
const pool = require('../db/connection');
const { encodeCursor, decodeCursor, InvalidCursorError } = require('../utils/cursor');

const router = express.Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const CACHE_TTL_MS = 60_000;
const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;

let totalProductCountCache = 0;
let lastCountRefresh = 0;

let categoryListCache = [];
let lastCategoryRefresh = 0;

// COUNT(*) on every request is expensive on large InnoDB tables. 
// We cache it in-memory and refresh it asynchronously to avoid blocking the client.
async function refreshTotalCount() {
  const now = Date.now();
  if (now - lastCountRefresh > CACHE_TTL_MS) {
    try {
      const [rows] = await pool.query('SELECT value FROM metadata WHERE key_name = ?', ['product_count']);
      if (rows.length > 0) {
         totalProductCountCache = parseInt(rows[0].value, 10);
      }
      lastCountRefresh = now;
    } catch (error) {
      console.error('Failed to refresh total count:', error);
    }
  }
}

async function refreshCategories() {
  const now = Date.now();
  if (now - lastCategoryRefresh > CATEGORY_CACHE_TTL_MS || categoryListCache.length === 0) {
    try {
      const [rows] = await pool.query('SELECT DISTINCT category FROM products ORDER BY category ASC');
      categoryListCache = rows.map(r => r.category);
      lastCategoryRefresh = now;
    } catch (error) {
      console.error('Failed to refresh categories:', error);
    }
  }
}

refreshTotalCount();
refreshCategories();

router.get('/products', async (req, res) => {
  try {
    const limitParam = parseInt(req.query.limit, 10);
    const limit = isNaN(limitParam) ? DEFAULT_LIMIT : limitParam;
    
    if (limit > MAX_LIMIT) {
      return res.status(400).json({ error: `Limit cannot exceed ${MAX_LIMIT}` });
    }

    const { category, cursor } = req.query;
    
    let decodedCursor = null;
    if (cursor) {
      decodedCursor = decodeCursor(cursor);
    }

    const fetchLimit = limit + 1;
    let queryParams = [];
    let queryStr = `
      SELECT id, name, category, price, created_at, updated_at
      FROM products
    `;

    const whereClauses = [];

    if (category) {
      whereClauses.push('category = ?');
      queryParams.push(category);
    }

    if (decodedCursor) {
      whereClauses.push('((created_at < ?) OR (created_at = ? AND id < ?))');
      queryParams.push(decodedCursor.created_at, decodedCursor.created_at, decodedCursor.id);
    }

    if (whereClauses.length > 0) {
      queryStr += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    queryStr += ` ORDER BY created_at DESC, id DESC LIMIT ?`;
    queryParams.push(fetchLimit);

    const [rows] = await pool.query(queryStr, queryParams);

    let nextCursor = null;
    let data = rows;

    if (rows.length === fetchLimit) {
      const lastItem = rows[rows.length - 2];
      nextCursor = encodeCursor({ created_at: lastItem.created_at, id: lastItem.id });
      data = rows.slice(0, limit);
    }

    refreshTotalCount();

    res.json({
      data,
      next_cursor: nextCursor,
      total: totalProductCountCache
    });
  } catch (error) {
    if (error instanceof InvalidCursorError) {
      return res.status(400).json({ error: 'Invalid cursor' });
    }
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    refreshCategories();
    res.json(categoryListCache);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
