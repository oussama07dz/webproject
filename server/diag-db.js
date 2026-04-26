const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'qa_platform',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkTable() {
  try {
    const context = await pool.query('SELECT current_database(), current_user, inet_server_addr(), inet_server_port();');
    
    const res = await pool.query(`
      SELECT column_name, data_type, is_nullable, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'uploads'
      ORDER BY ordinal_position;
    `);
    
    const constraints = await pool.query(`
      SELECT conname, contype, format_type(confrelid, -1) as remote_table
      FROM pg_constraint c
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE cl.relname = 'uploads';
    `);

    const output = {
      env: {
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER
      },
      context: context.rows[0],
      columns: res.rows,
      constraints: constraints.rows
    };
    fs.writeFileSync('diag-output.json', JSON.stringify(output, null, 2));
    console.log('Results written to diag-output.json');

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkTable();
