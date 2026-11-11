import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ProfileMenu from './ProfileMenu';
import { MenuIcon } from './Icons';

const SIDEBAR_ID = 'app-sidebar';

export default function AppShell({ onCreate, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const handleCreate = () => {
    setIsSidebarOpen(false);
    onCreate();
  };

  return (
    <div className="shell">
      <Sidebar
        id={SIDEBAR_ID}
        isOpen={isSidebarOpen}
        onCreate={handleCreate}
        onClose={() => setIsSidebarOpen(false)}
      />
      {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />}
      <div className="shell-main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-toggle"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
            aria-expanded={isSidebarOpen}
            aria-controls={SIDEBAR_ID}
          >
            <MenuIcon />
          </button>
          <ProfileMenu />
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
