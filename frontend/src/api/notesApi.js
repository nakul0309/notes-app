import { request } from './client';

export const listNotes = (search = '') =>
  request(`/notes${search ? `?search=${encodeURIComponent(search)}` : ''}`).then((data) => data.notes);

export const createNote = (values) =>
  request('/notes', { method: 'POST', body: values }).then((data) => data.note);

export const updateNote = (id, values) =>
  request(`/notes/${id}`, { method: 'PUT', body: values }).then((data) => data.note);

export const deleteNote = (id) => request(`/notes/${id}`, { method: 'DELETE' });
