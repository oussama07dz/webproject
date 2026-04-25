const express = require('express');
const pool = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/champs', auth, adminOnly, async (req, res) => {
  try {
    const { domain_id } = req.query;
    let query = 'SELECT c.*, d.title as domain_title FROM champs c JOIN domains d ON c.domain_id = d.id';
    let params = [];
    
    if (domain_id) {
      query += ' WHERE c.domain_id = $1';
      params.push(domain_id);
    }
    
    query += ' ORDER BY d.domain_number, c.sort_order';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get admin champs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/champs', auth, adminOnly, async (req, res) => {
  try {
    const { domain_id, champ_code, title } = req.body;
    
    if (!domain_id || !champ_code || !title) {
      return res.status(400).json({ error: 'Missing required fields: domain_id, champ_code, title' });
    }
    
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM champs WHERE domain_id = $1',
      [domain_id]
    );
    
    const result = await pool.query(
      'INSERT INTO champs (domain_id, champ_code, title, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [domain_id, champ_code, title, maxOrder.rows[0].next_order]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create champ error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/champs/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { champ_code, title, sort_order } = req.body;
    
    if (!champ_code || !title) {
      return res.status(400).json({ error: 'Missing required fields: champ_code, title' });
    }
    
    const result = await pool.query(
      'UPDATE champs SET champ_code = $1, title = $2, sort_order = $3 WHERE id = $4 RETURNING *',
      [champ_code, title, sort_order, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Champ not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update champ error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/champs/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const champResult = await pool.query('SELECT domain_id, sort_order FROM champs WHERE id = $1', [id]);
    if (champResult.rows.length === 0) {
      return res.status(404).json({ error: 'Champ not found' });
    }
    const { domain_id, sort_order } = champResult.rows[0];
    await pool.query('DELETE FROM champs WHERE id = $1', [id]);
    const remainingChamps = await pool.query(
      'SELECT id, sort_order FROM champs WHERE domain_id = $1 ORDER BY sort_order',
      [domain_id]
    );
    for (let i = 0; i < remainingChamps.rows.length; i++) {
      await pool.query(
        'UPDATE champs SET champ_code = $1, sort_order = $2 WHERE id = $3',
        [`V${i + 1}`, i + 1, remainingChamps.rows[i].id]
      );
    }
    res.json({ message: 'Champ deleted' });
  } catch (err) {
    console.error('Delete champ error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/refs', auth, adminOnly, async (req, res) => {
  try {
    const { champ_id } = req.query;
    let query = 'SELECT r.*, c.title as champ_title, c.champ_code FROM refs r JOIN champs c ON r.champ_id = c.id';
    let params = [];
    
    if (champ_id) {
      query += ' WHERE r.champ_id = $1';
      params.push(champ_id);
    }
    
    query += ' ORDER BY c.sort_order, r.sort_order';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get admin refs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/refs', auth, adminOnly, async (req, res) => {
  try {
    const { champ_id, ref_code, title, description } = req.body;
    
    if (!champ_id || !ref_code || !title) {
      return res.status(400).json({ error: 'Missing required fields: champ_id, ref_code, title' });
    }
    
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM refs WHERE champ_id = $1',
      [champ_id]
    );
    
    const result = await pool.query(
      'INSERT INTO refs (champ_id, ref_code, title, description, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [champ_id, ref_code, title, description, maxOrder.rows[0].next_order]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create ref error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/refs/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { ref_code, title, description, sort_order } = req.body;
    
    if (!ref_code || !title) {
      return res.status(400).json({ error: 'Missing required fields: ref_code, title' });
    }
    
    const result = await pool.query(
      'UPDATE refs SET ref_code = $1, title = $2, description = $3, sort_order = $4 WHERE id = $5 RETURNING *',
      [ref_code, title, description, sort_order, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ref not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update ref error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/refs/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const refResult = await pool.query('SELECT champ_id, sort_order, ref_code FROM refs WHERE id = $1', [id]);
    if (refResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ref not found' });
    }
    const { champ_id, sort_order, ref_code } = refResult.rows[0];
    if (!ref_code) {
      return res.status(400).json({ error: 'Ref code is null' });
    }
    const champResult = await pool.query('SELECT champ_code FROM champs WHERE id = $1', [champ_id]);
    const champCode = champResult.rows[0]?.champ_code;
    if (!champCode) {
      return res.status(400).json({ error: 'Champ code is null' });
    }
    await pool.query('DELETE FROM refs WHERE id = $1', [id]);
    const remainingRefs = await pool.query('SELECT id, sort_order FROM refs WHERE champ_id = $1 ORDER BY sort_order', [champ_id]);
    for (let i = 0; i < remainingRefs.rows.length; i++) {
      await pool.query(
        'UPDATE refs SET ref_code = $1, sort_order = $2 WHERE id = $3',
        [`${champCode}.${i + 1}`, i + 1, remainingRefs.rows[i].id]
      );
    }
    res.json({ message: 'Ref deleted' });
  } catch (err) {
    console.error('Delete ref error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/questions', auth, adminOnly, async (req, res) => {
  try {
    const { ref_id } = req.query;
    let query = `SELECT q.*, r.ref_code, r.title as ref_title, c.champ_code, c.title as champ_title,
      (SELECT array_agg(role) FROM question_roles WHERE question_id = q.id) as roles
      FROM questions q 
      JOIN refs r ON q.ref_id = r.id
      JOIN champs c ON r.champ_id = c.id`;
    let params = [];
    
    if (ref_id) {
      query += ' WHERE q.ref_id = $1';
      params.push(ref_id);
    }
    
    query += ' ORDER BY c.sort_order, r.sort_order, q.sort_order';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get admin questions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/questions', auth, adminOnly, async (req, res) => {
  try {
    const { ref_id, question_code, question_text, roles, proofs } = req.body;
    
    if (!ref_id || !question_code || !question_text) {
      return res.status(400).json({ error: 'Missing required fields: ref_id, question_code, question_text' });
    }
    
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM questions WHERE ref_id = $1',
      [ref_id]
    );
    
    const result = await pool.query(
      'INSERT INTO questions (ref_id, question_code, question_text, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [ref_id, question_code, question_text, maxOrder.rows[0].next_order]
    );
    
    const questionId = result.rows[0].id;
    
    if (roles && roles.length > 0) {
      for (const role of roles) {
        await pool.query(
          'INSERT INTO question_roles (question_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [questionId, role]
        );
      }
    }
    
    if (proofs && proofs.length > 0) {
      for (const proof of proofs) {
        await pool.query(
          'INSERT INTO proofs (question_id, proof_text) VALUES ($1, $2)',
          [questionId, proof]
        );
      }
    }
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/questions/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { question_code, question_text, sort_order, roles, proofs } = req.body;
    
    if (!question_code || !question_text) {
      return res.status(400).json({ error: 'Missing required fields: question_code, question_text' });
    }
    
    const result = await pool.query(
      'UPDATE questions SET question_code = $1, question_text = $2, sort_order = $3 WHERE id = $4 RETURNING *',
      [question_code, question_text, sort_order, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    if (roles) {
      await pool.query('DELETE FROM question_roles WHERE question_id = $1', [id]);
      for (const role of roles) {
        await pool.query(
          'INSERT INTO question_roles (question_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, role]
        );
      }
    }
    
    if (proofs) {
      await pool.query('DELETE FROM proofs WHERE question_id = $1', [id]);
      for (const proof of proofs) {
        await pool.query(
          'INSERT INTO proofs (question_id, proof_text) VALUES ($1, $2)',
          [id, proof]
        );
      }
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update question error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/questions/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const questionResult = await pool.query('SELECT ref_id, sort_order, question_code FROM questions WHERE id = $1', [id]);
    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    const { ref_id, sort_order, question_code } = questionResult.rows[0];
    if (!question_code) {
      return res.status(400).json({ error: 'Question code is null' });
    }
    const refResult = await pool.query('SELECT ref_code FROM refs WHERE id = $1', [ref_id]);
    const refCode = refResult.rows[0]?.ref_code;
    if (!refCode) {
      return res.status(400).json({ error: 'Ref code is null' });
    }
    await pool.query('DELETE FROM questions WHERE id = $1', [id]);
    const remainingQuestions = await pool.query('SELECT id, sort_order FROM questions WHERE ref_id = $1 ORDER BY sort_order', [ref_id]);
    for (let i = 0; i < remainingQuestions.rows.length; i++) {
      await pool.query(
        'UPDATE questions SET question_code = $1, sort_order = $2 WHERE id = $3',
        [`${refCode}.${i + 1}`, i + 1, remainingQuestions.rows[i].id]
      );
    }
    res.json({ message: 'Question deleted' });
  } catch (err) {
    console.error('Delete question error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/questions/:id/proofs', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM proofs WHERE question_id = $1', [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get proofs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get next available numbers/codes
router.get('/next-domain-number', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT COALESCE(MAX(domain_number), 0) + 1 as next FROM domains');
    res.json({ next: result.rows[0].next });
  } catch (err) {
    console.error('Get next domain number error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/next-champ-code/:domainId', auth, adminOnly, async (req, res) => {
  try {
    const { domainId } = req.params;
    const result = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM champs WHERE domain_id = $1',
      [domainId]
    );
    const nextNum = result.rows[0].next;
    res.json({ next: `V${nextNum}` });
  } catch (err) {
    console.error('Get next champ code error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/next-ref-code/:champId', auth, adminOnly, async (req, res) => {
  try {
    const { champId } = req.params;
    const champResult = await pool.query('SELECT c.*, d.domain_number FROM champs c JOIN domains d ON c.domain_id = d.id WHERE c.id = $1', [champId]);
    if (champResult.rows.length === 0) {
      return res.status(404).json({ error: 'Champ not found' });
    }
    const champ = champResult.rows[0];
    const refResult = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM refs WHERE champ_id = $1',
      [champId]
    );
    const nextNum = refResult.rows[0].next;
    res.json({ next: `${champ.champ_code}.${nextNum}` });
  } catch (err) {
    console.error('Get next ref code error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/next-question-code/:refId', auth, adminOnly, async (req, res) => {
  try {
    const { refId } = req.params;
    const refResult = await pool.query('SELECT r.*, c.champ_code FROM refs r JOIN champs c ON r.champ_id = c.id WHERE r.id = $1', [refId]);
    if (refResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ref not found' });
    }
    const ref = refResult.rows[0];
    const questionResult = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM questions WHERE ref_id = $1',
      [refId]
    );
    const nextNum = questionResult.rows[0].next;
    res.json({ next: `${ref.ref_code}.${nextNum}` });
  } catch (err) {
    console.error('Get next question code error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
