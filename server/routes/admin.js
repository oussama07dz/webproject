const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/pending', auth, adminOnly, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    
    const result = await pool.query(
      `SELECT a.*, q.question_code, q.question_text, 
         r.ref_code, c.champ_code, d.domain_number,
         u.username, u.role as user_role, u.full_name
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       JOIN refs r ON q.ref_id = r.id
       JOIN champs c ON r.champ_id = c.id
       JOIN domains d ON c.domain_id = d.id
       JOIN users u ON a.user_id = u.id
       WHERE a.year = $1 AND a.status = 'pending'
       ORDER BY a.created_at DESC`,
      [year]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get pending error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/answers/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*, q.question_code, q.question_text, r.ref_code, r.title as ref_title,
         c.champ_code, c.title as champ_title, d.domain_number, d.title as domain_title,
         u.username as user_username, u.role as user_role, u.full_name
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       JOIN refs r ON q.ref_id = r.id
       JOIN champs c ON r.champ_id = c.id
       JOIN domains d ON c.domain_id = d.id
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const answer = result.rows[0];

    const uploadsResult = await pool.query(
      'SELECT * FROM uploads WHERE answer_id = $1',
      [id]
    );

    answer.uploads = uploadsResult.rows;

    const proofsResult = await pool.query(
      'SELECT * FROM proofs WHERE question_id = $1',
      [answer.question_id]
    );

    answer.proofs = proofsResult.rows;

    res.json(answer);
  } catch (err) {
    console.error('Get admin answer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/answers/:id/review', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_comment } = req.body;
    const admin_id = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await pool.query('SELECT * FROM answers WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const result = await pool.query(
      `UPDATE answers 
       SET status = $1, admin_comment = $2, reviewed_by = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [status, admin_comment, admin_id, id]
    );

    if (status === 'rejected') {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, answer_id)
         VALUES ($1, 'rejected', 'Answer Rejected', $2, $3)`,
        [existing.rows[0].user_id, `Your answer has been rejected. Reason: ${admin_comment || 'No reason provided'}`, id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Review answer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, role, full_name, created_at FROM users ORDER BY role, username'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, password, role, full_name } = req.body;

    const password_hash = await bcrypt.hash(password + username, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, role, full_name',
      [username, password_hash, role, full_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, password } = req.body;

    let query = 'UPDATE users SET full_name = $1, role = $2';
    let params = [full_name, role, id];

    if (password) {
      const password_hash = await bcrypt.hash(password + req.body.username, 10);
      query = 'UPDATE users SET full_name = $1, role = $2, password_hash = $3';
      params = [full_name, role, password_hash, id];
    }

    query += ' WHERE id = $' + params.length + ' RETURNING id, username, role, full_name';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // Start transaction
    await pool.query('BEGIN');

    // Delete related records in order (due to foreign key constraints)
    // Delete notifications for this user
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [id]);
    
    // Delete answers uploaded files for this user's answers
    await pool.query('DELETE FROM uploads WHERE answer_id IN (SELECT id FROM answers WHERE user_id = $1)', [id]);
    
    // Delete answers for this user
    await pool.query('DELETE FROM answers WHERE user_id = $1', [id]);
    
    // Finally delete the user
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query('COMMIT');
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/all-answers', auth, adminOnly, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const { status, domain_id } = req.query;

    let query = `
      SELECT a.*, q.question_code, q.question_text, 
        r.ref_code, c.champ_code, d.domain_number,
        u.username, u.role as user_role, u.full_name
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      JOIN refs r ON q.ref_id = r.id
      JOIN champs c ON r.champ_id = c.id
      JOIN domains d ON c.domain_id = d.id
      JOIN users u ON a.user_id = u.id
      WHERE a.year = $1
    `;
    const params = [year];

    if (status) {
      query += ' AND a.status = $2';
      params.push(status);
    }

    if (domain_id) {
      query += params.length === 2 ? ' AND d.id = $3' : ' AND d.id = $2';
      params.push(domain_id);
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get all answers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
