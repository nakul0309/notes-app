import { PlusIcon } from './Icons';

export default function EmptyState({ onCreate }) {
  return (
    <div className="empty-state">
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
        <rect x="18" y="12" width="60" height="72" rx="10" fill="var(--accent-tint)" stroke="var(--accent)" strokeWidth="3" />
        <path d="M32 34h32M32 48h32M32 62h18" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <h2>No notes yet</h2>
      <p>Capture your first idea, task, or reminder. It will be saved to your account.</p>
      <button type="button" className="btn btn-primary" onClick={onCreate}>
        <PlusIcon /> Create Your First Note
      </button>
    </div>
  );
}
