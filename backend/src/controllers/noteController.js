const Note = require('../models/Note');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findOwnedNote = async (noteId, userId) => {
  const note = await Note.findOne({ _id: noteId, user: userId });
  if (!note) throw new ApiError(404, 'Note not found', 'NOT_FOUND');
  return note;
};

const listNotes = asyncHandler(async (req, res) => {
  const filter = { user: req.user.id };
  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ title: pattern }, { content: pattern }];
  }
  const notes = await Note.find(filter).sort({ updatedAt: -1 });
  res.json({ notes });
});

const getNote = asyncHandler(async (req, res) => {
  const note = await findOwnedNote(req.params.id, req.user.id);
  res.json({ note });
});

const createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const note = await Note.create({ user: req.user.id, title, content });
  res.status(201).json({ note });
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await findOwnedNote(req.params.id, req.user.id);
  note.title = req.body.title;
  note.content = req.body.content;
  await note.save();
  res.json({ note });
});

const deleteNote = asyncHandler(async (req, res) => {
  const note = await findOwnedNote(req.params.id, req.user.id);
  await note.deleteOne();
  res.status(204).end();
});

module.exports = { listNotes, getNote, createNote, updateNote, deleteNote };
