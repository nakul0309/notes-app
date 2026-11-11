import { useState } from 'react';
import FormField from './FormField';
import { useToast } from '../context/ToastContext';
import { validateNote } from '../utils/validation';

export default function NoteForm({ note, onSave, onCancel }) {
  const toast = useToast();
  const [values, setValues] = useState({ title: note?.title ?? '', content: note?.content ?? '' });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateNote(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setIsSaving(true);
    try {
      await onSave({ title: values.title.trim(), content: values.content });
    } catch (error) {
      setErrors(error.fieldErrors ?? {});
      toast.error(error.message);
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField
        label="Title"
        name="title"
        value={values.title}
        onChange={handleChange}
        error={errors.title}
        maxLength={120}
        autoFocus
      />
      <FormField
        label="Content"
        name="content"
        value={values.content}
        onChange={handleChange}
        error={errors.content}
        multiline
      />
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving…' : note ? 'Save changes' : 'Create note'}
        </button>
      </div>
    </form>
  );
}
