import { NavLink } from 'react-router-dom';
import { NotesIcon, PlusIcon, CloseIcon } from './Icons';

export default function Sidebar({ id, isOpen, onCreate, onClose }) {
  return (
    <aside id={id} className={`sidebar${isOpen ? ' is-open' : ''}`} aria-label="Primary">
      <div className="sidebar-header">
        <span className="brand">Notes</span>
        <button type="button" className="icon-btn sidebar-close" onClick={onClose} aria-label="Close menu">
          <CloseIcon />
        </button>
      </div>
      <button type="button" className="btn btn-sidebar" onClick={onCreate}>
        <PlusIcon /> New note
      </button>
      <nav>
        <NavLink to="/" end className="nav-link">
          <NotesIcon /> All notes
        </NavLink>
      </nav>
    </aside>
  );
}
