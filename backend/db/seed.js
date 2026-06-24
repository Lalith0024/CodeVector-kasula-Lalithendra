const pool = require('./connection');

const CATEGORIES = [
  'Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 
  'Automotive', 'Beauty', 'Food & Grocery', 'Furniture', 'Jewelry', 'Office Supplies'
];

const ADJECTIVES = ['Precision', 'Matte', 'Ergonomic', 'Sleek', 'Compact', 'Durable', 'Wireless', 'Smart', 'Premium', 'Vintage', 'Carbon', 'Ultra'];
const NOUNS = ['Keyboard', 'Stand', 'Headphones', 'Monitor', 'Mouse', 'Chair', 'Desk', 'Lamp', 'Tablet', 'Router', 'Speaker', 'Drive'];

function generateRandomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${adj} ${noun} ${suffix}`;
}

const TOTAL_ROWS = 200000;
const BATCH_SIZE = 5000;
const BATCHES = TOTAL_ROWS / BATCH_SIZE;
const CONCURRENT_BATCHES = 5;

async function runSeed() {
  const startTime = Date.now();

  try {
    console.log('Creating tables if they do not exist...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(255)    NOT NULL,
        category   VARCHAR(100)    NOT NULL,
        price      DECIMAL(10,2)   NOT NULL,
        created_at BIGINT UNSIGNED NOT NULL,
        updated_at BIGINT UNSIGNED NOT NULL
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_category_cursor ON products (category, created_at DESC, id DESC);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_cursor ON products (created_at DESC, id DESC);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS metadata (
        key_name VARCHAR(50) PRIMARY KEY,
        value    VARCHAR(255) NOT NULL
      );
    `);

    console.log('Clearing existing data (if any)...');
    await pool.query('TRUNCATE TABLE products');

    console.log(`Starting to seed ${TOTAL_ROWS} products...`);

    const nowMs = Date.now();
    const twoYearsMs = 730 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < BATCHES; i += CONCURRENT_BATCHES) {
      const promises = [];
      const currentConcurrency = Math.min(CONCURRENT_BATCHES, BATCHES - i);

      for (let j = 0; j < currentConcurrency; j++) {
        const batchValues = [];
        for (let k = 0; k < BATCH_SIZE; k++) {
          const name = generateRandomName();
          const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
          const price = parseFloat((Math.random() * (2999.99 - 4.99) + 4.99).toFixed(2));
          const created_at = nowMs - Math.floor(Math.random() * twoYearsMs);
          const updated_at = created_at + Math.floor(Math.random() * (nowMs - created_at));

          batchValues.push([name, category, price, created_at, updated_at]);
        }

        promises.push(
          pool.query(
            'INSERT INTO products (name, category, price, created_at, updated_at) VALUES ?',
            [batchValues]
          )
        );
      }

      console.log(`Running batch group ${i / CONCURRENT_BATCHES + 1} of ${Math.ceil(BATCHES / CONCURRENT_BATCHES)}...`);
      await Promise.all(promises);
    }

    console.log('Writing product count to metadata table...');
    await pool.query(`
      INSERT INTO metadata (key_name, value) VALUES ('product_count', '${TOTAL_ROWS}')
      ON DUPLICATE KEY UPDATE value = '${TOTAL_ROWS}'
    `);

    const totalTimeMs = Date.now() - startTime;
    console.log(`Seeding completed successfully in ${totalTimeMs / 1000} seconds.`);

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

runSeed();
