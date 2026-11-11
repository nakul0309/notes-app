const express = require('express');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  noteBodySchema,
  noteParamsSchema,
  noteQuerySchema,
} = require('../validators/noteValidators');
const {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');

const router = express.Router();

router.use(protect);

router.get('/', validate(noteQuerySchema, 'query'), listNotes);
router.post('/', validate(noteBodySchema), createNote);
router.get('/:id', validate(noteParamsSchema, 'params'), getNote);
router.put('/:id', validate(noteParamsSchema, 'params'), validate(noteBodySchema), updateNote);
router.delete('/:id', validate(noteParamsSchema, 'params'), deleteNote);

module.exports = router;
