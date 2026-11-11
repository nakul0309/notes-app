import { useId } from 'react';

export default function FormField({ label, error, multiline = false, rows = 8, ...inputProps }) {
  const id = useId();
  const errorId = `${id}-error`;
  const Control = multiline ? 'textarea' : 'input';

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Control
        id={id}
        rows={multiline ? rows : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
