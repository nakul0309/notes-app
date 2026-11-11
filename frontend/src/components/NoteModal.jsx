import Modal from './Modal';
import NoteForm from './NoteForm';

export default function NoteModal({ open, note, onSave, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={note ? 'Edit note' : 'New note'}>
      <NoteForm key={note?._id ?? 'new'} note={note} onSave={onSave} onCancel={onClose} />
    </Modal>
  );
}
