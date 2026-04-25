const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY is_read ASC, created_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [user_id]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/read-all', auth, async (req, res) => {
  try {
    const user_id = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [user_id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
