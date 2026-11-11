import { useState } from 'react';
import AppShell from '../components/AppShell';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { PlusIcon } from '../components/Icons';
import NoteCard from '../components/NoteCard';
import NoteModal from '../components/NoteModal';
import NoteSkeletons from '../components/NoteSkeleton';
import SearchInput from '../components/SearchInput';
import { useToast } from '../context/ToastContext';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useNotes from '../hooks/useNotes';

export default function NotesPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const { notes, status, reload, createNote, updateNote, removeNote } = useNotes(debouncedSearch);

  const [editor, setEditor] = useState({ open: false, note: null });
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => setEditor({ open: true, note: null });
  const openEdit = (note) => setEditor({ open: true, note });
  const closeEditor = () => setEditor((current) => ({ ...current, open: false }));

  const handleSave = async (values) => {
    if (editor.note) {
      await updateNote(editor.note._id, values);
      toast.success('Note updated.');
    } else {
      await createNote(values);
      toast.success('Note created.');
    }
    closeEditor();
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await removeNote(noteToDelete._id);
      toast.success('Note deleted.');
      setNoteToDelete(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const isSearching = Boolean(debouncedSearch);

  const renderBody = () => {
    if (status === 'loading') return <NoteSkeletons />;
    if (status === 'error') return <ErrorState onRetry={reload} />;
    if (!notes.length && !isSearching) return <EmptyState onCreate={openCreate} />;
    if (!notes.length) {
      return (
        <div className="empty-state">
          <h2>No matching notes</h2>
          <p>Nothing matches “{debouncedSearch}”. Try a different search.</p>
        </div>
      );
    }
    return (
      <div className="note-grid">
        {notes.map((note) => (
          <NoteCard key={note._id} note={note} onEdit={openEdit} onDelete={setNoteToDelete} />
        ))}
      </div>
    );
  };

  return (
    <AppShell onCreate={openCreate}>
      <div className="page-header">
        <h1>All notes</h1>
        <div className="page-actions">
          <SearchInput value={search} onChange={setSearch} />
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <PlusIcon /> New note
          </button>
        </div>
      </div>
      {renderBody()}
      <NoteModal open={editor.open} note={editor.note} onSave={handleSave} onClose={closeEditor} />
      <ConfirmDialog
        open={Boolean(noteToDelete)}
        title="Delete this note?"
        message={noteToDelete ? `“${noteToDelete.title}” will be permanently deleted. This can’t be undone.` : ''}
        confirmLabel="Delete note"
        busy={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setNoteToDelete(null)}
      />
    </AppShell>
  );
}
