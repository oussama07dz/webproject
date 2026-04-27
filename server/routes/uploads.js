const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { answer_id } = req.body;
    const user_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!answer_id) {
      return res.status(400).json({ error: 'Answer ID is required' });
    }

    const answerCheck = await pool.query(
      'SELECT * FROM answers WHERE id = $1 AND user_id = $2',
      [answer_id, user_id]
    );

    if (answerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answerCheck.rows[0].status === 'approved') {
      return res.status(403).json({ error: 'Cannot upload to approved answer' });
    }

    const columnsQuery = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'uploads'");
    console.log('Runtime columns:', columnsQuery.rows.map(r => r.column_name));

    const uniqueName = `${Date.now()}_${uuidv4()}${path.extname(req.file.originalname)}`;
    
    const result = await pool.query(
      `INSERT INTO uploads (answer_id, filename, original_name, file_data, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, answer_id, filename, original_name, file_type, file_size, uploaded_at`,
      [
        answer_id,
        uniqueName,
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype,
        req.file.size
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const uploadCheck = await pool.query(
      `SELECT u.*, a.user_id, a.status 
       FROM uploads u 
       JOIN answers a ON u.answer_id = a.id 
       WHERE u.id = $1`,
      [id]
    );

    if (uploadCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    const upload = uploadCheck.rows[0];

    if (upload.user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (upload.status === 'approved') {
      return res.status(403).json({ error: 'Cannot delete file from approved answer' });
    }

    await pool.query('DELETE FROM uploads WHERE id = $1', [id]);

    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/download', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT original_name, file_type, file_data FROM uploads WHERE id = $1', [id]);

    if (result.rows.length === 0 || !result.rows[0].file_data) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = result.rows[0];
    
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Type', file.file_type || 'application/octet-stream');
    res.send(file.file_data);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
