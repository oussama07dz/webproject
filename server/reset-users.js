require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const users = [
  { username: 'admin', password: 'admin123', role: 'admin', full_name: 'Administrator' },
  { username: 'recteur', password: 'recteur123', role: 'recteur', full_name: 'Recteur' },
  { username: 'vrpd', password: 'vrpd123', role: 'vrpd', full_name: 'Vice-Rector Pedagogy' },
  { username: 'vrpg', password: 'vrpg123', role: 'vrpg', full_name: 'Vice-Rector Post-Graduation' },
  { username: 'vrel', password: 'vrel123', role: 'vrel', full_name: 'Vice-Rector External Relations' },
  { username: 'vrplan', password: 'vrplan123', role: 'vrplan', full_name: 'Vice-Rector Planning' },
  { username: 'sg', password: 'sg123', role: 'sg', full_name: 'General Secretary' },
  { username: 'doyen', password: 'doyen123', role: 'doyen', full_name: 'Dean' },
  { username: 'chef_dep', password: 'chef_dep123', role: 'chef_dep', full_name: 'Head of Department' }
];

async function resetUsers() {
  try {
    await pool.query('DELETE FROM users');
    
    for (const user of users) {
      const hash = bcrypt.hashSync(user.password + user.username, 10);
      await pool.query(
        'INSERT INTO users (username, password_hash, role, full_name) VALUES ($1, $2, $3, $4)',
        [user.username, hash, user.role, user.full_name]
      );
      console.log('Inserted:', user.username);
    }
    
    console.log('All users reset successfully!');
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

resetUsers();
