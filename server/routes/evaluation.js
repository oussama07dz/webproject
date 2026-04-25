const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/domains', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const year = new Date().getFullYear();

    const domainsResult = await pool.query(
      'SELECT * FROM domains WHERE is_active = true ORDER BY domain_number'
    );

    const domains = await Promise.all(domainsResult.rows.map(async (domain) => {
      const champsResult = await pool.query(
        `SELECT c.*, 
          (SELECT COUNT(*) FROM questions q 
           JOIN refs r ON q.ref_id = r.id 
           WHERE r.champ_id = c.id 
           AND q.id IN (SELECT question_id FROM question_roles WHERE role = $1)) as total_questions,
          (SELECT COUNT(DISTINCT a.question_id) FROM answers a 
           WHERE a.user_id = $2 AND a.year = $3 AND a.answer IS NOT NULL
           AND a.question_id IN (
             SELECT q.id FROM questions q 
             JOIN refs r ON q.ref_id = r.id 
             JOIN champs c2 ON r.champ_id = c2.id 
             WHERE c2.id = c.id
           )) as answered_questions
         FROM champs c 
         WHERE c.domain_id = $4 
         ORDER BY c.sort_order`,
        [req.user.role, userId, year, domain.id]
      );

      const champs = champsResult.rows;
      const totalQuestions = champs.reduce((sum, c) => sum + parseInt(c.total_questions || 0), 0);
      const answeredQuestions = champs.reduce((sum, c) => sum + parseInt(c.answered_questions || 0), 0);

      return {
        ...domain,
        champs,
        total_questions: totalQuestions,
        answered_questions: answeredQuestions,
        progress_percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
      };
    }));

    res.json(domains);
  } catch (err) {
    console.error('Get evaluation domains error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/champs/:domainId', auth, async (req, res) => {
  try {
    const { domainId } = req.params;
    const userId = req.user.id;
    const year = new Date().getFullYear();

    const result = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM questions q 
         JOIN refs r ON q.ref_id = r.id 
         WHERE r.champ_id = c.id 
         AND q.id IN (SELECT question_id FROM question_roles WHERE role = $1)) as total_questions,
        (SELECT COUNT(DISTINCT a.question_id) FROM answers a 
         WHERE a.user_id = $2 AND a.year = $3 AND a.answer IS NOT NULL
         AND a.question_id IN (
           SELECT q.id FROM questions q 
           JOIN refs r ON q.ref_id = r.id 
           WHERE r.champ_id = c.id
         )) as answered_questions
       FROM champs c 
       WHERE c.domain_id = $4 
       ORDER BY c.sort_order`,
      [req.user.role, userId, year, domainId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get evaluation champs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/refs/:champId', auth, async (req, res) => {
  try {
    const { champId } = req.params;
    const userId = req.user.id;
    const year = new Date().getFullYear();

    const result = await pool.query(
      `SELECT r.*, 
        (SELECT COUNT(*) FROM questions q 
         WHERE q.ref_id = r.id 
         AND q.id IN (SELECT question_id FROM question_roles WHERE role = $1)) as total_questions,
        (SELECT COUNT(DISTINCT a.question_id) FROM answers a 
         WHERE a.user_id = $2 AND a.year = $3 AND a.answer IS NOT NULL
         AND a.question_id IN (
           SELECT q.id FROM questions q WHERE q.ref_id = r.id
         )) as answered_questions
       FROM refs r 
       WHERE r.champ_id = $4 
       ORDER BY r.sort_order`,
      [req.user.role, userId, year, champId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get evaluation refs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/questions/:refId', auth, async (req, res) => {
  try {
    const { refId } = req.params;
    const userId = req.user.id;
    const year = new Date().getFullYear();

    const result = await pool.query(
      `SELECT q.*, 
        (SELECT array_agg(role) FROM question_roles WHERE question_id = q.id) as roles,
        (SELECT json_build_object(
          'id', a.id,
          'answer', a.answer,
          'comment', a.comment,
          'status', a.status,
          'admin_comment', a.admin_comment,
          'created_at', a.created_at,
          'uploads', (
            SELECT json_agg(json_build_object(
              'id', u.id,
              'filename', u.filename,
              'original_name', u.original_name,
              'file_type', u.file_type,
              'file_size', u.file_size,
              'uploaded_at', u.uploaded_at
            ))
            FROM uploads u WHERE u.answer_id = a.id
          )
        )
        FROM answers a 
        WHERE a.question_id = q.id AND a.user_id = $1 AND a.year = $2
        ) as user_answer
       FROM questions q 
       WHERE q.ref_id = $3 AND q.id IN (SELECT question_id FROM question_roles WHERE role = $4)
       ORDER BY q.sort_order`,
      [userId, year, refId, req.user.role]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get evaluation questions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/question/:questionId', auth, async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;
    const year = new Date().getFullYear();

    const result = await pool.query(
      `SELECT q.*, 
        r.id as ref_id,
        r.ref_code,
        r.title as ref_title,
        c.id as champ_id,
        c.champ_code,
        c.title as champ_title,
        d.id as domain_id,
        d.title as domain_title,
        (SELECT array_agg(role) FROM question_roles WHERE question_id = q.id) as roles,
        (SELECT json_agg(proof_text) FROM proofs WHERE question_id = q.id) as proofs,
        (SELECT json_build_object(
          'id', a.id,
          'answer', a.answer,
          'comment', a.comment,
          'status', a.status,
          'admin_comment', a.admin_comment,
          'created_at', a.created_at,
          'uploads', (
            SELECT json_agg(json_build_object(
              'id', u.id,
              'filename', u.filename,
              'original_name', u.original_name,
              'file_type', u.file_type,
              'file_size', u.file_size,
              'uploaded_at', u.uploaded_at
            ))
            FROM uploads u WHERE u.answer_id = a.id
          )
        )
        FROM answers a 
        WHERE a.question_id = q.id AND a.user_id = $1 AND a.year = $2
        ) as user_answer
       FROM questions q 
       JOIN refs r ON q.ref_id = r.id
       JOIN champs c ON r.champ_id = c.id
       JOIN domains d ON c.domain_id = d.id
       WHERE q.id = $3`,
      [userId, year, questionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get evaluation question error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
