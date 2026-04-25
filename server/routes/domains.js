const express = require('express');
const pool = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM domains WHERE is_active = true ORDER BY domain_number'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get domains error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM domains WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get domain error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/champs', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM champs WHERE domain_id = $1 ORDER BY sort_order',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get champs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/with-progress', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const year = new Date().getFullYear();

    const domainResult = await pool.query('SELECT * FROM domains WHERE id = $1', [id]);
    if (domainResult.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const champsResult = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM questions q 
         JOIN refs r ON q.ref_id = r.id 
         WHERE r.champ_id = c.id) as total_questions,
        (SELECT COUNT(DISTINCT a.question_id) FROM answers a 
         JOIN questions q ON a.question_id = q.id 
         JOIN refs r ON q.ref_id = r.id 
         WHERE r.champ_id = c.id AND a.user_id = $1 AND a.year = $2 AND a.answer IS NOT NULL) as answered_questions
       FROM champs c WHERE c.domain_id = $3 ORDER BY c.sort_order`,
      [userId, year, id]
    );

    const domain = domainResult.rows[0];
    const champs = champsResult.rows;

    const totalQuestions = champs.reduce((sum, c) => sum + parseInt(c.total_questions), 0);
    const answeredQuestions = champs.reduce((sum, c) => sum + parseInt(c.answered_questions), 0);

    res.json({
      ...domain,
      champs,
      total_questions: totalQuestions,
      answered_questions: answeredQuestions,
      progress_percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
    });
  } catch (err) {
    console.error('Get domain with progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { domain_number, title, description } = req.body;
    
    if (!domain_number || !title) {
      return res.status(400).json({ error: 'Missing required fields: domain_number, title' });
    }
    
    const result = await pool.query(
      'INSERT INTO domains (domain_number, title, description) VALUES ($1, $2, $3) RETURNING *',
      [domain_number, title, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create domain error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_active } = req.body;
    
    const result = await pool.query(
      'UPDATE domains SET title = $1, description = $2, is_active = $3 WHERE id = $4 RETURNING *',
      [title, description, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update domain error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const domainResult = await pool.query('SELECT domain_number FROM domains WHERE id = $1', [id]);
    if (domainResult.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    const deletedNumber = domainResult.rows[0].domain_number;
    await pool.query('DELETE FROM domains WHERE id = $1', [id]);
    await pool.query(
      'UPDATE domains SET domain_number = domain_number - 1 WHERE domain_number > $1',
      [deletedNumber]
    );
    res.json({ message: 'Domain deleted' });
  } catch (err) {
    console.error('Delete domain error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
