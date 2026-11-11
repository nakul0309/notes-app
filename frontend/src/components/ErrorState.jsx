export default function ErrorState({ onRetry }) {
  return (
    <div className="empty-state" role="alert">
      <h2>We couldn’t load your notes</h2>
      <p>Check your connection and try again.</p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
