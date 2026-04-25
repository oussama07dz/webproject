const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/domain/:id/:year', auth, async (req, res) => {
  try {
    const { id, year } = req.params;

    const domainResult = await pool.query('SELECT * FROM domains WHERE id = $1', [id]);
    if (domainResult.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const champStats = await pool.query(
      `SELECT c.id, c.champ_code, c.title,
        (SELECT COUNT(*) FROM questions q 
         JOIN refs r ON q.ref_id = r.id 
         WHERE r.champ_id = c.id) as total_questions,
        (SELECT COUNT(DISTINCT a.question_id) FROM answers a 
         WHERE a.year = $1 AND a.answer IS NOT NULL
         AND a.question_id IN (
           SELECT q.id FROM questions q 
           JOIN refs r ON q.ref_id = r.id 
           WHERE r.champ_id = c.id
         )) as answered_questions
       FROM champs c WHERE c.domain_id = $2`,
      [year, id]
    );

    const yesNoStats = await pool.query(
      `SELECT 
        SUM(CASE WHEN a.answer = true THEN 1 ELSE 0 END) as yes_count,
        SUM(CASE WHEN a.answer = false THEN 1 ELSE 0 END) as no_count,
        SUM(CASE WHEN a.answer IS NULL THEN 1 ELSE 0 END) as not_answered
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       JOIN refs r ON q.ref_id = r.id
       JOIN champs c ON r.champ_id = c.id
       WHERE c.domain_id = $1 AND a.year = $2`,
      [id, year]
    );

    const statusStats = await pool.query(
      `SELECT 
        a.status,
        COUNT(*) as count
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       JOIN refs r ON q.ref_id = r.id
       JOIN champs c ON r.champ_id = c.id
       WHERE c.domain_id = $1 AND a.year = $2
       GROUP BY a.status`,
      [id, year]
    );

    const roleStats = await pool.query(
      `SELECT 
        u.role,
        COUNT(DISTINCT a.question_id) as answered_questions,
        (SELECT COUNT(*) FROM questions q 
         JOIN refs r ON q.ref_id = r.id 
         JOIN champs c ON r.champ_id = c.id 
         WHERE c.domain_id = $1
         AND q.id IN (SELECT question_id FROM question_roles WHERE role = u.role)) as total_questions
       FROM answers a
       JOIN users u ON a.user_id = u.id
       WHERE a.year = $2 AND a.answer IS NOT NULL
       GROUP BY u.role`,
      [id, year]
    );

    res.json({
      domain: domainResult.rows[0],
      year: parseInt(year),
      champs: champStats.rows,
      yes_no: yesNoStats.rows[0],
      status: statusStats.rows,
      by_role: roleStats.rows
    });
  } catch (err) {
    console.error('Get domain stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/overview/:year', auth, async (req, res) => {
  try {
    const { year } = req.params;

    const domainStats = await pool.query(
      `SELECT d.id, d.domain_number, d.title,
        COUNT(DISTINCT c.id) as champs_count,
        COUNT(DISTINCT r.id) as refs_count,
        COUNT(DISTINCT q.id) as questions_count,
        (SELECT COUNT(*) FROM answers a 
         JOIN questions q2 ON a.question_id = q2.id 
         JOIN refs r2 ON q2.ref_id = r2.id 
         JOIN champs c2 ON r2.champ_id = c2.id 
         WHERE c2.domain_id = d.id AND a.year = $1 AND a.answer IS NOT NULL) as answered_questions
       FROM domains d
       LEFT JOIN champs c ON c.domain_id = d.id
       LEFT JOIN refs r ON r.champ_id = c.id
       LEFT JOIN questions q ON q.ref_id = r.id
       WHERE d.is_active = true
       GROUP BY d.id
       ORDER BY d.domain_number`,
      [year]
    );

    const totalStats = await pool.query(
      `SELECT 
        COUNT(DISTINCT a.question_id) as answered_questions,
        SUM(CASE WHEN a.answer = true THEN 1 ELSE 0 END) as yes_count,
        SUM(CASE WHEN a.answer = false THEN 1 ELSE 0 END) as no_count,
        SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
       FROM answers a WHERE a.year = $1`,
      [year]
    );

    res.json({
      year: parseInt(year),
      domains: domainStats.rows,
      totals: totalStats.rows[0]
    });
  } catch (err) {
    console.error('Get overview stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
