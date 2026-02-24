const { Pool } = require('pg');
require('dotenv').config();

const parseBoolean = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

const buildPgConfig = () => {
  const hasConnectionString = Boolean(process.env.DATABASE_URL);

  if (hasConnectionString) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: parseBoolean(process.env.DB_SSL) ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.DB_POOL_MAX || 10),
    };
  }

  return {
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
    user: process.env.PGUSER || process.env.DB_USER,
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
    database: process.env.PGDATABASE || process.env.DB_NAME,
    ssl: parseBoolean(process.env.DB_SSL) ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.DB_POOL_MAX || 10),
  };
};

const pgPool = new Pool(buildPgConfig());

const toPgPlaceholders = (sql) => {
  let placeholderIndex = 0;

  return sql
    .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, "'$1'")
    .replace(/\?/g, () => {
      placeholderIndex += 1;
      return `$${placeholderIndex}`;
    });
};

const buildResult = (sql, result) => {
  const trimmedSql = sql.trim().toUpperCase();

  if (trimmedSql.startsWith('SELECT') || trimmedSql.startsWith('WITH')) {
    return [result.rows];
  }

  if (trimmedSql.startsWith('INSERT')) {
    return [{
      insertId: result.rows?.[0]?.id || null,
      affectedRows: result.rowCount,
    }];
  }

  return [{
    affectedRows: result.rowCount,
  }];
};

const ensureReturningId = (sql) => {
  const trimmedSql = sql.trim();

  if (!/^INSERT\s+INTO/i.test(trimmedSql)) {
    return trimmedSql;
  }

  if (/\bRETURNING\b/i.test(trimmedSql)) {
    return trimmedSql;
  }

  return `${trimmedSql} RETURNING id`;
};

const createConnectionAdapter = (client) => ({
  query: async (sql, params = []) => {
    try {
      const preparedSql = ensureReturningId(toPgPlaceholders(sql));
      const result = await client.query(preparedSql, params);
      return buildResult(sql, result);
    } catch (error) {
      if (error.code === '23505') {
        error.code = 'ER_DUP_ENTRY';
      }
      throw error;
    }
  },
  release: async () => {
    client.release();
  },
});

const pool = {
  getConnection: async () => {
    const client = await pgPool.connect();
    return createConnectionAdapter(client);
  },
};

// Test connection
pgPool.connect()
  .then((client) => {
    console.log('✅ Database connected successfully');
    client.release();
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Host:', process.env.PGHOST || process.env.DB_HOST);
    console.error('   User:', process.env.PGUSER || process.env.DB_USER);
    console.error('   Database:', process.env.PGDATABASE || process.env.DB_NAME);
  });

module.exports = pool;
