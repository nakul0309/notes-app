export default function NoteSkeletons({ count = 6 }) {
  return (
    <div className="note-grid" aria-busy="true" aria-label="Loading notes">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="note-card skeleton-card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  );
}
