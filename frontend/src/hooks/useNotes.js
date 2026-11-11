import { useCallback, useEffect, useState } from 'react';
import * as notesApi from '../api/notesApi';

export default function useNotes(search) {
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    notesApi
      .listNotes(search)
      .then((data) => {
        if (ignore) return;
        setNotes(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!ignore) setStatus('error');
      });
    return () => {
      ignore = true;
    };
  }, [search, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const createNote = useCallback(async (values) => {
    const note = await notesApi.createNote(values);
    setNotes((current) => [note, ...current]);
    return note;
  }, []);

  const updateNote = useCallback(async (id, values) => {
    const note = await notesApi.updateNote(id, values);
    setNotes((current) => [note, ...current.filter((item) => item._id !== id)]);
    return note;
  }, []);

  const removeNote = useCallback(async (id) => {
    await notesApi.deleteNote(id);
    setNotes((current) => current.filter((item) => item._id !== id));
  }, []);

  return { notes, status, reload, createNote, updateNote, removeNote };
}
