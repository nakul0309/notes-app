const { z } = require('zod');
const mongoose = require('mongoose');

const noteBodySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title is too long'),
  content: z.string().max(10000, 'Content is too long').default(''),
});

const noteParamsSchema = z.object({
  id: z.string().refine((id) => mongoose.isValidObjectId(id), 'Invalid note id'),
});

const noteQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
});

module.exports = { noteBodySchema, noteParamsSchema, noteQuerySchema };
