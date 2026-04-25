const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { question_id, answer, comment } = req.body;
    const user_id = req.user.id;
    const year = new Date().getFullYear();

    if (answer === null || answer === undefined) {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const existingAnswer = await pool.query(
      'SELECT * FROM answers WHERE question_id = $1 AND user_id = $2 AND year = $3',
      [question_id, user_id, year]
    );

    if (existingAnswer.rows.length > 0) {
      const existing = existingAnswer.rows[0];
      if (existing.status === 'approved') {
        return res.status(403).json({ error: 'Cannot edit approved answer' });
      }

      const result = await pool.query(
        `UPDATE answers 
         SET answer = $1, comment = $2, status = 'pending', updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 RETURNING *`,
        [answer, comment, existing.id]
      );
      res.json(result.rows[0]);
    } else {
      const result = await pool.query(
        `INSERT INTO answers (question_id, user_id, year, answer, comment, status)
         VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
        [question_id, user_id, year, answer, comment]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { answer, comment } = req.body;
    const user_id = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM answers WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (existing.rows[0].status === 'approved') {
      return res.status(403).json({ error: 'Cannot edit approved answer' });
    }

    const result = await pool.query(
      `UPDATE answers 
       SET answer = $1, comment = $2, status = 'pending', updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [answer, comment, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update answer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-answers', auth, async (req, res) => {
  try {
    const user_id = req.user.id;
    const year = new Date().getFullYear();

    const result = await pool.query(
      `SELECT a.*, q.question_code, q.question_text, r.ref_code, c.champ_code, d.domain_number
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       JOIN refs r ON q.ref_id = r.id
       JOIN champs c ON r.champ_id = c.id
       JOIN domains d ON c.domain_id = d.id
       WHERE a.user_id = $1 AND a.year = $2
       ORDER BY d.domain_number, c.sort_order, r.sort_order, q.sort_order`,
      [user_id, year]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get my answers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*, q.question_code, q.question_text, r.ref_code, r.title as ref_title,
         c.champ_code, c.title as champ_title, d.domain_number, d.title as domain_title,
         u.username as user_username, u.role as user_role
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

    res.json(answer);
  } catch (err) {
    console.error('Get answer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
