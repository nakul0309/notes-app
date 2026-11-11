import { TrashIcon } from './Icons';
import { formatDate } from '../utils/formatDate';

export default function NoteCard({ note, onEdit, onDelete }) {
  return (
    <article className="note-card">
      <button type="button" className="note-card-main" onClick={() => onEdit(note)}>
        <h3 className="note-card-title">{note.title}</h3>
        <p className="note-card-preview">{note.content || 'No content'}</p>
        <time className="note-card-date" dateTime={note.updatedAt}>
          Updated {formatDate(note.updatedAt)}
        </time>
      </button>
      <button
        type="button"
        className="icon-btn note-card-delete"
        onClick={() => onDelete(note)}
        aria-label={`Delete note ${note.title}`}
      >
        <TrashIcon />
      </button>
    </article>
  );
}
